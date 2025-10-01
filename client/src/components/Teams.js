import React, { useState, useEffect } from 'react';
import { db } from '../firebase';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    athletes: '',
    coaches: '',
    description: ''
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = () => {
    db.ref('teams').once('value').then(snapshot => {
      const data = [];
      snapshot.forEach(child => {
        data.push(child.val());
      });
      setTeams(data);
    }).catch(error => {
      console.error("Error loading teams:", error);
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

    const teamData = {
      ...formData,
      athletes: formData.athletes.split(',').map(a => a.trim()),
      coaches: formData.coaches.split(',').map(c => c.trim())
    };

    if (editingTeamId) {
      // Update existing team
      db.ref('teams').child(editingTeamId).update(teamData).then(() => {
        loadTeams();
        resetForm();
      }).catch(error => {
        alert("Error updating team: " + error.message);
      });
    } else {
      // Create new team
      db.ref('teams').push(teamData).then(() => {
        loadTeams();
        resetForm();
      }).catch(error => {
        alert("Error saving team: " + error.message);
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sport: '',
      athletes: '',
      coaches: '',
      description: ''
    });
    setEditingTeamId(null);
    setShowForm(false);
  };

  const handleAddNew = () => {
    setEditingTeamId(null);
    resetForm();
    setShowForm(true);
  };

  return (
    <div id="teams-container">
      <h2>Teams</h2>
      <button id="add-team-btn" onClick={handleAddNew}>
        Add New Team
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div id="add-team-container" className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            <h3 id="team-form-heading">{editingTeamId ? 'Edit Team' : 'Add Team'}</h3>
            <form id="team-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="team-name">Team Name</label>
              <input
                type="text"
                id="team-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="team-sport">Sport</label>
              <input
                type="text"
                id="team-sport"
                name="sport"
                value={formData.sport}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="team-athletes">Athletes (comma-separated)</label>
              <input
                type="text"
                id="team-athletes"
                name="athletes"
                value={formData.athletes}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="team-coaches">Coaches (comma-separated)</label>
              <input
                type="text"
                id="team-coaches"
                name="coaches"
                value={formData.coaches}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="team-description">Description</label>
              <input
                type="text"
                id="team-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <button id="save-team-btn" type="submit">
              {editingTeamId ? 'Update Team' : 'Save Team'}
            </button>
            <button type="button" onClick={resetForm}>Cancel</button>
          </form>
          </div>
        </div>
      )}

      <div id="teams-list" style={{ marginTop: '20px' }}>
        {teams.length === 0 ? (
          <p>No teams yet. Add one!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sport</th>
                <th>Athletes</th>
                <th>Coaches</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={index}>
                  <td>{team.sport}</td>
                  <td>{Array.isArray(team.athletes) ? team.athletes.join(', ') : team.athletes}</td>
                  <td>{Array.isArray(team.coaches) ? team.coaches.join(', ') : team.coaches}</td>
                  <td>{team.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Teams;