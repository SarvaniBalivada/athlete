const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { protect, authorize } = require('../middleware/auth');

// Get Firestore instance
const db = admin.firestore();
const competitionsCollection = db.collection('competitions');
const usersCollection = db.collection('users');
const teamsCollection = db.collection('teams');

// @route   POST /api/competitions
// @desc    Create a new competition
// @access  Private/Coach or Manager
router.post('/', protect, authorize('coach', 'manager'), async (req, res) => {
    try {
        const competitionData = {
            name: req.body.name,
            location: req.body.location,
            startDate: new Date(req.body.startDate),
            endDate: req.body.endDate ? new Date(req.body.endDate) : null,
            type: req.body.type,
            participants: req.body.participants || [],
            team: req.body.team || null,
            createdBy: req.user._id,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const competitionRef = await competitionsCollection.add(competitionData);
        const competitionDoc = await competitionRef.get();
        
        res.status(201).json({
            _id: competitionRef.id,
            ...competitionDoc.data()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/competitions
// @desc    Get all competitions
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const competitionsSnapshot = await competitionsCollection.orderBy('startDate', 'desc').get();
        const competitions = [];
        
        // Get details for each competition
        for (const doc of competitionsSnapshot.docs) {
            const competition = {
                _id: doc.id,
                ...doc.data()
            };
            
            // Convert Firestore timestamps to JS Date
            if (competition.startDate && competition.startDate.toDate) {
                competition.startDate = competition.startDate.toDate();
            }
            if (competition.endDate && competition.endDate.toDate) {
                competition.endDate = competition.endDate.toDate();
            }
            if (competition.createdAt && competition.createdAt.toDate) {
                competition.createdAt = competition.createdAt.toDate();
            }
            
            // Get team details if exists
            if (competition.team) {
                const teamDoc = await teamsCollection.doc(competition.team).get();
                if (teamDoc.exists) {
                    competition.team = {
                        _id: teamDoc.id,
                        name: teamDoc.data().name
                    };
                }
            }
            
            // Get creator details
            const creatorDoc = await usersCollection.doc(competition.createdBy).get();
            if (creatorDoc.exists) {
                competition.createdBy = {
                    _id: creatorDoc.id,
                    name: creatorDoc.data().name
                };
            }
            
            // Get participant details
            if (competition.participants && competition.participants.length > 0) {
                const updatedParticipants = [];
                
                for (const participant of competition.participants) {
                    const athleteDoc = await usersCollection.doc(participant.athlete).get();
                    if (athleteDoc.exists) {
                        updatedParticipants.push({
                            ...participant,
                            athlete: {
                                _id: athleteDoc.id,
                                name: athleteDoc.data().name
                            }
                        });
                    } else {
                        updatedParticipants.push(participant);
                    }
                }
                
                competition.participants = updatedParticipants;
            }
            
            competitions.push(competition);
        }
        
        res.json(competitions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/competitions/:id
// @desc    Get competition by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const competitionDoc = await competitionsCollection.doc(req.params.id).get();
        
        if (!competitionDoc.exists) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        
        const competition = {
            _id: competitionDoc.id,
            ...competitionDoc.data()
        };
        
        // Convert Firestore timestamps to JS Date
        if (competition.startDate && competition.startDate.toDate) {
            competition.startDate = competition.startDate.toDate();
        }
        if (competition.endDate && competition.endDate.toDate) {
            competition.endDate = competition.endDate.toDate();
        }
        if (competition.createdAt && competition.createdAt.toDate) {
            competition.createdAt = competition.createdAt.toDate();
        }
        
        // Get team details if exists
        if (competition.team) {
            const teamDoc = await teamsCollection.doc(competition.team).get();
            if (teamDoc.exists) {
                competition.team = {
                    _id: teamDoc.id,
                    name: teamDoc.data().name
                };
            }
        }
        
        // Get creator details
        const creatorDoc = await usersCollection.doc(competition.createdBy).get();
        if (creatorDoc.exists) {
            competition.createdBy = {
                _id: creatorDoc.id,
                name: creatorDoc.data().name
            };
        }
        
        // Get participant details
        if (competition.participants && competition.participants.length > 0) {
            const updatedParticipants = [];
            
            for (const participant of competition.participants) {
                const athleteDoc = await usersCollection.doc(participant.athlete).get();
                if (athleteDoc.exists) {
                    updatedParticipants.push({
                        ...participant,
                        athlete: {
                            _id: athleteDoc.id,
                            name: athleteDoc.data().name
                        }
                    });
                } else {
                    updatedParticipants.push(participant);
                }
            }
            
            competition.participants = updatedParticipants;
        }
        
        res.json(competition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/competitions/:id
// @desc    Update competition
// @access  Private/Coach or Manager
router.put('/:id', protect, authorize('coach', 'manager'), async (req, res) => {
    try {
        const competitionRef = competitionsCollection.doc(req.params.id);
        const competitionDoc = await competitionRef.get();
        
        if (!competitionDoc.exists) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        
        const competition = competitionDoc.data();
        
        // Check if user is the creator of this competition or a manager
        if (competition.createdBy !== req.user._id && req.user.role !== 'manager') {
            return res.status(403).json({ message: 'Not authorized to update this competition' });
        }
        
        // Update competition
        await competitionRef.update(req.body);
        
        // Get updated competition
        const updatedCompetitionDoc = await competitionRef.get();
        const updatedCompetition = {
            _id: updatedCompetitionDoc.id,
            ...updatedCompetitionDoc.data()
        };
        
        // Convert Firestore timestamps to JS Date
        if (updatedCompetition.startDate && updatedCompetition.startDate.toDate) {
            updatedCompetition.startDate = updatedCompetition.startDate.toDate();
        }
        if (updatedCompetition.endDate && updatedCompetition.endDate.toDate) {
            updatedCompetition.endDate = updatedCompetition.endDate.toDate();
        }
        if (updatedCompetition.createdAt && updatedCompetition.createdAt.toDate) {
            updatedCompetition.createdAt = updatedCompetition.createdAt.toDate();
        }
        
        res.json(updatedCompetition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/competitions/:id/results
// @desc    Add or update results for a participant
// @access  Private/Coach
router.put('/:id/results', protect, authorize('coach'), async (req, res) => {
    try {
        const { athleteId, results, position, notes } = req.body;
        
        const competitionRef = competitionsCollection.doc(req.params.id);
        const competitionDoc = await competitionRef.get();
        
        if (!competitionDoc.exists) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        
        const competition = competitionDoc.data();
        
        // Find if athlete is already a participant
        const participants = competition.participants || [];
        const participantIndex = participants.findIndex(
            p => p.athlete === athleteId
        );
        
        if (participantIndex === -1) {
            // Add new participant
            participants.push({
                athlete: athleteId,
                results,
                position,
                notes
            });
        } else {
            // Update existing participant
            participants[participantIndex].results = results;
            participants[participantIndex].position = position;
            participants[participantIndex].notes = notes;
        }
        
        // Update competition with new participants array
        await competitionRef.update({ participants });
        
        // Get updated competition
        const updatedCompetitionDoc = await competitionRef.get();
        const updatedCompetition = {
            _id: updatedCompetitionDoc.id,
            ...updatedCompetitionDoc.data()
        };
        
        // Convert Firestore timestamps to JS Date
        if (updatedCompetition.startDate && updatedCompetition.startDate.toDate) {
            updatedCompetition.startDate = updatedCompetition.startDate.toDate();
        }
        if (updatedCompetition.endDate && updatedCompetition.endDate.toDate) {
            updatedCompetition.endDate = updatedCompetition.endDate.toDate();
        }
        if (updatedCompetition.createdAt && updatedCompetition.createdAt.toDate) {
            updatedCompetition.createdAt = updatedCompetition.createdAt.toDate();
        }
        
        res.json(updatedCompetition);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/competitions/:id
// @desc    Delete competition
// @access  Private/Manager
router.delete('/:id', protect, authorize('manager'), async (req, res) => {
    try {
        const competitionRef = competitionsCollection.doc(req.params.id);
        const competitionDoc = await competitionRef.get();
        
        if (!competitionDoc.exists) {
            return res.status(404).json({ message: 'Competition not found' });
        }
        
        // Delete competition
        await competitionRef.delete();
        
        res.json({ message: 'Competition removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;