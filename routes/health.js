const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { protect, authorize } = require('../middleware/auth');

// Get Firestore instance
const db = admin.firestore();
const healthRecordsCollection = db.collection('healthRecords');
const usersCollection = db.collection('users');

// @route   POST /api/health
// @desc    Create a new health record
// @access  Private/Medical or Coach
router.post('/', protect, authorize('medical', 'coach'), async (req, res) => {
    try {
        const healthRecordData = {
            athlete: req.body.athlete,
            recordType: req.body.recordType,
            date: req.body.date ? new Date(req.body.date) : admin.firestore.FieldValue.serverTimestamp(),
            recordedBy: req.user._id,
            
            // Injury specific fields
            injuryType: req.body.injuryType || null,
            injurySeverity: req.body.injurySeverity || null,
            rehabilitationPlan: req.body.rehabilitationPlan || null,
            estimatedRecovery: req.body.estimatedRecovery ? new Date(req.body.estimatedRecovery) : null,
            
            // Nutrition specific fields
            calories: req.body.calories || null,
            protein: req.body.protein || null,
            carbs: req.body.carbs || null,
            fats: req.body.fats || null,
            hydration: req.body.hydration || null,
            
            // Sleep specific fields
            sleepDuration: req.body.sleepDuration || null,
            sleepQuality: req.body.sleepQuality || null,
            
            // Wellness specific fields
            mood: req.body.mood || null,
            stressLevel: req.body.stressLevel || null,
            fatigue: req.body.fatigue || null,
            
            notes: req.body.notes || null
        };
        
        const healthRecordRef = await healthRecordsCollection.add(healthRecordData);
        const healthRecordDoc = await healthRecordRef.get();
        
        res.status(201).json({
            _id: healthRecordRef.id,
            ...healthRecordDoc.data()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/health
// @desc    Get all health records
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = healthRecordsCollection;
        
        // If user is an athlete, only show their health records
        if (req.user.role === 'athlete') {
            query = query.where('athlete', '==', req.user._id);
        }
        
        // If query params are provided
        if (req.query.athlete) {
            query = query.where('athlete', '==', req.query.athlete);
        }
        
        if (req.query.recordType) {
            query = query.where('recordType', '==', req.query.recordType);
        }
        
        const healthRecordsSnapshot = await query.orderBy('date', 'desc').get();
        const healthRecords = [];
        
        // Get details for each health record
        for (const doc of healthRecordsSnapshot.docs) {
            const healthRecord = {
                _id: doc.id,
                ...doc.data()
            };
            
            // Convert Firestore timestamps to JS Date
            if (healthRecord.date && healthRecord.date.toDate) {
                healthRecord.date = healthRecord.date.toDate();
            }
            if (healthRecord.estimatedRecovery && healthRecord.estimatedRecovery.toDate) {
                healthRecord.estimatedRecovery = healthRecord.estimatedRecovery.toDate();
            }
            
            // Get athlete details
            const athleteDoc = await usersCollection.doc(healthRecord.athlete).get();
            if (athleteDoc.exists) {
                healthRecord.athlete = {
                    _id: athleteDoc.id,
                    name: athleteDoc.data().name
                };
            }
            
            // Get recorder details
            const recorderDoc = await usersCollection.doc(healthRecord.recordedBy).get();
            if (recorderDoc.exists) {
                healthRecord.recordedBy = {
                    _id: recorderDoc.id,
                    name: recorderDoc.data().name,
                    role: recorderDoc.data().role
                };
            }
            
            healthRecords.push(healthRecord);
        }
        
        res.json(healthRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/health/:id
// @desc    Get health record by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const healthRecordDoc = await healthRecordsCollection.doc(req.params.id).get();
        
        if (!healthRecordDoc.exists) {
            return res.status(404).json({ message: 'Health record not found' });
        }
        
        const healthRecord = {
            _id: healthRecordDoc.id,
            ...healthRecordDoc.data()
        };
        
        // Check if user has permission to view this health record
        if (req.user.role === 'athlete' && healthRecord.athlete !== req.user._id) {
            return res.status(403).json({ message: 'Not authorized to view this health record' });
        }
        
        // Convert Firestore timestamps to JS Date
        if (healthRecord.date && healthRecord.date.toDate) {
            healthRecord.date = healthRecord.date.toDate();
        }
        if (healthRecord.estimatedRecovery && healthRecord.estimatedRecovery.toDate) {
            healthRecord.estimatedRecovery = healthRecord.estimatedRecovery.toDate();
        }
        
        // Get athlete details
        const athleteDoc = await usersCollection.doc(healthRecord.athlete).get();
        if (athleteDoc.exists) {
            healthRecord.athlete = {
                _id: athleteDoc.id,
                name: athleteDoc.data().name
            };
        }
        
        // Get recorder details
        const recorderDoc = await usersCollection.doc(healthRecord.recordedBy).get();
        if (recorderDoc.exists) {
            healthRecord.recordedBy = {
                _id: recorderDoc.id,
                name: recorderDoc.data().name,
                role: recorderDoc.data().role
            };
        }
        
        res.json(healthRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/health/:id
// @desc    Update health record
// @access  Private/Medical or Coach
router.put('/:id', protect, authorize('medical', 'coach'), async (req, res) => {
    try {
        const healthRecordRef = healthRecordsCollection.doc(req.params.id);
        const healthRecordDoc = await healthRecordRef.get();
        
        if (!healthRecordDoc.exists) {
            return res.status(404).json({ message: 'Health record not found' });
        }
        
        const healthRecord = healthRecordDoc.data();
        
        // Check if user is the recorder of this health record
        if (healthRecord.recordedBy !== req.user._id && req.user.role !== 'medical') {
            return res.status(403).json({ message: 'Not authorized to update this health record' });
        }
        
        // Update health record
        await healthRecordRef.update(req.body);
        
        // Get updated health record
        const updatedHealthRecordDoc = await healthRecordRef.get();
        const updatedHealthRecord = {
            _id: updatedHealthRecordDoc.id,
            ...updatedHealthRecordDoc.data()
        };
        
        // Convert Firestore timestamps to JS Date
        if (updatedHealthRecord.date && updatedHealthRecord.date.toDate) {
            updatedHealthRecord.date = updatedHealthRecord.date.toDate();
        }
        if (updatedHealthRecord.estimatedRecovery && updatedHealthRecord.estimatedRecovery.toDate) {
            updatedHealthRecord.estimatedRecovery = updatedHealthRecord.estimatedRecovery.toDate();
        }
        
        res.json(updatedHealthRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/health/:id
// @desc    Delete health record
// @access  Private/Medical
router.delete('/:id', protect, authorize('medical'), async (req, res) => {
    try {
        const healthRecordRef = healthRecordsCollection.doc(req.params.id);
        const healthRecordDoc = await healthRecordRef.get();
        
        if (!healthRecordDoc.exists) {
            return res.status(404).json({ message: 'Health record not found' });
        }
        
        // Delete health record
        await healthRecordRef.delete();
        
        res.json({ message: 'Health record removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;