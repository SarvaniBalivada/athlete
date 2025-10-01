import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';

const CreateSession = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    creator: '',
    dateTime: '',
    venue: '',
    players: '',
    status: 'scheduled'
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const sessionData = {
        ...formData,
        coach: currentUser.uid,
        players: formData.players.split(',').map(p => p.trim()),
        dateTime: new Date(formData.dateTime).toISOString(),
        createdAt: new Date().toISOString()
      };
      await db.ref('sessions').push(sessionData);
      setMessage('Session created successfully!');
      setFormData({
        creator: '',
        dateTime: '',
        venue: '',
        players: '',
        status: 'scheduled'
      });
    } catch (error) {
      setMessage('Error creating session: ' + error.message);
    }
  };

  if (currentUser?.role !== 'coach' && currentUser?.role !== 'athlete') {
    return <div>You do not have permission to create sessions.</div>;
  }

  return (
    <div className="modal-overlay">
      <div id="create-session-container" className="modal-content">
        <button className="close-btn" onClick={() => navigate('/dashboard')}>×</button>
        <h2>Create New Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="creator">Creator</label>
            <input
              type="text"
              id="creator"
              name="creator"
              value={formData.creator}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="dateTime">Date & Time</label>
            <input
              type="datetime-local"
              id="dateTime"
              name="dateTime"
              value={formData.dateTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="venue">Venue</label>
            <input
              type="text"
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="players">Players (comma separated)</label>
            <input
              type="text"
              id="players"
              name="players"
              value={formData.players}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button type="submit">Create Session</button>
        </form>
      {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default CreateSession;