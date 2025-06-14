// Helper function to make authenticated API requests
async function apiRequest(url, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    
    const options = {
        method,
        headers
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }
    
    return data;
}

// Load dashboard content
async function loadDashboard() {
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Demo User', role: 'coach' };
    const dashboardContent = document.getElementById('dashboard-content');

    let cardsHtml = '';

    if (user.role === 'coach') {
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
    } else if (user.role === 'athlete') {
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
    } else if (user.role === 'medical') {
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
    } else if (user.role === 'manager') {
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

    dashboardContent.innerHTML = `
        <div class="welcome-card">
            <h2>Welcome Back, <span class="highlight">${user.name}</span>!</h2>
            <p>Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <button class="edit-profile-btn">Edit Profile</button>
        </div>
        <div class="dashboard-cards">
            ${cardsHtml}
        </div>
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

    // Add click handlers for each card (check if element exists before adding)
    const trainingsBtn = document.getElementById('dashboard-trainings');
    if (trainingsBtn) {
        trainingsBtn.onclick = function() {
            hideAllContainers();
            document.getElementById('training-container').style.display = 'block';
            loadTrainings();
        };
    }
    const competitionsBtn = document.getElementById('dashboard-competitions');
    if (competitionsBtn) {
        competitionsBtn.onclick = function() {
            hideAllContainers();
            document.getElementById('competitions-container').style.display = 'block';
            loadCompetitions();
        };
    }
    const healthBtn = document.getElementById('dashboard-health');
    if (healthBtn) {
        healthBtn.onclick = function() {
            hideAllContainers();
            document.getElementById('health-container').style.display = 'block';
            loadHealthRecords();
        };
    }
    const teamsBtn = document.getElementById('dashboard-teams');
    if (teamsBtn) {
        teamsBtn.onclick = function() {
            hideAllContainers();
            document.getElementById('teams-container').style.display = 'block';
            loadTeams();
        };
    }
    const athletesBtn = document.getElementById('dashboard-athletes');
    if (athletesBtn) {
        // You can define what happens for medical staff viewing athletes
        alert('Show athletes list (implement as needed)');
    }

    // Render a simple Chart.js bar chart for Recent Activity
    const ctx = document.getElementById('dashboard-activity-chart').getContext('2d');
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
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    const calendarDiv = document.getElementById('athlete-calendar');
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

document.getElementById('teams-link').addEventListener('click', (e) => {
    e.preventDefault();
    hideAllContainers();
    document.getElementById('teams-container').style.display = 'block';
    loadTeams();
});

// Helper function to hide all containers
function hideAllContainers() {
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('training-container').style.display = 'none';
    document.getElementById('competitions-container').style.display = 'none';
    document.getElementById('health-container').style.display = 'none';
    document.getElementById('teams-container').style.display = 'none';
    // Hide profile-container if it exists
    const profileContainer = document.getElementById('profile-container');
    if (profileContainer) profileContainer.style.display = 'none';
}

// Sidebar navigation
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

// Load training sessions
async function loadTrainings() {
    const trainingList = document.getElementById('training-list');
    trainingList.innerHTML = '<p>Loading training sessions...</p>';
    
    try {
        // Sample data for showcase
        const trainings = [
            {
                _id: 'sample1',
                title: 'Strength Training',
                athlete: { name: 'John Doe' },
                coach: { name: 'Coach Smith' },
                scheduledDate: new Date().toISOString(),
                status: 'Completed',
                duration: 60,
                notes: 'Focus on upper body'
            },
            {
                _id: 'sample2',
                title: 'Endurance Run',
                athlete: { name: 'Jane Smith' },
                coach: { name: 'Coach Johnson' },
                scheduledDate: new Date(Date.now() + 86400000).toISOString(),
                status: 'Scheduled',
                duration: 45,
                notes: '5km run at moderate pace'
            },
            {
                _id: 'sample3',
                title: 'Swimming Session',
                athlete: { name: 'Mike Wilson' },
                coach: { name: 'Coach Davis' },
                scheduledDate: new Date(Date.now() - 86400000).toISOString(),
                status: 'Completed',
                duration: 90,
                notes: 'Focus on freestyle technique'
            }
        ];
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Athlete</th>
                        <th>Coach</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        trainings.forEach(training => {
            html += `
                <tr>
                    <td>${training.title}</td>
                    <td>${training.athlete.name}</td>
                    <td>${training.coach.name}</td>
                    <td>${new Date(training.scheduledDate).toLocaleDateString()}</td>
                    <td>${training.status}</td>
                    <td>
                        <button onclick="viewTraining('${training._id}')">View</button>
                        <button onclick="editTraining('${training._id}')">Edit</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        trainingList.innerHTML = html;
    } catch (error) {
        console.error('Error loading trainings:', error);
        trainingList.innerHTML = '<p>Error loading training sessions. Please try again.</p>';
    }
}

// Load competitions
async function loadCompetitions() {
    const competitionsList = document.getElementById('competitions-list');
    competitionsList.innerHTML = '<p>Loading competitions...</p>';
    
    try {
        // Sample data for showcase
        const competitions = [
            {
                _id: 'comp1',
                name: 'Regional Championship',
                location: 'City Sports Center',
                date: new Date(Date.now() + 7 * 86400000).toISOString(),
                status: 'Upcoming',
                type: 'Tournament'
            },
            {
                _id: 'comp2',
                name: 'National Finals',
                location: 'National Stadium',
                date: new Date(Date.now() + 30 * 86400000).toISOString(),
                status: 'Registration Open',
                type: 'Championship'
            },
            {
                _id: 'comp3',
                name: 'Local Meet',
                location: 'Community Center',
                date: new Date(Date.now() - 15 * 86400000).toISOString(),
                status: 'Completed',
                type: 'Friendly'
            }
        ];
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
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
                    <td>
                        <button onclick="viewCompetition('${competition._id}')">View</button>
                        <button onclick="editCompetition('${competition._id}')">Edit</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        competitionsList.innerHTML = html;
    } catch (error) {
        console.error('Error loading competitions:', error);
        competitionsList.innerHTML = '<p>Error loading competitions. Please try again.</p>';
    }
}

// Load health records
async function loadHealthRecords() {
    const healthList = document.getElementById('health-list');
    healthList.innerHTML = '<p>Loading health records...</p>';
    
    try {
        // Sample data for showcase
        const healthRecords = [
            {
                _id: 'health1',
                date: new Date().toISOString(),
                athlete: { name: 'John Doe' },
                type: 'Injury',
                status: 'Recovery',
                notes: 'Minor ankle sprain, 2 weeks recovery'
            },
            {
                _id: 'health2',
                date: new Date(Date.now() - 10 * 86400000).toISOString(),
                athlete: { name: 'Jane Smith' },
                type: 'Medical Checkup',
                status: 'Completed',
                notes: 'Annual physical examination, all clear'
            },
            {
                _id: 'health3',
                date: new Date(Date.now() - 5 * 86400000).toISOString(),
                athlete: { name: 'Mike Wilson' },
                type: 'Nutrition',
                status: 'Ongoing',
                notes: 'Diet plan adjustment for competition preparation'
            }
        ];
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Athlete</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        healthRecords.forEach(record => {
            html += `
                <tr>
                    <td>${new Date(record.date).toLocaleDateString()}</td>
                    <td>${record.athlete.name}</td>
                    <td>${record.type}</td>
                    <td>${record.status}</td>
                    <td>
                        <button onclick="viewHealthRecord('${record._id}')">View</button>
                        <button onclick="editHealthRecord('${record._id}')">Edit</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        healthList.innerHTML = html;
    } catch (error) {
        console.error('Error loading health records:', error);
        healthList.innerHTML = '<p>Error loading health records. Please try again.</p>';
    }
}

// Load teams
async function loadTeams() {
    const teamsList = document.getElementById('teams-list');
    teamsList.innerHTML = '<p>Loading teams...</p>';
    
    try {
        // Sample data for showcase
        const teams = [
            {
                _id: 'team1',
                name: 'Eagles Track Team',
                sport: 'Track & Field',
                athletes: [{ name: 'John Doe' }, { name: 'Jane Smith' }],
                coaches: [{ name: 'Coach Smith' }],
                description: 'Competitive track and field team focusing on sprints and jumps'
            },
            {
                _id: 'team2',
                name: 'Sharks Swim Club',
                sport: 'Swimming',
                athletes: [{ name: 'Mike Wilson' }, { name: 'Sarah Johnson' }],
                coaches: [{ name: 'Coach Davis' }],
                description: 'Elite swimming team competing at regional and national levels'
            }
        ];
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Sport</th>
                        <th>Athletes</th>
                        <th>Coaches</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        teams.forEach(team => {
            html += `
                <tr>
                    <td>${team.name}</td>
                    <td>${team.sport}</td>
                    <td>${team.athletes.length}</td>
                    <td>${team.coaches.length}</td>
                    <td>
                        <button onclick="viewTeam('${team._id}')">View</button>
                        <button onclick="editTeam('${team._id}')">Edit</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        teamsList.innerHTML = html;
    } catch (error) {
        console.error('Error loading teams:', error);
        teamsList.innerHTML = '<p>Error loading teams. Please try again.</p>';
    }
}

// Global functions for viewing and editing items
window.viewCompetition = function(id) {
    // Implement view competition details
    alert(`View competition with ID: ${id}`);
};

window.editCompetition = function(id) {
    // Implement edit competition
    alert(`Edit competition with ID: ${id}`);
};

window.viewHealthRecord = function(id) {
    // Implement view health record details
    alert(`View health record with ID: ${id}`);
};

window.editHealthRecord = function(id) {
    // Implement edit health record
    alert(`Edit health record with ID: ${id}`);
};

window.viewTeam = function(id) {
    // Implement view team details
    alert(`View team with ID: ${id}`);
};

window.editTeam = function(id) {
    // Implement edit team
    alert(`Edit team with ID: ${id}`);
};

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

// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
});