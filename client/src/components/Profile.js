import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import Chart from 'chart.js/auto';

const Profile = () => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'athlete',
    password: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        role: currentUser.role || 'athlete',
        password: ''
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isEditing) {
      // Load activity charts when not editing
      setTimeout(() => {
        createActivityCharts();
      }, 100);
    }
  }, [isEditing, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Update user profile in Firebase
      const userRef = db.ref(`users/${currentUser.uid}`);
      await userRef.update({
        name: formData.name,
        email: formData.email,
        role: formData.role
      });

      // Update local storage
      const updatedUser = {
        ...currentUser,
        name: formData.name,
        email: formData.email,
        role: formData.role
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      alert('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  const createActivityCharts = async () => {
    if (!currentUser || !currentUser.uid) return;

    try {
      const [trainingSnap, competitionSnap, healthSnap] = await Promise.all([
        db.ref('trainings').once('value'),
        db.ref('competitions').once('value'),
        db.ref('healthRecords').once('value')
      ]);

      const trainings = Object.values(trainingSnap.val() || {});
      const competitions = Object.values(competitionSnap.val() || {});
      const healthRecords = Object.values(healthSnap.val() || {});

      // Training Chart
      const trainingCanvas = document.getElementById('training-chart');
      if (trainingCanvas) {
        const trainingCtx = trainingCanvas.getContext('2d');
        new Chart(trainingCtx, {
          type: 'pie',
          data: {
            labels: ['Completed', 'Upcoming', 'Cancelled'],
            datasets: [{
              data: [
                trainings.filter(t => t.status?.toLowerCase() === 'completed').length,
                trainings.filter(t => t.status?.toLowerCase() === 'upcoming').length,
                trainings.filter(t => t.status?.toLowerCase() === 'cancelled').length
              ],
              backgroundColor: ['#4CAF50', '#2196F3', '#F44336']
            }]
          }
        });
      }

      // Competitions Chart
      const competitionsCanvas = document.getElementById('competitions-chart');
      if (competitionsCanvas) {
        const competitionsCtx = competitionsCanvas.getContext('2d');
        new Chart(competitionsCtx, {
          type: 'pie',
          data: {
            labels: ['Completed', 'Upcoming', 'Missed'],
            datasets: [{
              data: [
                competitions.filter(c => c.status?.toLowerCase() === 'completed').length,
                competitions.filter(c => c.status?.toLowerCase() === 'upcoming').length,
                competitions.filter(c => c.status?.toLowerCase() === 'missed').length
              ],
              backgroundColor: ['#4CAF50', '#2196F3', '#F44336']
            }]
          }
        });
      }

      // Health Chart
      const healthCanvas = document.getElementById('health-chart');
      if (healthCanvas) {
        const healthCtx = healthCanvas.getContext('2d');
        new Chart(healthCtx, {
          type: 'pie',
          data: {
            labels: ['Checkups', 'Injuries', 'Nutrition'],
            datasets: [{
              data: [
                healthRecords.filter(h => h.type?.toLowerCase() === 'checkup').length,
                healthRecords.filter(h => h.type?.toLowerCase() === 'injury').length,
                healthRecords.filter(h => h.type?.toLowerCase() === 'nutrition').length
              ],
              backgroundColor: ['#4CAF50', '#F44336', '#FFC107']
            }]
          }
        });
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  if (!currentUser) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div id="profile-container">
      <div className="profile-info">
        <h2>User Profile</h2>
        <div className="profile-section">
          <h3>Personal Information</h3>
          {!isEditing ? (
            <div id="profile-view">
              <p><strong>Name:</strong> {currentUser.name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Role:</strong> {currentUser.role?.charAt(0).toUpperCase() + currentUser.role?.slice(1)}</p>
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            </div>
          ) : (
            <div id="profile-edit">
              <form id="profile-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="profile-name">Name</label>
                  <input
                    type="text"
                    id="profile-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    type="email"
                    id="profile-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-role">Role</label>
                  <select
                    id="profile-role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="athlete">Athlete</option>
                    <option value="coach">Coach</option>
                    <option value="medical">Medical Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="profile-password">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    id="profile-password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)} style={{marginLeft: '10px'}}>Cancel</button>
              </form>
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="profile-section">
            <h3>Activity Summary</h3>
            <div className="activity-charts">
              <div className="chart-container">
                <h4>Training Sessions</h4>
                <canvas id="training-chart"></canvas>
              </div>
              <div className="chart-container">
                <h4>Competitions</h4>
                <canvas id="competitions-chart"></canvas>
              </div>
              <div className="chart-container">
                <h4>Health Records</h4>
                <canvas id="health-chart"></canvas>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;