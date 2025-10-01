import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';

const Connections = () => {
  const { currentUser } = useAuth();
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [approvedConnections, setApprovedConnections] = useState([]);
  const [userList, setUserList] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadMyConnections();
      loadUsersForConnection();
    }
  }, [currentUser]);

  const loadMyConnections = () => {
    if (!currentUser || !currentUser.uid) return;

    db.ref(`connections/${currentUser.uid}`).once('value')
      .then(snapshot => {
        const connections = snapshot.val() || {};
        const requests = [];
        const approved = [];

        Object.entries(connections).forEach(([otherUid, conn]) => {
          if (conn.status === 'requested' && conn.requestedBy !== currentUser.uid) {
            // Received request
            requests.push({ uid: otherUid, ...conn });
          } else if (conn.status === 'approved') {
            // Approved connection
            approved.push({ uid: otherUid, ...conn });
          }
        });

        setConnectionRequests(requests);
        setApprovedConnections(approved);
      })
      .catch(error => {
        console.error('Error loading connections:', error);
      });
  };

  const loadUsersForConnection = () => {
    db.ref('users').once('value').then(snapshot => {
      const users = snapshot.val() || {};
      const userList = Object.entries(users).map(([uid, user]) => ({
        uid,
        name: user.name,
        role: user.role
      })).filter(user => user.uid !== currentUser?.uid);

      setUserList(userList);
    }).catch(error => {
      console.error('Error loading users:', error);
    });
  };

  const sendConnectionRequest = (targetUid, targetRole) => {
    if (!currentUser || !currentUser.uid) return;

    const requestData = {
      type: targetRole,
      status: 'requested',
      requestedBy: currentUser.uid
    };

    const mirrorData = {
      type: currentUser.role,
      status: 'requested',
      requestedBy: currentUser.uid
    };

    const updates = {};
    updates[`connections/${currentUser.uid}/${targetUid}`] = requestData;
    updates[`connections/${targetUid}/${currentUser.uid}`] = mirrorData;

    db.ref().update(updates).then(() => {
      alert('Connection request sent!');
      loadMyConnections();
      loadUsersForConnection();
    }).catch(error => {
      alert('Error sending request: ' + error.message);
    });
  };

  const approveConnection = (fromUid) => {
    const updates = {};
    updates[`connections/${currentUser.uid}/${fromUid}/status`] = 'approved';
    updates[`connections/${fromUid}/${currentUser.uid}/status`] = 'approved';

    db.ref().update(updates).then(() => {
      alert('Connection approved!');
      loadMyConnections();
    }).catch(error => {
      alert('Error approving connection: ' + error.message);
    });
  };

  const cancelConnection = (otherUid) => {
    const updates = {};
    updates[`connections/${currentUser.uid}/${otherUid}`] = null;
    updates[`connections/${otherUid}/${currentUser.uid}`] = null;

    db.ref().update(updates).then(() => {
      alert('Connection cancelled.');
      loadMyConnections();
      loadUsersForConnection();
    }).catch(error => {
      alert('Error cancelling connection: ' + error.message);
    });
  };

  const getUserName = (uid) => {
    const user = userList.find(u => u.uid === uid);
    return user ? user.name : uid;
  };

  const getUserRole = (uid) => {
    const user = userList.find(u => u.uid === uid);
    return user ? user.role : 'Unknown';
  };

  return (
    <div id="connections-section">
      <h2>Your Connections</h2>

      {/* Connection Requests */}
      <div id="connection-requests">
        <h3>Connection Requests</h3>
        {connectionRequests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          connectionRequests.map((request, index) => (
            <div key={index} className="user-card">
              <b>{getUserName(request.uid)}</b> - {request.type}
              <button onClick={() => approveConnection(request.uid)}>Approve</button>
              <button onClick={() => cancelConnection(request.uid)}>Decline</button>
            </div>
          ))
        )}
      </div>

      {/* Approved Connections */}
      <div id="approved-connections" style={{ marginTop: '20px' }}>
        <h3>Connected Users</h3>
        {approvedConnections.length === 0 ? (
          <p>No approved connections yet.</p>
        ) : (
          approvedConnections.map((connection, index) => (
            <div key={index} className="user-card">
              <b>{getUserName(connection.uid)}</b> - {connection.type} ✅ Connected
            </div>
          ))
        )}
      </div>

      {/* User List for Connection Requests */}
      <div id="user-list" style={{ marginTop: '20px' }}>
        <h3>Connect with Users</h3>
        {userList
          .filter(user => {
            // Hide users who are already approved connections
            const existingConnection = [...connectionRequests, ...approvedConnections]
              .find(conn => conn.uid === user.uid);
            return !existingConnection || existingConnection.status !== 'approved';
          })
          .map((user, index) => {
            const existingConnection = [...connectionRequests, ...approvedConnections]
              .find(conn => conn.uid === user.uid);

            let buttonText = 'Connect';
            let buttonDisabled = false;
            let buttonClass = 'connect-btn';
            let showButton = true;

            if (existingConnection) {
              if (existingConnection.status === 'approved') {
                showButton = false; // Don't show button for approved connections
              } else if (existingConnection.requestedBy === currentUser.uid) {
                buttonText = 'Requested';
                buttonDisabled = true;
                buttonClass += ' requested';
              }
            }

            if (!showButton) return null; // Don't render this user card

            return (
              <div key={index} className="user-card">
                <b>{user.name}</b> - {user.role}
                <button
                  className={buttonClass}
                  disabled={buttonDisabled}
                  onClick={() => sendConnectionRequest(user.uid, user.role)}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        {userList.filter(user => {
          const existingConnection = [...connectionRequests, ...approvedConnections]
            .find(conn => conn.uid === user.uid);
          return !existingConnection || existingConnection.status !== 'approved';
        }).length === 0 && (
          <p>No users available to connect with.</p>
        )}
      </div>
    </div>
  );
};

export default Connections;