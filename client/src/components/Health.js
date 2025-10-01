import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

const Health = () => {
  const [healthRecords, setHealthRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    athlete: '',
    type: 'Checkup',
    notes: ''
  });

  useEffect(() => {
    loadHealthRecords();
  }, []);

  const loadHealthRecords = () => {
    db.ref('healthRecords').once('value').then(snapshot => {
      const data = [];
      snapshot.forEach(child => {
        data.push(child.val());
      });
      setHealthRecords(data);
    }).catch(error => {
      console.error("Error loading health records:", error);
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
    db.ref('healthRecords').push(formData).then(() => {
      loadHealthRecords();
      setFormData({
        date: '',
        athlete: '',
        type: 'Checkup',
        notes: ''
      });
      setShowForm(false);
    }).catch(error => {
      alert("Error saving health record: " + error.message);
    });
  };

  return (
    <div id="health-container">
      <h2>Health Records</h2>
      <button id="add-health-btn" onClick={() => setShowForm(!showForm)}>
        Add New Health Record
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div id="add-health-container" className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            <h3>Add Health Record</h3>
            <form id="health-form" onSubmit={handleSubmit}>
            <input
              type="date"
              id="health-date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              id="health-athlete"
              name="athlete"
              placeholder="Athlete Name"
              value={formData.athlete}
              onChange={handleInputChange}
              required
            />
            <div className="form-group">
              <label htmlFor="health-type">Type</label>
              <select
                id="health-type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="Checkup">Checkup</option>
                <option value="Injury">Injury</option>
                <option value="Nutrition">Nutrition</option>
              </select>
            </div>
            <textarea
              id="health-notes"
              name="notes"
              placeholder="Notes"
              value={formData.notes}
              onChange={handleInputChange}
              required
            ></textarea>
            <button type="submit">Save Health Record</button>
          </form>
          </div>
        </div>
      )}

      <div id="health-list">
        {healthRecords.length === 0 ? (
          <p>No health records. Add one!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Athlete</th>
                <th>Type</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {healthRecords.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>{record.athlete}</td>
                  <td>{record.type}</td>
                  <td>{record.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Health;