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

// Load dashboard content
async function loadDashboard() {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {};
    const role = storedUser.role || 'coach';
    const name = storedUser.name || storedUser.email || 'Demo User';

    const dashboardContainer = document.getElementById('dashboard-container');
    if (!dashboardContainer) return;

    let cardsHtml = '';

    if (role === 'coach') {
         cardsHtml = `
            <button class="dashboard-card" id="dashboard-trainings">
                <div class="dashboard-card-icon trainings"></div>
                <div>
                    <h4>Trainings</h4>
                    <p id="training-count">3</p>
                </div>
            </button>
            <button class="dashboard-card" id="dashboard-competitions">
                <div class="dashboard-card-icon competitions"></div>
                <div>
                    <h4>Competitions</h4>
                    <p id="competitions-count">3</p>
                </div>
            </button>
            <button class="dashboard-card" id="dashboard-health">
                <div class="dashboard-card-icon health"></div>
                <div>
                    <h4>Health Records</h4>
                    <p id="health-count">3</p>
                </div>
            </button>
            <button class="dashboard-card" id="dashboard-teams">
                <div class="dashboard-card-icon teams"></div>
                <div>
                    <h4>Teams</h4>
                    <p id="teams-count">2</p>
                </div>
            </button>
        `;
    } else if (role === 'athlete') {
        cardsHtml = `
            <button class="dashboard-card" id="dashboard-trainings">
                <div class="dashboard-card-icon trainings"></div>
                <div>
                    <h4>My Trainings</h4>
                    <p id="training-count">2</p>
                </div>
            </button>
            <button class="dashboard-card" id="dashboard-competitions">
                <div class="dashboard-card-icon competitions"></div>
                <div>
                    <h4>My Competitions</h4>
                    <p id="competitions-count">1</p>
                </div>
            </button>
            <button class="dashboard-card" id="dashboard-health">
                <div class="dashboard-card-icon health"></div>
                <div>
                    <h4>My Health</h4>
                    <p id="health-count">1</p>
                </div>
            </button>
        `;
    } else if (role === 'medical') {
        cardsHtml = `
            <button class="dashboard-card" id="dashboard-health">
                <div class="dashboard-card-icon health"></div>
                <div>
                    <h4>All Health Records</h4>
                    <p id="health-count">5</p>
                </div>
            </button>
            <button class="dashboard-card" id="dashboard-athletes">
                <div class="dashboard-card-icon teams"></div>
                <div>
                    <h4>Athletes</h4>
                    <p id="athletes-count">4</p>
                </div>
            </button>
        `;
    } else if (role === 'manager') {
         cardsHtml = `
            <button class="dashboard-card" id="dashboard-teams">
                <div class="dashboard-card-icon teams"></div>
                <div>
                    <h4>Teams</h4>
                    <p id="teams-count">2</p>
                </div>
            </button>
            <button class="dashboard-card" id="dashboard-competitions">
                <div class="dashboard-card-icon competitions"></div>
                <div>
                    <h4>Competitions</h4>
                    <p id="competitions-count">2</p>
                </div>
            </button>
        `;
    }

    dashboardContainer.innerHTML = `
        <div class="welcome-card">
            <h2>Welcome Back, <span class="highlight">${name}</span>!</h2>
            <p>Role: ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
            <button class="edit-profile-btn">Edit Profile</button>
        </div>
        <div class="dashboard-cards">${cardsHtml}</div>
        <div class="dashboard-activity">
            <h3>Recent Activity</h3>
            <canvas id="dashboard-activity-chart" height="80"></canvas>
            <div style="margin-top:16px;">
                <ul>
                    <li>🏋️ 2 Trainings completed this week</li>
                    <li>🏆 1 Competition participated</li>
                    <li>💊 Health checkup done</li>
                </ul>
            </div>
        </div>
        <div class="dashboard-calendar">
            <h3>Athlete Calendar</h3>
            <div id="athlete-calendar"></div>
            <div style="margin-top:16px;">
                <ul>
                    <li>📅 Upcoming: Endurance Run - Tomorrow</li>
                    <li>📅 Upcoming: Regional Championship - Next Week</li>
                </ul>
            </div>
        </div>
    `;
    
    const activityCanvas = document.getElementById('dashboard-activity-chart');
if (activityCanvas) {
    const ctx = activityCanvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Activities',
                data: [2, 4, 3, 5, 1, 0, 2],
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });
}
const calendarDiv = document.getElementById('athlete-calendar');
if (calendarDiv) {
    const today = new Date();
    let calendarHtml = '<table class="calendar-table"><tr>';
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    days.forEach(day => calendarHtml += `<th>${day}</th>`);
    calendarHtml += '</tr><tr>';
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    for(let i=0; i<firstDay; i++) calendarHtml += '<td></td>';
    const daysInMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++) {
        if((firstDay + d - 1) % 7 === 0 && d !== 1) calendarHtml += '</tr><tr>';
        calendarHtml += `<td${d === today.getDate() ? ' style="background:#3498db;color:#fff;border-radius:50%;"' : ''}>${d}</td>`;
    }
    calendarHtml += '</tr></table>';
    calendarDiv.innerHTML = calendarHtml;
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

    addNavHandler('dashboard-trainings', 'training-container', loadTrainings);
    addNavHandler('dashboard-competitions', 'competitions-container', loadCompetitions);
    addNavHandler('dashboard-health', 'health-container', loadHealthRecords);
    addNavHandler('dashboard-teams', 'teams-container', loadTeams);
    addNavHandler('dashboard-athletes', '', () => alert('Show athletes list (implement as needed)'));
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
        'profile-container'
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
                <td>${new Date(training.date).toLocaleDateString()}</td>
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
                    <th>Status</th>
                    
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
                <td>${record.status}</td>
                
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
        status: document.getElementById('health-status').value,
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

