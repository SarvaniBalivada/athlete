// Firebase initialization
const firebaseConfig = {
    apiKey: "AIzaSyDlYY6AiVDm_oMp8WDmaNR-iR8Cx0X3HH0",
    authDomain: "athlete-4c975.firebaseapp.com",
    databaseURL: "https://athlete-4c975-default-rtdb.firebaseio.com",
    projectId: "athlete-4c975",
    storageBucket: "athlete-4c975.appspot.com",
    messagingSenderId: "1012046041407",
    appId: "1:1012046041407:web:4939a7f92615ce8d70438a",
    measurementId: "G-MKSPH24DTC"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const sidebar = document.getElementById('sidebar');

    if (token) {
        hideAllContainers();
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) loginContainer.style.display = 'none';
        const registerContainer = document.getElementById('register-container');
        if (registerContainer) registerContainer.style.display = 'none';
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'block';

        if (sidebar) sidebar.style.display = 'block';

        const navLinks = document.querySelectorAll('.nav-links li');
        if (navLinks) {
            navLinks.forEach(item => {
                item.style.display = 'block';
            });
        }

        loadDashboard();
    } else {
        hideAllContainers();
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) loginContainer.style.display = 'block';
        const registerContainer = document.getElementById('register-container');
        if (registerContainer) registerContainer.style.display = 'none';

        if (sidebar) sidebar.style.display = 'none';

        const navLinks = document.querySelectorAll('.nav-links li');
        if (navLinks) {
            navLinks.forEach(item => {
                const homeLink = item.querySelector('#home-link');
                item.style.display = homeLink ? 'block' : 'none';
            });
        }
    }
}


// Login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // TEMP: default role as 'coach' (replace with DB fetch later)
        const defaultRole = 'coach';

        localStorage.setItem('token', await user.getIdToken());
        localStorage.setItem('user', JSON.stringify({ email: user.email, uid: user.uid, role: defaultRole }));

        checkAuth();
    } catch (error) {
        alert(error.message);
    }
});

// Register form
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        localStorage.setItem('token', await user.getIdToken());
        localStorage.setItem('user', JSON.stringify({ email: user.email, uid: user.uid, name, role }));

        alert('Registration successful!');
        checkAuth();
    } catch (error) {
        alert(error.message);
    }
});

// Toggle forms
document.getElementById('register-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
});

document.getElementById('login-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('register-container').style.display = 'none';
});

// Logout
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        const target = e.target;

        // PROFILE LINK
        if (target.id === 'profile-link') {
            e.preventDefault();
            hideAllContainers();
            loadProfile();
        }

        // LOGOUT LINK
        if (target.id === 'logout-link') {
            e.preventDefault();
            auth.signOut().then(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                checkAuth();
            }).catch(error => {
                alert("Logout failed: " + error.message);
            });
        }
    });
});



function loadProfile() {
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Demo User', email: 'demo@example.com', role: 'coach' };
    
    // Create a profile container if it doesn't exist
    if (!document.getElementById('profile-container')) {
        const profileContainer = document.createElement('div');
        profileContainer.id = 'profile-container';
        document.querySelector('main').appendChild(profileContainer);
    }
    
    const profileContainer = document.getElementById('profile-container');
    profileContainer.style.display = 'block';
    
    profileContainer.innerHTML = `
        <h2>User Profile</h2>
        <div class="profile-info">
            <div class="profile-section">
                <h3>Personal Information</h3>
                <div id="profile-view">
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    <button id="edit-profile-btn">Edit Profile</button>
                </div>
                <div id="profile-edit" style="display: none;">
                    <form id="profile-form">
                        <div class="form-group">
                            <label for="profile-name">Name</label>
                            <input type="text" id="profile-name" value="${user.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="profile-email">Email</label>
                            <input type="email" id="profile-email" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="profile-role">Role</label>
                            <select id="profile-role" required>
                                <option value="athlete" ${user.role === 'athlete' ? 'selected' : ''}>Athlete</option>
                                <option value="coach" ${user.role === 'coach' ? 'selected' : ''}>Coach</option>
                                <option value="medical" ${user.role === 'medical' ? 'selected' : ''}>Medical Staff</option>
                                <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="profile-password">New Password (leave blank to keep current)</label>
                            <input type="password" id="profile-password">
                        </div>
                        <button type="submit">Save Changes</button>
                        <button type="button" id="cancel-edit">Cancel</button>
                    </form>
                </div>
            </div>
            <div class="profile-section">
                <h3>Activity Summary</h3>
                <div class="activity-charts">
                    <div class="chart-container">
                        <h4>Training Sessions</h4>
                        <canvas id="training-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Competitions</h4>
                        <canvas id="competitions-chart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h4>Health Records</h4>
                        <canvas id="health-chart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for profile edit
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        document.getElementById('profile-view').style.display = 'none';
        document.getElementById('profile-edit').style.display = 'block';
    });
    
    document.getElementById('cancel-edit').addEventListener('click', () => {
        document.getElementById('profile-view').style.display = 'block';
        document.getElementById('profile-edit').style.display = 'none';
    });
    
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Update user info in localStorage
        const updatedUser = {
            ...user,
            name: document.getElementById('profile-name').value,
            email: document.getElementById('profile-email').value,
            role: document.getElementById('profile-role').value
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Show success message and reload profile
        alert('Profile updated successfully!');
        loadProfile();
    });
    
    // Create pie charts for activity data
    createActivityCharts();
}

// Function to create activity charts
function createActivityCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        // If Chart.js is not loaded, dynamically add it
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = initCharts;
        document.head.appendChild(script);
    } else {
        initCharts();
    }
    
    function initCharts() {
        // Training sessions chart
        new Chart(document.getElementById('training-chart'), {
            type: 'pie',
            data: {
                labels: ['Completed', 'Upcoming', 'Cancelled'],
                datasets: [{
                    data: [12, 3, 2],
                    backgroundColor: ['#4CAF50', '#2196F3', '#F44336'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Competitions chart
        new Chart(document.getElementById('competitions-chart'), {
            type: 'pie',
            data: {
                labels: ['Participated', 'Upcoming', 'Missed'],
                datasets: [{
                    data: [5, 2, 1],
                    backgroundColor: ['#4CAF50', '#2196F3', '#F44336'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
        // Health records chart
        new Chart(document.getElementById('health-chart'), {
            type: 'pie',
            data: {
                labels: ['Checkups', 'Injuries', 'Nutrition'],
                datasets: [{
                    data: [3, 1, 2],
                    backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}
// Hide all containers
function hideAllContainers() {
    const containers = [
        'dashboard-container',
        'training-container',
        'competitions-container',
        'health-container',
        'teams-container',
        'profile-container'
    ];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}
