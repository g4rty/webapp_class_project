const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

const container = document.getElementById("request-items");

document.addEventListener("DOMContentLoaded", () => {
  const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
  const role = sessionStorage.getItem("role") || localStorage.getItem("userId");

  if (!userId || !role) {
    Swal.fire({
      icon: "error",
      title: "Unauthorized",
      text: "You are not logged in or your role is missing.",
    }).then(() => {
      window.location.replace("/login.html");
    });
    return;
  }

  console.log("Fetching history for userId:", userId, "role:", role); // Debug log

  fetchHistoryData(userId, role);
});

function fetchHistoryData(userId, role) {
  fetch(`/history?role=${role}&userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.error || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log("Fetched history data:", data); // Debug log
      displayHistoryData(data);
    })
    .catch((error) => {
      console.error("Error fetching history data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to fetch history data. Please try again later.",
      });
    });
}

function displayHistoryData(items) {
  const container = document.getElementById("request-items");
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<div class="text-center text-muted">No history records found.</div>`;
    return;
  }

  const today = new Date();

  items.reverse(); // newest first
  items.forEach(item => {
    const isRejected = item.status === "rejected";
    const isReturned = item.handover_by_id && item.receiver_id;
    const isWaitingTakeout = item.status === "approved" && !item.handover_by_id;
    const isWaitingReturn = item.status === "approved" && item.handover_by_id && !item.receiver_id;

    // Normalize dates to remove time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const returnDate = new Date(item.return_date);
    returnDate.setHours(0, 0, 0, 0);

    const isOverdue = item.return_date && !isReturned && returnDate < today;

    // ✅ Add Rejected Label
    const statusLabel = isReturned
      ? "Successfully Returned"
      : isRejected
        ? "Rejected"
        : isWaitingTakeout
          ? "Waiting for Takeout"
          : isWaitingReturn
            ? isOverdue
              ? "Overdue - Waiting for Return"
              : "Waiting for Return"
            : item.status.charAt(0).toUpperCase() + item.status.slice(1);

    // Set badge color for rejected = bg-danger
    const badgeClass = isReturned
      ? "bg-success"
      : isRejected
        ? "bg-danger"
        : isWaitingTakeout
          ? "bg-info text-dark"
          : isWaitingReturn
            ? isOverdue
              ? "bg-danger"
              : "bg-primary"
            : "bg-secondary";
  });

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className =
      "d-flex bg-light rounded shadow-sm p-3 mb-3 align-items-center w-100";
    const statusColor = item.status === "approved" ? "bg-success" : "bg-danger";

    row.innerHTML = `
      <div class="col-1 text-center fw-semibold">${item.id || "N/A"}</div>
      <div class="col-1 d-flex justify-content-center">
        <img src="/img/${item.image || "placeholder.png"}" class="img-fluid rounded" style="width: 150px; height: auto;" alt="${item.name || "No Name"}">
      </div>
      <div class="col-2 d-flex align-items-center justify-content-center fw-medium">
        ${item.name || "N/A"}
      </div>
      <div class="col-2 d-flex justify-content-center align-items-center">
        <span class="badge text-dark">${item.borrower || "N/A"}</span>
      </div>
      <div class="col-2 d-flex justify-content-center align-items-center">
        <span class="badge text-dark">${item.Approval_date || "N/A"}</span>
      </div>
      <div class="col-2 d-flex justify-content-center align-items-center">
        <span class="badge text-dark">${item.approved_by || "N/A"}</span>
      </div>
      <div class="col-2 d-flex justify-content-center align-items-center">
        <span class="badge ${statusColor} text-white">${item.status || "N/A"}</span>
      </div>
    `;

    container.appendChild(row);
  });
}

