// 🔁 Send connection request
function sendConnectionRequest(targetUid, targetRole) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.uid) return alert("You must be logged in");

  const senderUid = user.uid;
  const receiverUid = targetUid;

  const ref1 = firebase.database().ref(`connections/${senderUid}/${receiverUid}`);
  const ref2 = firebase.database().ref(`connections/${receiverUid}/${senderUid}`);

  const requestData = {
    type: targetRole,
    status: "requested",
    requestedBy: senderUid
  };

  const mirrorData = {
    type: user.role,
    status: "requested",
    requestedBy: senderUid // ✅ MUST be same UID on both sides
  };

  ref1.set(requestData);
  ref2.set(mirrorData);

  alert("Connection request sent!");
}


function loadMyConnections() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.uid) return;

  const container = document.getElementById("connection-requests");
  container.innerHTML = "<h3>Your Connections</h3>";

  firebase.database().ref(`connections/${user.uid}`).once("value")
    .then(async (snapshot) => {
      const connections = snapshot.val();
      console.log("🔍 My connections:", connections);

      if (!connections) {
        container.innerHTML += "<p>No connections found.</p>";
        return;
      }

      const usersSnapshot = await firebase.database().ref("users").once("value");
      const usersData = usersSnapshot.val() || {};
      let html = "";

    Object.entries(connections).forEach(([otherUid, conn]) => {
      const otherUser = usersData[otherUid];
      const name = otherUser?.name || otherUid;
      const role = conn.type || "Unknown";
      const status = conn.status;
      const requestedBy = conn.requestedBy;

      if (status === "requested" && requestedBy !== user.uid) {
        // You RECEIVED this request → show Approve + Decline
        html += `
          <div class="user-card">
            <b>${name}</b> - ${role}
            <button onclick="approveConnection('${otherUid}')">Approve</button>
            <button onclick="cancelConnection('${otherUid}')">Decline</button>
          </div>`;
      } else if (status === "requested" && requestedBy === user.uid) {
        // You SENT this request → show Requested + Cancel
        html += `
          <div class="user-card">
            <b>${name}</b> - ${role}
            <span class="badge requested">Requested</span>
            <button onclick="cancelConnection('${otherUid}')">Cancel</button>
          </div>`;
      } else if (status === "approved") {
        html += `<div class="user-card"><b>${name}</b> - ${role} ✅ Connected</div>`;
      }



      });
      


      container.innerHTML += html || "<p>No connections found.</p>";
    })
    .catch(error => {
      console.error("🔥 Error loading connections:", error);
      container.innerHTML += "<p>Error loading connections. Check console.</p>";
    });



}


// 📥 Load all my connections (pending + approved)

function approveConnection(fromUid) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.uid) return;

  const ref1 = firebase.database().ref(`connections/${user.uid}/${fromUid}`);
  const ref2 = firebase.database().ref(`connections/${fromUid}/${user.uid}`);

  ref1.update({ status: "approved" }).then(() => {
    return ref2.update({ status: "approved" });
  }).then(() => {
    alert("Connection approved!");
    loadMyConnections();
  }).catch(error => {
    console.error("Approval error:", error);
    alert("Error approving connection: " + error.message);
  });
}


function loadUsersForConnection() {
  firebase.database().ref("users").once("value").then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const userList = Object.entries(data).map(([uid, user]) => ({
      uid,
      name: user.name,
      role: user.role
    }));

    showAllUsersForConnection(userList);
  });
}

function loadApprovedConnections() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.uid) {
    console.error("No user found in localStorage");
    return;
  }

  const container = document.getElementById("approved-connections");
  container.innerHTML = "<p>Loading connections...</p>";

  console.log("👤 Current UID:", user.uid);

  firebase.database().ref(`connections/${user.uid}`).once("value")
    .then(async snapshot => {
      const data = snapshot.val();
      console.log("📦 Firebase data:", data);

      if (!data) {
        container.innerHTML = "<p>No connections found.</p>";
        return;
      }

      const usersSnapshot = await firebase.database().ref("users").once("value");
      const usersData = usersSnapshot.val() || {};
      container.innerHTML = "<h3>Connected Users</h3>";
      let found = false;

      Object.entries(data).forEach(([uid, conn]) => {
        if (conn.status === "approved") {
          found = true;
          const userName = usersData[uid]?.name || uid;
          container.innerHTML += `
            <div class="user-card">
              <b>${userName}</b> - ${conn.type} ✅
            </div>
          `;
        }
      });

      if (!found) {
        container.innerHTML += "<p>No approved connections yet.</p>";
      }
    })
    .catch(error => {
      console.error("🔥 Error loading connections:", error);
      container.innerHTML = "<p>Error loading connections. Check console.</p>";
    });
}

function showConnectionsSection() {
    hideAllContainers();  // hide other views
    const section = document.getElementById("connections-section");
    if (section) section.style.display = "block";
    loadApprovedConnections();  // Load the approved connections
    loadUsersForConnection();
     loadUsersForConnection();
}
// 👥 Optional: Show connect buttons for a list of users
function showAllUsersForConnection(userList) {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const container = document.getElementById("user-list");
  container.innerHTML = "<h3>Connect with Users</h3>";

  userList.forEach(otherUser => {
    // 🚫 Skip if it's the current user
    if (otherUser.uid === currentUser.uid) return;

    const userBlock = document.createElement("div");
    userBlock.className = "user-card";
    userBlock.innerHTML = `<b>${otherUser.name}</b> - ${otherUser.role} `;

    const button = document.createElement("button");
    button.className = "connect-btn";
    button.textContent = "Checking..."; // Temporary state

    // 🔍 Check existing connection status
    firebase.database().ref(`connections/${currentUser.uid}/${otherUser.uid}`).once("value")
      .then(snapshot => {
        const data = snapshot.val();

        if (!data) {
          // 🔗 Not connected — allow request
          button.textContent = "Connect";
          button.onclick = () => {
            sendConnectionRequest(otherUser.uid, otherUser.role);
            button.textContent = "Requested";
            button.disabled = true;
            button.classList.add("requested");
          };
        } else {
          // 👥 Already connected/requested
          button.disabled = true;
          if (data.status === "approved") {
            button.textContent = "Connected";
            button.classList.add("connected");
          } else {
            button.textContent = "Requested";
            button.classList.add("requested");
          }
        }
      });

    userBlock.appendChild(button);
    container.appendChild(userBlock);
  });
}
function cancelConnection(otherUid) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.uid) return;

  const ref1 = firebase.database().ref(`connections/${user.uid}/${otherUid}`);
  const ref2 = firebase.database().ref(`connections/${otherUid}/${user.uid}`);

  //  Remove both sides
  ref1.remove()
    .then(() => ref2.remove())
    .then(() => {
      alert("Connection cancelled.");
      loadMyConnections();
    })
    .catch(error => {
      console.error("Error cancelling connection:", error);
      alert("Error: " + error.message);
    });
}

