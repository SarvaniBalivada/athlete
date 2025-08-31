const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Add this at the top of your server.js file
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const trainingRoutes = require('./routes/training');
const competitionRoutes = require('./routes/competitions');
const healthRoutes = require('./routes/health');
const teamRoutes = require('./routes/teams');

dotenv.config();
const app = express();

// Get Firestore instance
const db = admin.firestore();
// Make Firestore available globally
global.db = db;
global.admin = admin;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public'))); // This should serve static files

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/teams', teamRoutes);

// API status route
app.get('/api', (req, res) => {
  res.send('Athlete Management System API is running');
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Root route should render EJS, not send HTML
app.get("/", (req, res) => {
  res.render("index"); // renders views/index.ejs
});
// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

// Make sure this is before your app.listen() call
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));