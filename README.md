# Athlete App

A full-stack web application for athletes to manage their training sessions, competitions, health metrics, teams, and connections.

## Features

- **User Authentication**: Secure login and registration using Firebase Authentication
- **Dashboard**: Overview of user activities and quick access to features
- **Training Sessions**: Create, view, and manage training sessions
- **Competitions**: Track upcoming and past competitions
- **Health Metrics**: Monitor and log health data
- **Teams**: Manage team memberships and collaborations
- **Connections**: Network with other athletes and coaches
- **Profile Management**: Update personal information and preferences

## Tech Stack

### Backend
- **Node.js** with **Express.js** for server-side logic
- **Firebase Admin SDK** for backend authentication and database operations
- **MongoDB** for data storage (via Firebase)
- **JWT** for session management

### Frontend
- **React.js** for building the user interface
- **Firebase SDK** for client-side authentication
- **CSS** for styling

## Project Structure

```
athlete/
├── server.js                 # Main server file
├── package.json              # Server dependencies
├── firebaseAdmin.js          # Firebase admin configuration
├── middleware/
│   └── auth.js               # Authentication middleware
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── users.js              # User management routes
│   ├── training.js           # Training session routes
│   ├── competitions.js       # Competition routes
│   ├── health.js             # Health metrics routes
│   └── teams.js              # Team management routes
├── public/                   # Static files
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── auth.js
│       └── connections.js
├── views/                    # EJS templates
│   ├── index.ejs
│   └── partials/
│       ├── header.ejs
│       ├── footer.ejs
│       └── sidebar.ejs
└── client/                   # React frontend
    ├── package.json          # Client dependencies
    ├── public/
    │   ├── index.html
    │   ├── manifest.json
    │   └── favicon.ico
    └── src/
        ├── App.js
        ├── AuthContext.js
        ├── firebase.js
        ├── components/
        │   ├── Dashboard.js
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Profile.js
        │   ├── Training.js
        │   ├── Competitions.js
        │   ├── Health.js
        │   ├── Teams.js
        │   ├── Connections.js
        │   ├── MySessions.js
        │   ├── CreateSession.js
        │   ├── Header.js
        │   ├── Footer.js
        │   └── Sidebar.js
        └── ...
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Authentication and Firestore enabled
- Service account key for Firebase Admin SDK

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SarvaniBalivada/athlete.git
   cd athlete
   ```

2. **Install server dependencies:**
   ```bash
   npm install
   ```

3. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up Firebase:**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication and Firestore
   - Generate a service account key and save it as `serviceAccountKey.json` in the root directory
   - Update `firebaseAdmin.js` and `client/src/firebase.js` with your Firebase config

5. **Configure environment variables:**
   - Copy `.env` file and update the values:
     ```
     PORT=3000
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_PRIVATE_KEY_ID=your-private-key-id
     FIREBASE_PRIVATE_KEY=your-private-key
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_CLIENT_ID=your-client-id
     FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
     FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
     FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
     FIREBASE_CLIENT_CERT_URL=your-client-cert-url
     ```

## Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```
   The server will run on http://localhost:3000

2. **Start the client (in a separate terminal):**
   ```bash
   cd client
   npm start
   ```
   The React app will run on http://localhost:3001

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Training
- `GET /api/training/sessions` - Get training sessions
- `POST /api/training/sessions` - Create training session
- `PUT /api/training/sessions/:id` - Update training session
- `DELETE /api/training/sessions/:id` - Delete training session

### Competitions
- `GET /api/competitions` - Get competitions
- `POST /api/competitions` - Create competition
- `PUT /api/competitions/:id` - Update competition
- `DELETE /api/competitions/:id` - Delete competition

### Health
- `GET /api/health/metrics` - Get health metrics
- `POST /api/health/metrics` - Add health metric
- `PUT /api/health/metrics/:id` - Update health metric
- `DELETE /api/health/metrics/:id` - Delete health metric

### Teams
- `GET /api/teams` - Get teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/join` - Join team
- `POST /api/teams/:id/leave` - Leave team

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Sarvani Balivada - [GitHub](https://github.com/SarvaniBalivada)

Project Link: [https://github.com/SarvaniBalivada/athlete](https://github.com/SarvaniBalivada/athlete)