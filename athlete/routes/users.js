const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get Firestore instance
const db = admin.firestore();
const usersCollection = db.collection('users');

// Set up storage for profile pictures
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dir = 'uploads/profiles/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function(req, file, cb) {
        cb(null, `user-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
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

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, authorize('manager', 'coach'), async (req, res) => {
    try {
        const usersSnapshot = await usersCollection.get();
        const users = [];
        
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            delete userData.password; // Remove password from response
            users.push({
                _id: doc.id,
                ...userData
            });
        });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const userDoc = await usersCollection.doc(req.params.id).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userData = userDoc.data();
        delete userData.password; // Remove password from response
        
        res.json({
            _id: userDoc.id,
            ...userData
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const userRef = usersCollection.doc(req.user._id);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userData = userDoc.data();
        const updateData = {
            name: req.body.name || userData.name,
            email: req.body.email || userData.email,
            dateOfBirth: req.body.dateOfBirth || userData.dateOfBirth,
            height: req.body.height || userData.height,
            weight: req.body.weight || userData.weight,
            sport: req.body.sport || userData.sport,
            position: req.body.position || userData.position,
        };
        
        // If password is provided, hash it
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(req.body.password, salt);
        }
        
        await userRef.update(updateData);
        
        // Get updated user data
        const updatedUserDoc = await userRef.get();
        const updatedUserData = updatedUserDoc.data();
        delete updatedUserData.password; // Remove password from response
        
        res.json({
            _id: updatedUserDoc.id,
            ...updatedUserData,
            token: req.headers.authorization.split(' ')[1]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/users/profile/picture
// @desc    Upload profile picture
// @access  Private
router.post('/profile/picture', protect, upload.single('profilePicture'), async (req, res) => {
    try {
        const userRef = usersCollection.doc(req.user._id);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const profilePicture = `/uploads/profiles/${req.file.filename}`;
        
        await userRef.update({ profilePicture });
        
        res.json({ profilePicture });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;