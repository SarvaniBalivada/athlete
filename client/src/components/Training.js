import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    athletename: '',
    location: '',
    date: '',
    status: 'Upcoming',
    type: ''
  });

  useEffect(() => {
    loadTrainings();
  }, []);

  useEffect(() => {
    if (showForm) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showForm]);

  const loadTrainings = () => {
    db.ref('trainings').once('value').then(snapshot => {
      const data = [];
      snapshot.forEach(child => {
        data.push(child.val());
      });
      setTrainings(data);
    }).catch(error => {
      console.error("Error loading trainings:", error);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    db.ref('trainings').push(formData).then(() => {
      loadTrainings();
      setFormData({
        name: '',
        athletename: '',
        location: '',
        date: '',
        status: 'Upcoming',
        type: ''
      });
      setShowForm(false);
    }).catch(error => {
      alert("Failed to save training: " + error.message);
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    return dateStr;
  };

  return (
    <div id="training-container">
      <h2>Training Sessions</h2>
      <button id="add-training-btn" onClick={() => setShowForm(!showForm)}>
        Add New Training
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div id="add-training-container" className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            <h3>Add Training</h3>
            <form id="training-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="training-name">Name</label>
                <input
                  type="text"
                  id="training-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="training-athletename">Athlete Name</label>
                <input
                  type="text"
                  id="training-athletename"
                  name="athletename"
                  value={formData.athletename}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="training-location">Location</label>
                <input
                  type="text"
                  id="training-location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="training-date">Date</label>
                <input
                  type="date"
                  id="training-date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="training-status">Status</label>
                <select
                  id="training-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="training-type">Type</label>
                <select
                  id="training-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Practice">Practice</option>
                  <option value="Conditioning">Conditioning</option>
                  <option value="Skill Development">Skill Development</option>
                  <option value="Recovery">Recovery</option>
                  <option value="Match Preparation">Match Preparation</option>
                </select>
              </div>
              <button type="submit">Save Training</button>
            </form>
          </div>
        </div>
      )}

      <div id="training-list">
        {trainings.length === 0 ? (
          <p>No trainings yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Athlete Name</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((training, index) => (
                <tr key={index}>
                  <td>{training.name}</td>
                  <td>{training.athletename}</td>
                  <td>{training.location}</td>
                  <td>{formatDate(training.date)}</td>
                  <td>{training.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Training;