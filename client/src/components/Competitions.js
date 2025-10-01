import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
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
    loadCompetitions();
  }, []);

  const loadCompetitions = () => {
    db.ref('competitions').once('value').then(snapshot => {
      const data = [];
      snapshot.forEach(child => {
        data.push(child.val());
      });
      setCompetitions(data);
    }).catch(error => {
      console.error("Error loading competitions:", error);
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
    db.ref('competitions').push(formData).then(() => {
      loadCompetitions();
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
      alert("Error saving competition: " + error.message);
    });
  };

  return (
    <div id="competitions-container">
      <h2>Competitions</h2>
      <button id="add-competition-btn" onClick={() => setShowForm(!showForm)}>
        Add New Competition
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div id="add-competition-container" className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            <h3>Add Competition</h3>
            <form id="competition-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="comp-name">Name</label>
                <input
                  type="text"
                  id="comp-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="comp-athletename">Athlete Name</label>
                <input
                  type="text"
                  id="comp-athletename"
                  name="athletename"
                  value={formData.athletename}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="comp-location">Location</label>
                <input
                  type="text"
                  id="comp-location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="comp-date">Date</label>
                <input
                  type="date"
                  id="comp-date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="comp-status">Status</label>
                <select
                  id="comp-status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Missed">Missed</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="comp-type">Type</label>
                <select
                  id="comp-type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Tournament">Tournament</option>
                  <option value="League">League</option>
                  <option value="Practice">Practice</option>
                  <option value="Qualifier">Qualifier</option>
                </select>
              </div>
              <button type="submit">Save Competition</button>
            </form>
          </div>
        </div>
      )}

      <div id="competitions-list" style={{ marginTop: '20px' }}>
        {competitions.length === 0 ? (
          <p>No competitions yet. Add one!</p>
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
              {competitions.map((competition, index) => (
                <tr key={index}>
                  <td>{competition.name}</td>
                  <td>{competition.athletename}</td>
                  <td>{competition.location}</td>
                  <td>{new Date(competition.date).toLocaleDateString()}</td>
                  <td>{competition.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Competitions;