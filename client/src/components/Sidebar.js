import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Sidebar = ({ isLoggedIn, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sessionsExpanded, setSessionsExpanded] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLinkClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (!isLoggedIn) return null;

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
        &#9776;
      </button>
      <ul className="nav-links">
        <li><Link to="/dashboard" onClick={() => handleLinkClick('/dashboard')}>Home</Link></li>
        <li>
          <button onClick={() => setSessionsExpanded(!sessionsExpanded)} className="sidebar-submenu-toggle">
            Sessions {sessionsExpanded ? '▼' : '▶'}
          </button>
          {sessionsExpanded && (
            <ul className="submenu">
              <li><Link to="/create-session" onClick={() => handleLinkClick('/create-session')}>Create Session</Link></li>
              <li><Link to="/my-sessions" onClick={() => handleLinkClick('/my-sessions')}>My Sessions</Link></li>
            </ul>
          )}
        </li>
        <li><Link to="/training" onClick={() => handleLinkClick('/training')}>Training</Link></li>
        <li><Link to="/competitions" onClick={() => handleLinkClick('/competitions')}>Competitions</Link></li>
        <li><Link to="/health" onClick={() => handleLinkClick('/health')}>Health</Link></li>
        <li><Link to="/teams" onClick={() => handleLinkClick('/teams')}>Teams</Link></li>
        <li><Link to="/profile" onClick={() => handleLinkClick('/profile')}>Profile</Link></li>
        <li><Link to="/connections" onClick={() => handleLinkClick('/connections')}>Connections</Link></li>
        <li><a href="#" onClick={handleLogout}>Logout</a></li>
      </ul>
    </div>
  );
};

export default Sidebar;