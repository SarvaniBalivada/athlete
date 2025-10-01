import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Training from './components/Training';
import Competitions from './components/Competitions';
import Health from './components/Health';
import Teams from './components/Teams';
import Profile from './components/Profile';
import Connections from './components/Connections';
import CreateSession from './components/CreateSession';
import MySessions from './components/MySessions';
import './App.css';

function AppContent() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="App">
      <Header />
      <Sidebar isLoggedIn={!!currentUser} onLogout={logout} />
      <main>
        <Routes>
          <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/" />} />
          <Route path="/create-session" element={currentUser ? <CreateSession /> : <Navigate to="/" />} />
          <Route path="/my-sessions" element={currentUser ? <MySessions /> : <Navigate to="/" />} />
          <Route path="/training" element={currentUser ? <Training /> : <Navigate to="/" />} />
          <Route path="/competitions" element={currentUser ? <Competitions /> : <Navigate to="/" />} />
          <Route path="/health" element={currentUser ? <Health /> : <Navigate to="/" />} />
          <Route path="/teams" element={currentUser ? <Teams /> : <Navigate to="/" />} />
          <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/" />} />
          <Route path="/connections" element={currentUser ? <Connections /> : <Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
