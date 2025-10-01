const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get Firestore instance
const db = admin.firestore();
const teamsCollection = db.collection('teams');
const usersCollection = db.collection('users');

// Set up storage for team logos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = 'uploads/teams/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        cb(null, `team-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check file type
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private/Manager
router.post('/', protect, authorize('manager'), async (req, res) => {
    try {
        const teamData = {
            name: req.body.name,
            sport: req.body.sport,
            logo: req.body.logo || '',
            coaches: req.body.coaches || [],
            athletes: req.body.athletes || [],
            medicalStaff: req.body.medicalStaff || [],
            managers: [req.user._id], // Add current manager as default
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const teamRef = await teamsCollection.add(teamData);
        const teamDoc = await teamRef.get();
        
        res.status(201).json({
            _id: teamRef.id,
            ...teamDoc.data()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/teams
// @desc    Get all teams
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = teamsCollection;
        
        // If user is not a manager, only show teams they are part of
        if (req.user.role !== 'manager') {
            // This is a complex query that requires a composite index in Firestore
            // For simplicity, we'll fetch all teams and filter in memory
            const teamsSnapshot = await query.get();
            const teams = [];
            
            teamsSnapshot.forEach(doc => {
                const team = {
                    _id: doc.id,
                    ...doc.data()
                };
                
                // Convert Firestore timestamp to JS Date
                if (team.createdAt && team.createdAt.toDate) {
                    team.createdAt = team.createdAt.toDate();
                }
                
                // Check if user is part of this team
                const userRole = req.user.role;
                const userId = req.user._id;
                
                if (
                    (userRole === 'coach' && team.coaches.includes(userId)) ||
                    (userRole === 'athlete' && team.athletes.includes(userId)) ||
                    (userRole === 'medical' && team.medicalStaff.includes(userId))
                ) {
                    teams.push(team);
                }
            });
            
            return res.json(teams);
        }
        
        // For managers, get all teams
        const teamsSnapshot = await query.get();
        const teams = [];
        
        teamsSnapshot.forEach(doc => {
            const team = {
                _id: doc.id,
                ...doc.data()
            };
            
            // Convert Firestore timestamp to JS Date
            if (team.createdAt && team.createdAt.toDate) {
                team.createdAt = team.createdAt.toDate();
            }
            
            teams.push(team);
        });
        
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/teams/:id
// @desc    Get team by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const teamDoc = await teamsCollection.doc(req.params.id).get();
        
        if (!teamDoc.exists) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        const team = {
            _id: teamDoc.id,
            ...teamDoc.data()
        };
        
        // Convert Firestore timestamp to JS Date
        if (team.createdAt && team.createdAt.toDate) {
            team.createdAt = team.createdAt.toDate();
        }
        
        // Check if user has permission to view this team
        if (req.user.role !== 'manager') {
            const userRole = req.user.role;
            const userId = req.user._id;
            
            const isPartOfTeam = 
                (userRole === 'coach' && team.coaches.includes(userId)) ||
                (userRole === 'athlete' && team.athletes.includes(userId)) ||
                (userRole === 'medical' && team.medicalStaff.includes(userId));
                
            if (!isPartOfTeam) {
                return res.status(403).json({ message: 'Not authorized to view this team' });
            }
        }
        
        // Get detailed user information for team members
        const coachesPromises = team.coaches.map(coachId => 
            usersCollection.doc(coachId).get()
        );
        const athletesPromises = team.athletes.map(athleteId => 
            usersCollection.doc(athleteId).get()
        );
        const medicalStaffPromises = team.medicalStaff.map(staffId => 
            usersCollection.doc(staffId).get()
        );
        const managersPromises = team.managers.map(managerId => 
            usersCollection.doc(managerId).get()
        );
        
        const [coachDocs, athleteDocs, medicalDocs, managerDocs] = await Promise.all([
            Promise.all(coachesPromises),
            Promise.all(athletesPromises),
            Promise.all(medicalStaffPromises),
            Promise.all(managersPromises)
        ]);
        
        team.coaches = coachDocs.map(doc => {
            if (doc.exists) {
                const userData = doc.data();
                return {
                    _id: doc.id,
                    name: userData.name,
                    email: userData.email,
                    profilePicture: userData.profilePicture
                };
            }
            return null;
        }).filter(Boolean);
        
        team.athletes = athleteDocs.map(doc => {
            if (doc.exists) {
                const userData = doc.data();
                return {
                    _id: doc.id,
                    name: userData.name,
                    email: userData.email,
                    profilePicture: userData.profilePicture,
                    position: userData.position
                };
            }
            return null;
        }).filter(Boolean);
        
        team.medicalStaff = medicalDocs.map(doc => {
            if (doc.exists) {
                const userData = doc.data();
                return {
                    _id: doc.id,
                    name: userData.name,
                    email: userData.email,
                    profilePicture: userData.profilePicture
                };
            }
            return null;
        }).filter(Boolean);
        
        team.managers = managerDocs.map(doc => {
            if (doc.exists) {
                const userData = doc.data();
                return {
                    _id: doc.id,
                    name: userData.name,
                    email: userData.email,
                    profilePicture: userData.profilePicture
                };
            }
            return null;
        }).filter(Boolean);
        
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/teams/:id
// @desc    Update team
// @access  Private/Manager
router.put('/:id', protect, authorize('manager'), async (req, res) => {
    try {
        const teamRef = teamsCollection.doc(req.params.id);
        const teamDoc = await teamRef.get();
        
        if (!teamDoc.exists) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        const team = teamDoc.data();
        
        // Check if manager is part of this team
        if (!team.managers.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to update this team' });
        }
        
        // Update team
        await teamRef.update(req.body);
        
        // Get updated team
        const updatedTeamDoc = await teamRef.get();
        const updatedTeam = {
            _id: updatedTeamDoc.id,
            ...updatedTeamDoc.data()
        };
        
        // Convert Firestore timestamp to JS Date
        if (updatedTeam.createdAt && updatedTeam.createdAt.toDate) {
            updatedTeam.createdAt = updatedTeam.createdAt.toDate();
        }
        
        res.json(updatedTeam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/teams/:id/logo
// @desc    Upload team logo
// @access  Private/Manager
router.post('/:id/logo', protect, authorize('manager'), upload.single('logo'), async (req, res) => {
    try {
        const teamRef = teamsCollection.doc(req.params.id);
        const teamDoc = await teamRef.get();
        
        if (!teamDoc.exists) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        const team = teamDoc.data();
        
        // Check if manager is part of this team
        if (!team.managers.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to update this team' });
        }
        
        const logo = `/uploads/teams/${req.file.filename}`;
        
        await teamRef.update({ logo });
        
        res.json({ logo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/teams/:id/members
// @desc    Add or remove team members
// @access  Private/Manager
router.put('/:id/members', protect, authorize('manager'), async (req, res) => {
    try {
        const { action, role, userId } = req.body;
        
        if (!action || !role || !userId) {
            return res.status(400).json({ message: 'Please provide action, role, and userId' });
        }
        
        if (!['add', 'remove'].includes(action)) {
            return res.status(400).json({ message: 'Action must be either add or remove' });
        }
        
        if (!['coaches', 'athletes', 'medicalStaff', 'managers'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        const teamRef = teamsCollection.doc(req.params.id);
        const teamDoc = await teamRef.get();
        
        if (!teamDoc.exists) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        const team = teamDoc.data();
        
        // Check if manager is part of this team
        if (!team.managers.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to update this team' });
        }
        
        // Check if user exists
        const userDoc = await usersCollection.doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update team members
        if (action === 'add') {
            // Check if user is already in the team
            if (team[role].includes(userId)) {
                return res.status(400).json({ message: `User is already in the team as ${role}` });
            }
            
            // Add user to team
            await teamRef.update({
                [role]: admin.firestore.FieldValue.arrayUnion(userId)
            });
        } else {
            // Remove user from team
            await teamRef.update({
                [role]: admin.firestore.FieldValue.arrayRemove(userId)
            });
        }
        
        // Get updated team
        const updatedTeamDoc = await teamRef.get();
        const updatedTeam = {
            _id: updatedTeamDoc.id,
            ...updatedTeamDoc.data()
        };
        
        // Convert Firestore timestamp to JS Date
        if (updatedTeam.createdAt && updatedTeam.createdAt.toDate) {
            updatedTeam.createdAt = updatedTeam.createdAt.toDate();
        }
        
        res.json(updatedTeam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/teams/:id
// @desc    Delete team
// @access  Private/Manager
router.delete('/:id', protect, authorize('manager'), async (req, res) => {
    try {
        const teamRef = teamsCollection.doc(req.params.id);
        const teamDoc = await teamRef.get();
        
        if (!teamDoc.exists) {
            return res.status(404).json({ message: 'Team not found' });
        }
        
        const team = teamDoc.data();
        
        // Check if manager is part of this team
        if (!team.managers.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to delete this team' });
        }
        
        // Delete team
        await teamRef.delete();
        
        res.json({ message: 'Team removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;