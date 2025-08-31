const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const admin = require('firebase-admin');

dotenv.config();

// Firebase setup
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Firestore reference
const db = admin.firestore();
global.db = db;
global.admin = admin;

// Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// View engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/training', require('./routes/training'));
app.use('/api/competitions', require('./routes/competitions'));
app.use('/api/health', require('./routes/health'));
app.use('/api/teams', require('./routes/teams'));

// API status route
app.get('/api', (req, res) => {
  res.send('Athlete Management System API is running');
});

// Root route (render EJS with user object like in app.js)
app.get('/', (req, res) => {
  res.render('index', { user: { name: "Sarvani" } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
