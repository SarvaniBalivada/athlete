import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

const Training = () => {
  const [trainings, setTrainings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    athlete: '',
    coach: '',
    date: '',
    status: 'Upcoming'
  });

  useEffect(() => {
    loadTrainings();
  }, []);

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
        title: '',
        athlete: '',
        coach: '',
        date: '',
        status: 'Upcoming'
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
        <div id="add-training-form" style={{ marginTop: '20px' }}>
          <h3>Add Training</h3>
          <form id="training-form" onSubmit={handleSubmit}>
            <input
              type="text"
              id="training-title"
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              id="training-athlete"
              name="athlete"
              placeholder="Athlete Name"
              value={formData.athlete}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              id="training-coach"
              name="coach"
              placeholder="Coach Name"
              value={formData.coach}
              onChange={handleInputChange}
              required
            />
            <input
              type="date"
              id="training-date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
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
            <button type="submit">Save Training</button>
          </form>
        </div>
      )}

      <div id="training-list">
        {trainings.length === 0 ? (
          <p>No trainings yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Athlete</th>
                <th>Coach</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((training, index) => (
                <tr key={index}>
                  <td>{training.title}</td>
                  <td>{training.athlete}</td>
                  <td>{training.coach}</td>
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