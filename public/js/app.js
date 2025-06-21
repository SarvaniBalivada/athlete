// Helper function to make authenticated API requests
async function apiRequest(url, method = 'GET', body = null) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
}

let dashboardChartInstance;

let myTrainings = [];
let myCompetitions = [];

function smartParseDate(dateStr) {
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
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarMode = 'trainings'; // or 'competitions'

function renderCalendar(events, title = "Calendar") {
  const calendarDiv = document.getElementById('athlete-calendar');
  if (!calendarDiv) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDays = new Map(); // Map of day => [list of items]

  events.forEach(e => {
    console.log("📆 RAW date:", e.date);
    const d = smartParseDate(e.date);
    console.log("📅 Parsed:", e.date, "→", d);
    if (!d) return;


    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      const day = d.getDate();
      if (!eventDays.has(day)) eventDays.set(day, []);
      eventDays.get(day).push(e);
    }
  });

  let calendarHtml = `
    <div class="calendar-header">
      <button id="prev-month">&lt;</button>
      <span>${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}</span>
      <button id="next-month">&gt;</button>
      <select id="calendar-type">
        <option value="trainings" ${calendarMode === 'trainings' ? 'selected' : ''}>Trainings</option>
        <option value="competitions" ${calendarMode === 'competitions' ? 'selected' : ''}>Competitions</option>
      </select>
    </div>
    <table class="calendar-table"><tr>`;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days.forEach(day => calendarHtml += `<th>${day}</th>`);
  calendarHtml += '</tr><tr>';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  for (let i = 0; i < firstDay; i++) calendarHtml += '<td></td>';

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    if ((firstDay + d - 1) % 7 === 0 && d !== 1) calendarHtml += '</tr><tr>';

    let style = '';
    let hasEvents = eventDays.has(d);
    const isToday = today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    if (isToday) {
      style = 'style="background:#3498db;color:#fff;border-radius:50%;"';
    } else if (hasEvents) {
      style = 'style="background:#2ecc71;color:#fff;border-radius:50%;cursor:pointer;"';
    }

    calendarHtml += `<td ${style} data-day="${d}">${d}</td>`;
  }

  calendarHtml += '</tr></table><div id="calendar-events"></div>';
  calendarDiv.innerHTML = `<h3>${title}</h3>` + calendarHtml;

  // Navigation & event handlers
  document.getElementById('prev-month').onclick = () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateCalendar();
  };

  document.getElementById('next-month').onclick = () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateCalendar();
  };

  document.getElementById('calendar-type').onchange = (e) => {
    calendarMode = e.target.value;
    updateCalendar();
  };

  document.querySelectorAll('.calendar-table td[data-day]').forEach(cell => {
    cell.addEventListener('click', () => {
      const day = parseInt(cell.getAttribute('data-day'));
      const items = eventDays.get(day) || [];
      const listHtml = items.map(i => `<li>${i.title || i.name} (${i.status || i.type || ''})</li>`).join('');
      document.getElementById('calendar-events').innerHTML =
        `<h4>Events on ${day}/${currentMonth + 1}/${currentYear}</h4><ul>${listHtml}</ul>`;
    });
  });
}

function updateCalendar() {
  const data = calendarMode === 'trainings' ? myTrainings : myCompetitions;
  const label = calendarMode === 'trainings' ? "Training Calendar" : "Competition Calendar";
  renderCalendar(data, label);
}


// Load dashboard content
async function loadDashboard() {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const role = storedUser.role || 'coach';
    const name = storedUser.name || storedUser.email || 'Demo User';

    const dashboardContainer = document.getElementById('dashboard-container');
    if (!dashboardContainer) return;

    const trainingsSnapshot = await db.ref('trainings').once('value');
    const competitionsSnapshot = await db.ref('competitions').once('value');
    const healthSnapshot = await db.ref('healthRecords').once('value');
    const teamsSnapshot = await db.ref('teams').once('value');

    const trainings = Object.values(trainingsSnapshot.val() || {});
    const competitions = Object.values(competitionsSnapshot.val() || {});
    const health = Object.values(healthSnapshot.val() || {});
    const teams = Object.values(teamsSnapshot.val() || {});
   
    // 👇 Log all athlete names from Firebase
console.log("📦 All trainings:", trainings.map(t => t.athlete));
console.log("🙋 Logged in name:", name);

// 👇 Name matching
const loginNamePart = name.toLowerCase().split(/[\s\d]/)[0]; // e.g., "sarvani" from "sarvani1"
myTrainings = trainings.filter(t =>
  t.athlete?.toLowerCase().includes(loginNamePart)
);

// ✅ Log matched trainings
console.log("✅ Matched trainings:", myTrainings.map(t => t.date));

// 👇 Smart date parser
    myCompetitions = competitions.filter(c =>
  c.athletename?.toLowerCase().includes(loginNamePart)
);

    const myHealth = health.filter(h => h.athlete === name);


    
    let cardsHtml = '';
    if (role === 'coach') {
         cardsHtml = `
            <button class="dashboard-card" id="dashboard-trainings">
                <div class="dashboard-card-icon trainings"></div>
                <div><h4>Trainings</h4><p id="training-count">${trainings.length}</p></div>
            </button>
            <button class="dashboard-card" id="dashboard-competitions">
                <div class="dashboard-card-icon competitions"></div>
                <div><h4>Competitions</h4><p id="competitions-count">${competitions.length}</p></div>
            </button>
            <button class="dashboard-card" id="dashboard-health">
                <div class="dashboard-card-icon health"></div>
                <div><h4>Health Records</h4><p id="health-count">${health.length}</p></div>
            </button>
            <button class="dashboard-card" id="dashboard-teams">
                <div class="dashboard-card-icon teams"></div>
                <div><h4>Teams</h4><p id="teams-count">${teams.length}</p></div>
            </button>
        `;
    } else if (role === 'athlete') {
        cardsHtml = `
            <button class="dashboard-card" id="dashboard-trainings">
                <div class="dashboard-card-icon trainings"></div>
                <div><h4>My Trainings</h4><p id="training-count">${myTrainings.length}</p></div>
            </button>
            <button class="dashboard-card" id="dashboard-competitions">
                <div class="dashboard-card-icon competitions"></div>
                <div><h4>My Competitions</h4><p id="competitions-count">${myCompetitions.length}</p></div>
            </button>
            <button class="dashboard-card" id="dashboard-health">
                <div class="dashboard-card-icon health"></div>
                <div><h4>My Health</h4><p id="health-count">${myHealth.length}</p></div>
            </button>
        `;
    }

    dashboardContainer.innerHTML = `
        <div class="welcome-card">
            <h2>Welcome Back, <span class="highlight">${name}</span>!</h2>
            <p>Role: ${role.charAt(0).toUpperCase() + role.slice(1)}</p>

        </div>
        <div class="dashboard-cards">${cardsHtml}</div>
        <div class="dashboard-activity">
            <h3>Recent Activity</h3>
            <canvas id="dashboard-activity-chart" height="80"></canvas>
        </div>
        <div id="athlete-calendar" style="margin-top: 20px;">
            <h3>Athlete Calendar</h3>
        </div>
        <div id="connection-requests" style="margin-top: 20px;"></div>
    `;

    // Dynamically build bar chart from real data (last 7 days of trainings as example)
    const trainingActivity = Array(7).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Robust date parser
   
    
    // Chart data loop
    myTrainings.forEach(t => {
      const date = smartParseDate(t.date);
      if (!date) {
        console.log("⛔ Invalid date skipped:", t.date);
        return;
      }
    
      date.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    
      if (dayDiff >= 0 && dayDiff < 7) {
        const weekday = date.getDay(); // 0 = Sun, 6 = Sat
        console.log(`📊 +1 on ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday]}`);
        trainingActivity[weekday]++;
      } else {
        console.log("📅 Skipped old training:", t.date);
      }
    });
    
    // Final chart data
    console.log("📈 Chart data:", trainingActivity);


setTimeout(() => {
  const canvas = document.getElementById('dashboard-activity-chart');
  if (canvas) {
      const ctx = canvas.getContext('2d');
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
  }
}, 100); // Wait 100ms to ensure DOM is rendered

updateCalendar();
loadMyConnections();
// Attach profile edit button handler after DOM is injected
const editBtn = document.getElementById('edit-profile-btn');
if (editBtn) {
  editBtn.addEventListener('click', () => {
    hideAllContainers();
    loadProfile();
  });
}



    // Add navigation handlers safely
    const addNavHandler = (id, showId, loaderFn) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                hideAllContainers();
                const target = document.getElementById(showId);
                if (target) target.style.display = 'block';
                if (loaderFn) loaderFn();
            };
        }
    };
    setTimeout(()=>{
        addNavHandler('dashboard-trainings', 'training-container', loadTrainings);
        addNavHandler('dashboard-competitions', 'competitions-container', loadCompetitions);
        addNavHandler('dashboard-health', 'health-container', loadHealthRecords);
        addNavHandler('dashboard-teams', 'teams-container', loadTeams);
        addNavHandler('dashboard-athletes', '', () => alert('Show athletes list (implement as needed)'));
    },50);

}

// Sidebar links
const navLinks = [
    { id: 'home-link', section: 'dashboard-container', loader: loadDashboard },
    { id: 'training-link', section: 'training-container', loader: loadTrainings },
    { id: 'competitions-link', section: 'competitions-container', loader: loadCompetitions },
    { id: 'health-link', section: 'health-container', loader: loadHealthRecords },
    { id: 'teams-link', section: 'teams-container', loader: loadTeams }
];

navLinks.forEach(link => {
    const el = document.getElementById(link.id);
    if (el) {
        el.addEventListener('click', e => {
            e.preventDefault();
            hideAllContainers();
            const section = document.getElementById(link.section);
            if (section) section.style.display = 'block';
            if (link.loader) link.loader();
        });
    }
});

// Hide all containers
function hideAllContainers() {
    const containerIds = [
        'dashboard-container',
        'training-container',
        'competitions-container',
        'health-container',
        'teams-container',
        'profile-container',
        'connections-section'
    ];
    containerIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}
document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllContainers();
    document.getElementById('dashboard-container').style.display = 'block';
    loadDashboard(); // This must be after the container is visible!
});
document.getElementById('training-link').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllContainers();
    document.getElementById('training-container').style.display = 'block';
    loadTrainings();
});
document.getElementById('competitions-link').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllContainers();
    document.getElementById('competitions-container').style.display = 'block';
    loadCompetitions();
});
document.getElementById('health-link').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllContainers();
    document.getElementById('health-container').style.display = 'block';
    loadHealthRecords();
});
document.getElementById('teams-link').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllContainers();
    document.getElementById('teams-container').style.display = 'block';
    loadTeams();
});
document.getElementById("connections-link").addEventListener("click", (e) => {
  e.preventDefault();
  showConnectionsSection();
});

const db = firebase.database();



// Sample loader functions
let trainings = [];

function loadTrainings() {
    db.ref('trainings').once('value').then(snapshot => {
        trainings = [];
        snapshot.forEach(child => {
            trainings.push(child.val());
        });
        renderTrainings();
    }).catch((error) => {
        console.error("Error loading trainings:", error);
    });
}
function formatDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
    return dateStr;
}

function renderTrainings() {
    const trainingList = document.getElementById('training-list');
    if (!trainingList) return;

    if (trainings.length === 0) {
        trainingList.innerHTML = `<p>No trainings yet.</p>`;
        return;
    }

    let html = `
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
    `;

    trainings.forEach(training => {
        html += `
            <tr>
                <td>${training.title}</td>
                <td>${training.athlete}</td>
                <td>${training.coach}</td>
                <td>${formatDate(training.date)}</td>
                <td>${training.status}</td>
                
            </tr>
        `;
    });

    html += '</tbody></table>';
    trainingList.innerHTML = html;
}

document.getElementById('add-training-btn').addEventListener('click', () => {
    const form = document.getElementById('add-training-form');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
});

document.getElementById('training-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newTraining = {
        title: document.getElementById('training-title').value,
        athlete: document.getElementById('training-athlete').value,
        coach: document.getElementById('training-coach').value,
        date: document.getElementById('training-date').value,
        status: document.getElementById('training-status').value
    };

    db.ref('trainings').push(newTraining).then(() => {
        loadTrainings();
        e.target.reset();
        document.getElementById('add-training-form').style.display = 'none';
    }).catch((error) => {
        alert("Failed to save training: " + error.message);
    });
});

document.addEventListener('DOMContentLoaded', loadTrainings);


let competitions = []; // global array
function loadCompetitions() {
    db.ref('competitions').once('value').then(snapshot => {
        competitions = [];
        snapshot.forEach(child => {
            competitions.push(child.val());
        });
        renderCompetitions();
    }).catch(error => {
        console.error("Error loading competitions:", error);
    });
}

// Load competitions

// Render competition list
function renderCompetitions() {
    const competitionsList = document.getElementById('competitions-list');
    if (!competitionsList) return;

    if (competitions.length === 0) {
        competitionsList.innerHTML = `<p>No competitions yet. Add one!</p>`;
        return;
    }

    let html = `
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
    `;

    competitions.forEach(competition => {
        html += `
            <tr>
                <td>${competition.name}</td>
                <td>${competition.athletename}</td>
                <td>${competition.location}</td>
                <td>${new Date(competition.date).toLocaleDateString()}</td>
                <td>${competition.status}</td>
                
            </tr>
        `;
    });

    html += `</tbody></table>`;
    competitionsList.innerHTML = html;
}

// Toggle form display
document.getElementById('add-competition-btn').addEventListener('click', () => {
    const form = document.getElementById('add-competition-form');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
});

// Handle form submit
document.getElementById('competition-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const newCompetition = {
        name: document.getElementById('comp-name').value,
        athletename:document.getElementById('comp-athletename').value,
        location: document.getElementById('comp-location').value,
        date: document.getElementById('comp-date').value,
        status: document.getElementById('comp-status').value,
        type: document.getElementById('comp-type').value
    };

    db.ref('competitions').push(newCompetition).then(() => {
        loadCompetitions();
        e.target.reset();
        document.getElementById('add-competition-form').style.display = 'none';
    }).catch(error => {
        alert("Error saving competition: " + error.message);
    });
});



// Load health records
let healthRecords = [];
function loadHealthRecords() {
    db.ref('healthRecords').once('value').then(snapshot => {
        healthRecords = [];
        snapshot.forEach(child => {
            healthRecords.push(child.val());
        });
        renderHealthRecords();
    }).catch(error => {
        console.error("Error loading health records:", error);
    });
}


function renderHealthRecords() {
    const healthList = document.getElementById('health-list');
    if (!healthList) return;

    if (healthRecords.length === 0) {
        healthList.innerHTML = `<p>No health records. Add one!</p>`;
        return;
    }

    let html = `
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
    `;

    healthRecords.forEach(record => {
        html += `
            <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.athlete}</td>
                <td>${record.type}</td>
                <td>${record.notes}</td>
                
            </tr>
        `;
    });

    html += '</tbody></table>';
    healthList.innerHTML = html;
}
document.getElementById('add-health-btn').addEventListener('click', () => {
    const form = document.getElementById('add-health-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('health-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const newHealth = {
        date: document.getElementById('health-date').value,
        athlete: document.getElementById('health-athlete').value,
        type: document.getElementById('health-type').value,
        
        notes: document.getElementById('health-notes').value
    };

    db.ref('healthRecords').push(newHealth).then(() => {
        loadHealthRecords();
        e.target.reset();
        document.getElementById('add-health-form').style.display = 'none';
    }).catch(error => {
        alert("Error saving health record: " + error.message);
    });
});



// Load teams
let teams = []; // Fixed variable name from 'team' to 'teams'


function loadTeams() {
    db.ref('teams').once('value').then(snapshot => {
        teams = [];
        snapshot.forEach(child => {
            teams.push(child.val());
        });
        renderTeams();
    }).catch(error => {
        console.error("Error loading teams:", error);
    });
}

function renderTeams() {
    const teamsList = document.getElementById('teams-list');
    if (!teamsList) return;

    if (teams.length === 0) {
        teamsList.innerHTML = `<p>No teams yet. Add one!</p>`;
        return;
    }

    let html = `
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
    `;

    teams.forEach(team => {
        html += `
            <tr>
                <td>${team.sport}</td>
                <td>${team.athletes.join(', ')}</td>
                <td>${team.coaches.join(', ')}</td>
                <td>${team.description}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    teamsList.innerHTML = html;
}

document.getElementById('add-team-btn').addEventListener('click', () => {
    editingTeamId = null; // fresh create
    document.getElementById('team-form').reset();
    document.getElementById('add-team-form').style.display = 'block';
    document.getElementById('save-team-btn').textContent = 'Save Team';
    document.getElementById('team-form-heading').textContent = 'Add Team';
});


document.getElementById('team-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const newTeam = {
        name: document.getElementById('team-name').value,
        sport: document.getElementById('team-sport').value,
        athletes: document.getElementById('team-athletes').value.split(',').map(a => a.trim()),
        coaches: document.getElementById('team-coaches').value.split(',').map(c => c.trim()),
        description: document.getElementById('team-description').value
    };

    db.ref('teams').push(newTeam).then(() => {
        loadTeams();
        e.target.reset();
        document.getElementById('add-team-form').style.display = 'none';
    }).catch(error => {
        alert("Error saving team: " + error.message);
    });
});



// Add event listeners for the "Add New" buttons
document.getElementById('add-training-btn').addEventListener('click', () => {
    // Show form to add new training
    // This would be implemented with a modal or form
});

document.getElementById('add-competition-btn').addEventListener('click', () => {
    // Show form to add new competition
});

document.getElementById('add-health-btn').addEventListener('click', () => {
    // Show form to add new health record
});

document.getElementById('add-team-btn').addEventListener('click', () => {
    // Show form to add new team
});

// Sidebar toggle
// sidebar.js

window.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  if (toggleButton && sidebar) {
    toggleButton.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  } else {
    console.error("Sidebar or toggle button not found");
  }
});

