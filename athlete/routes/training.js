const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { protect, authorize } = require('../middleware/auth');

// Get Firestore instance
const db = admin.firestore();
const trainingsCollection = db.collection('trainings');
const usersCollection = db.collection('users');

// @route   POST /api/training
// @desc    Create a new training session
// @access  Private/Coach
router.post('/', protect, authorize('coach'), async (req, res) => {
    try {
        const { title, description, athlete, exercises, scheduledDate } = req.body;
        
        // Verify athlete exists
        const athleteDoc = await usersCollection.doc(athlete).get();
        if (!athleteDoc.exists) {
            return res.status(404).json({ message: 'Athlete not found' });
        }
        
        const trainingData = {
            title,
            description,
            athlete,
            coach: req.user._id,
            exercises: exercises || [],
            scheduledDate: new Date(scheduledDate),
            status: 'scheduled',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const trainingRef = await trainingsCollection.add(trainingData);
        const trainingDoc = await trainingRef.get();
        
        res.status(201).json({
            _id: trainingRef.id,
            ...trainingDoc.data()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/training
// @desc    Get all training sessions
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = trainingsCollection;
        
        // If user is an athlete, only show their training sessions
        if (req.user.role === 'athlete') {
            query = query.where('athlete', '==', req.user._id);
        }
        
        // If user is a coach, only show training sessions they created
        if (req.user.role === 'coach') {
            query = query.where('coach', '==', req.user._id);
        }
        
        const trainingsSnapshot = await query.orderBy('scheduledDate', 'desc').get();
        const trainings = [];
        
        // Get athlete and coach details for each training
        for (const doc of trainingsSnapshot.docs) {
            const training = {
                _id: doc.id,
                ...doc.data()
            };
            
            // Convert Firestore timestamp to JS Date
            if (training.scheduledDate && training.scheduledDate.toDate) {
                training.scheduledDate = training.scheduledDate.toDate();
            }
            if (training.completedDate && training.completedDate.toDate) {
                training.completedDate = training.completedDate.toDate();
            }
            if (training.createdAt && training.createdAt.toDate) {
                training.createdAt = training.createdAt.toDate();
            }
            
            // Get athlete details
            const athleteDoc = await usersCollection.doc(training.athlete).get();
            if (athleteDoc.exists) {
                training.athlete = {
                    _id: athleteDoc.id,
                    name: athleteDoc.data().name
                };
            }
            
            // Get coach details
            const coachDoc = await usersCollection.doc(training.coach).get();
            if (coachDoc.exists) {
                training.coach = {
                    _id: coachDoc.id,
                    name: coachDoc.data().name
                };
            }
            
            trainings.push(training);
        }
        
        res.json(trainings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/training/:id
// @desc    Get training session by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const trainingDoc = await trainingsCollection.doc(req.params.id).get();
        
        if (!trainingDoc.exists) {
            return res.status(404).json({ message: 'Training session not found' });
        }
        
        const training = {
            _id: trainingDoc.id,
            ...trainingDoc.data()
        };
        
        // Convert Firestore timestamp to JS Date
        if (training.scheduledDate && training.scheduledDate.toDate) {
            training.scheduledDate = training.scheduledDate.toDate();
        }
        if (training.completedDate && training.completedDate.toDate) {
            training.completedDate = training.completedDate.toDate();
        }
        if (training.createdAt && training.createdAt.toDate) {
            training.createdAt = training.createdAt.toDate();
        }
        
        // Check if user has permission to view this training
        if (req.user.role === 'athlete' && training.athlete !== req.user._id) {
            return res.status(403).json({ message: 'Not authorized to view this training' });
        }
        
        if (req.user.role === 'coach' && training.coach !== req.user._id) {
            return res.status(403).json({ message: 'Not authorized to view this training' });
        }
        
        // Get athlete details
        const athleteDoc = await usersCollection.doc(training.athlete).get();
        if (athleteDoc.exists) {
            training.athlete = {
                _id: athleteDoc.id,
                name: athleteDoc.data().name
            };
        }
        
        // Get coach details
        const coachDoc = await usersCollection.doc(training.coach).get();
        if (coachDoc.exists) {
            training.coach = {
                _id: coachDoc.id,
                name: coachDoc.data().name
            };
        }
        
        res.json(training);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/training/:id
// @desc    Update training session
// @access  Private/Coach
router.put('/:id', protect, authorize('coach'), async (req, res) => {
    try {
        const trainingRef = trainingsCollection.doc(req.params.id);
        const trainingDoc = await trainingRef.get();
        
        if (!trainingDoc.exists) {
            return res.status(404).json({ message: 'Training session not found' });
        }
        
        const training = trainingDoc.data();
        
        // Check if coach is the creator of this training
        if (training.coach !== req.user._id) {
            return res.status(403).json({ message: 'Not authorized to update this training' });
        }
        
        // Update training
        await trainingRef.update(req.body);
        
        // Get updated training
        const updatedTrainingDoc = await trainingRef.get();
        const updatedTraining = {
            _id: updatedTrainingDoc.id,
            ...updatedTrainingDoc.data()
        };
        
        // Convert Firestore timestamp to JS Date
        if (updatedTraining.scheduledDate && updatedTraining.scheduledDate.toDate) {
            updatedTraining.scheduledDate = updatedTraining.scheduledDate.toDate();
        }
        if (updatedTraining.completedDate && updatedTraining.completedDate.toDate) {
            updatedTraining.completedDate = updatedTraining.completedDate.toDate();
        }
        if (updatedTraining.createdAt && updatedTraining.createdAt.toDate) {
            updatedTraining.createdAt = updatedTraining.createdAt.toDate();
        }
        
        res.json(updatedTraining);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/training/:id/complete
// @desc    Mark training as completed
// @access  Private/Athlete
router.put('/:id/complete', protect, authorize('athlete'), async (req, res) => {
    try {
        const { feedback } = req.body;
        const trainingRef = trainingsCollection.doc(req.params.id);
        const trainingDoc = await trainingRef.get();
        
        if (!trainingDoc.exists) {
            return res.status(404).json({ message: 'Training session not found' });
        }
        
        const training = trainingDoc.data();
        
        // Check if athlete is assigned to this training
        if (training.athlete !== req.user._id) {
            return res.status(403).json({ message: 'Not authorized to complete this training' });
        }
        
        // Update training
        await trainingRef.update({
            status: 'completed',
            completedDate: admin.firestore.FieldValue.serverTimestamp(),
            feedback: feedback || ''
        });
        
        // Get updated training
        const updatedTrainingDoc = await trainingRef.get();
        const updatedTraining = {
            _id: updatedTrainingDoc.id,
            ...updatedTrainingDoc.data()
        };
        
        // Convert Firestore timestamp to JS Date
        if (updatedTraining.scheduledDate && updatedTraining.scheduledDate.toDate) {
            updatedTraining.scheduledDate = updatedTraining.scheduledDate.toDate();
        }
        if (updatedTraining.completedDate && updatedTraining.completedDate.toDate) {
            updatedTraining.completedDate = updatedTraining.completedDate.toDate();
        }
        if (updatedTraining.createdAt && updatedTraining.createdAt.toDate) {
            updatedTraining.createdAt = updatedTraining.createdAt.toDate();
        }
        
        res.json(updatedTraining);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/training/:id
// @desc    Delete training session
// @access  Private/Coach
router.delete('/:id', protect, authorize('coach'), async (req, res) => {
    try {
        const trainingRef = trainingsCollection.doc(req.params.id);
        const trainingDoc = await trainingRef.get();
        
        if (!trainingDoc.exists) {
            return res.status(404).json({ message: 'Training session not found' });
        }
        
        const training = trainingDoc.data();
        
        // Check if coach is the creator of this training
        if (training.coach !== req.user._id) {
            return res.status(403).json({ message: 'Not authorized to delete this training' });
        }
        
        // Delete training
        await trainingRef.delete();
        
        res.json({ message: 'Training session removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;