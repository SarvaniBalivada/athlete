const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const { protect } = require('../middleware/auth');

// Get Firestore instance
const db = admin.firestore();
const usersCollection = db.collection('users');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const userSnapshot = await usersCollection.where('email', '==', email).get();
        
        if (!userSnapshot.empty) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userData = {
            name,
            email,
            password: hashedPassword,
            role: role || 'athlete',
            profilePicture: '',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const userRef = await usersCollection.add(userData);
        const user = {
            _id: userRef.id,
            name,
            email,
            role: role || 'athlete'
        };

        res.status(201).json({
            ...user,
            token: generateToken(userRef.id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const userSnapshot = await usersCollection.where('email', '==', email).get();
        
        if (userSnapshot.empty) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const userDoc = userSnapshot.docs[0];
        const user = {
            _id: userDoc.id,
            ...userDoc.data()
        };

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        // User is already attached to req from the protect middleware
        const { password, ...userWithoutPassword } = req.user;
        
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;