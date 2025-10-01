import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';

const MySessions = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [currentUser]);

  const loadSessions = async () => {
    if (!currentUser) return;

    try {
      const snapshot = await db.ref('sessions').once('value');
      const allSessions = Object.values(snapshot.val() || {});
      let userSessions;
      if (currentUser.role === 'coach') {
        // Coaches see all sessions
        userSessions = allSessions;
      } else {
        // Athletes see their sessions
        const loginNamePart = currentUser.name.toLowerCase().split(/[\s\d]/)[0];
        userSessions = allSessions.filter(session =>
          session.athlete?.toLowerCase().includes(loginNamePart)
        );
      }
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (sessionId, reason) => {
    if (!reason) {
      alert('Please provide a reason for cancellation.');
      return;
    }
    try {
      await db.ref('sessions').child(sessionId).update({
        status: 'cancelled',
        cancellationReason: reason
      });
      loadSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
    }
  };

  if (loading) return <div>Loading sessions...</div>;

  return (
    <div id="my-sessions-container">
      <h2>My Sessions</h2>
      {sessions.length === 0 ? (
        <p>No sessions found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Creator</th>
              <th>Date & Time</th>
              <th>Venue</th>
              <th>Players</th>
              <th>Player Count</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session._id || Math.random()}>
                <td>{session.creator}</td>
                <td>{new Date(session.dateTime).toLocaleString()}</td>
                <td>{session.venue}</td>
                <td>{Array.isArray(session.players) ? session.players.join(', ') : session.players}</td>
                <td>{Array.isArray(session.players) ? `${0}/${session.players.length}` : '0/0'}</td>
                <td>{session.status}</td>
                <td>
                  {session.status === 'scheduled' && (
                    <button onClick={() => {
                      const reason = prompt('Reason for cancellation:');
                      if (reason) handleCancel(session._id, reason);
                    }}>
                      Cancel
                    </button>
                  )}
                  {session.status === 'cancelled' && session.cancellationReason && (
                    <span>Reason: {session.cancellationReason}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MySessions;