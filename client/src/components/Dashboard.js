import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import Chart from 'chart.js/auto';
import { db } from '../firebase';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [teams, setTeams] = useState([]);
  const [myTrainings, setMyTrainings] = useState([]);
  const [myCompetitions, setMyCompetitions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      const trainingsSnapshot = await db.ref('trainings').once('value');
      const competitionsSnapshot = await db.ref('competitions').once('value');
      const healthSnapshot = await db.ref('healthRecords').once('value');
      const teamsSnapshot = await db.ref('teams').once('value');

      const trainingsData = Object.values(trainingsSnapshot.val() || {});
      const competitionsData = Object.values(competitionsSnapshot.val() || {});
      const healthData = Object.values(healthSnapshot.val() || {});
      const teamsData = Object.values(teamsSnapshot.val() || {});

      setTrainings(trainingsData);
      setCompetitions(competitionsData);
      setHealthRecords(healthData);
      setTeams(teamsData);

      // Filter for current user (using name matching)
      const loginNamePart = currentUser.name.toLowerCase().split(/[\s\d]/)[0];
      const myTrainingsData = trainingsData.filter(t =>
        t.athlete?.toLowerCase().includes(loginNamePart)
      );
      const myCompetitionsData = competitionsData.filter(c =>
        c.athletename?.toLowerCase().includes(loginNamePart)
      );

      setMyTrainings(myTrainingsData);
      setMyCompetitions(myCompetitionsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    if (myTrainings.length > 0) {
      setTimeout(() => {
        createChart();
      }, 100);
    }
  }, [myTrainings]);

  const createChart = () => {
    const canvas = document.getElementById('dashboard-activity-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const trainingActivity = Array(7).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    myTrainings.forEach(t => {
      const date = smartParseDate(t.date);
      if (!date) {
        console.log("⛔ Invalid date skipped:", t.date);
        return;
      }

      date.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));

      if (dayDiff >= 0 && dayDiff < 7) {
        const weekday = date.getDay();
        console.log(`📊 +1 on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday]}`);
        trainingActivity[weekday]++;
      } else {
        console.log("📅 Skipped old training:", t.date);
      }
    });

    console.log("📈 Chart data:", trainingActivity);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: [{
          label: 'Trainings (last 7 days)',
          data: trainingActivity,
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 }
          }
        }
      }
    });
  };

  const smartParseDate = (dateStr) => {
    if (!dateStr) return null;

    // Try ISO (YYYY-MM-DD) or MM/DD/YYYY (let browser try)
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Try DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        const fallbackDate = new Date(`${yyyy}-${mm}-${dd}`);
        if (!isNaN(fallbackDate.getTime())) return fallbackDate;
      }
    }

    // Try MM-DD-YYYY explicitly (e.g., from competition data)
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [mm, dd, yyyy] = parts;
        const fallbackDate = new Date(`${yyyy}-${mm}-${dd}`);
        if (!isNaN(fallbackDate.getTime())) return fallbackDate;
      }
    }

    return null;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [calendarMode, setCalendarMode] = useState('trainings');
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);


  const getEventsForMonth = () => {
    const eventDays = new Map();
    const events = calendarMode === 'trainings' ? myTrainings : myCompetitions;

    events.forEach(e => {
      const d = smartParseDate(e.date);
      if (!d) return;

      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!eventDays.has(day)) eventDays.set(day, []);
        eventDays.get(day).push(e);
      }
    });

    return eventDays;
  };

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDayEvents([]);
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDayEvents([]);
  };

  const handleCalendarModeChange = (e) => {
    setCalendarMode(e.target.value);
    setSelectedDayEvents([]);
  };

  const handleDayClick = (day) => {
    const events = calendarMode === 'trainings' ? myTrainings : myCompetitions;
    const dayEvents = events.filter(e => {
      const d = smartParseDate(e.date);
      return d && d.getFullYear() === currentYear &&
             d.getMonth() === currentMonth &&
             d.getDate() === day;
    });
    setSelectedDayEvents(dayEvents);
  };

  const renderCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDays = getEventsForMonth();

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<td key={`empty-${i}`}></td>);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      if ((firstDay + d - 1) % 7 === 0 && d !== 1) {
        // This will be handled by the wrapping logic below
      }

      const hasEvents = eventDays.has(d);
      const isToday = today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

      let cellClass = '';
      if (isToday) {
        cellClass = 'today';
      } else if (hasEvents) {
        cellClass = 'has-events';
      }

      calendarDays.push(
        <td
          key={d}
          className={cellClass}
          onClick={() => hasEvents && handleDayClick(d)}
          style={{ cursor: hasEvents ? 'pointer' : 'default' }}
        >
          {d}
        </td>
      );
    }

    // Group days into rows
    const rows = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(
        <tr key={`row-${i/7}`}>
          {calendarDays.slice(i, i + 7)}
        </tr>
      );
    }

    return (
      <div id="athlete-calendar">
        <h3>Athlete Calendar</h3>
        <div className="calendar-header">
          <button onClick={handlePrevMonth}>‹</button>
          <span>{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {currentYear}</span>
          <button onClick={handleNextMonth}>›</button>
          <select value={calendarMode} onChange={handleCalendarModeChange}>
            <option value="trainings">Trainings</option>
            <option value="competitions">Competitions</option>
          </select>
        </div>
        <table className="calendar-table">
          <thead>
            <tr>
              {days.map(day => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
        {selectedDayEvents.length > 0 && (
          <div id="calendar-events">
            <h4>Events on {selectedDayEvents[0] ? (() => {
              const d = smartParseDate(selectedDayEvents[0].date);
              return d ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` : '';
            })() : ''}</h4>
            <ul>
              {selectedDayEvents.map((event, index) => (
                <li key={index}>
                  {event.title || event.name} ({event.status || event.type || ''})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div id="dashboard-container">
      <div className="welcome-card">
        <h2>Welcome Back, <span className="highlight">{currentUser?.name || 'User'}</span>!</h2>
        <p>Role: {currentUser?.role?.charAt(0).toUpperCase() + currentUser?.role?.slice(1)}</p>
      </div>
      <div className="dashboard-cards">
        <button className="dashboard-card">
          <div className="dashboard-card-icon trainings"></div>
          <div>
            <h4>{currentUser?.role === 'athlete' ? 'My Trainings' : 'Trainings'}</h4>
            <p>{currentUser?.role === 'athlete' ? myTrainings.length : trainings.length}</p>
          </div>
        </button>
        <button className="dashboard-card">
          <div className="dashboard-card-icon competitions"></div>
          <div>
            <h4>{currentUser?.role === 'athlete' ? 'My Competitions' : 'Competitions'}</h4>
            <p>{currentUser?.role === 'athlete' ? myCompetitions.length : competitions.length}</p>
          </div>
        </button>
        <button className="dashboard-card">
          <div className="dashboard-card-icon health"></div>
          <div>
            <h4>Health Records</h4>
            <p>{healthRecords.length}</p>
          </div>
        </button>
        <button className="dashboard-card">
          <div className="dashboard-card-icon teams"></div>
          <div>
            <h4>Teams</h4>
            <p>{teams.length}</p>
          </div>
        </button>
      </div>
      <div className="dashboard-activity">
        <h3>Recent Activity</h3>
        <canvas id="dashboard-activity-chart" height="80"></canvas>
      </div>
      {renderCalendar()}
    </div>
  );
};

export default Dashboard;