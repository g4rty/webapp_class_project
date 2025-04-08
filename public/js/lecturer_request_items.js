const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

const container = document.getElementById("request-items");
const approveById = sessionStorage.getItem("userId") || localStorage.getItem("userId");

// ✅ Check login once before anything else
if (!approveById) {
  Swal.fire({
    icon: "error",
    title: "Unauthorized",
    text: "You are not logged in.",
  }).then(() => {
    window.location.replace("/login");
  });
  return;
}

fetch('/my-requests/lecturer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'pending' })
})
.then(res => {
  if (!res.ok) throw new Error("Failed to fetch lecturer requests");
  return res.json();
})
.then(items => {
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = "<p class='text-center'>No requests found.</p>";
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "request-item d-flex bg-light rounded shadow-sm p-3 mb-3 align-items-center w-100";
    row.innerHTML = `
      <div class="col-1 text-center fw-semibold">${item.request_id}</div>
      <div class="col-1 d-flex justify-content-center">
        <img src="/img/${item.asset_image}" class="img-fluid rounded" style="width: 150px; height: auto;" alt="${item.asset_name}">
      </div>
      <div class="col-3 d-flex align-items-center justify-content-center fw-medium">${item.asset_name}</div>
      <div class="col-2 d-flex align-items-center justify-content-center fw-medium">${item.borrower}</div>
      <div class="col-4 d-flex justify-content-center align-items-center gap-2 flex-wrap">
        <button class="btn btn-primary btn-sm detail-btn">Detail</button>
        <button class="btn btn-success btn-sm approve-btn">Approve</button>
        <button class="btn btn-warning btn-sm reject-btn">Reject</button>
      </div>
    `;
    container.appendChild(row);

    // ✅ Detail Modal
    row.querySelector(".detail-btn").addEventListener("click", () => {
      Swal.fire({
        title: item.asset_name,
        html: `
          <img src="/img/${item.asset_image}" class="img-fluid rounded mb-3" style="max-width: 300px;">
          <p><strong>Description:</strong> ${item.descrp}</p>
          <p><strong>Reason:</strong> ${item.reason}</p>
          <p><strong>Status:</strong> ${item.status}</p>
          <p><strong>Requested Date:</strong> ${item.request_date}</p>
          <p><strong>Return Date:</strong> ${item.return_date}</p>
          <p><strong>Approved By:</strong> ${item.approved_by || "Not yet approved"}</p>
        `,
        confirmButtonText: "Close"
      });
    });

    // ✅ Approve Handler
    row.querySelector(".approve-btn").addEventListener("click", () => {
      Swal.fire({
        title: "Approve Request",
        text: `Are you sure you want to approve the request for ${item.asset_name}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, approve it",
        cancelButtonText: "Cancel"
      }).then(result => {
        if (result.isConfirmed) {
          fetch(`/borrow/${item.request_id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approve_by_id: approveById })
          })
          .then(res => res.json())
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "Approved",
              text: `${item.asset_name} has been approved.`,
              timer: 1000,
              showConfirmButton: false
            }).then(() => location.reload());
          })
          .catch(err => {
            console.error("Approval error:", err);
            Swal.fire({ icon: "error", title: "Approval Failed", text: "Something went wrong!" });
          });
        }
      });
    });

    // ✅ Reject Handler
    row.querySelector(".reject-btn").addEventListener("click", () => {
      Swal.fire({
        title: "Reject Request",
        text: `Are you sure you want to reject the request for ${item.asset_name}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, reject it",
        cancelButtonText: "Cancel"
      }).then(result => {
        if (result.isConfirmed) {
          fetch(`/borrow/${item.request_id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approve_by_id: approveById })
          })
          .then(res => res.json())
          .then(() => {
            Swal.fire({
              icon: "info",
              title: "Rejected",
              text: `"${item.asset_name}" has been rejected.`,
              timer: 1000,
              showConfirmButton: false
            }).then(() => location.reload());
          })
          .catch(err => {
            console.error("Rejection error:", err);
            Swal.fire({ icon: "error", title: "Rejection Failed", text: "Something went wrong!" });
          });
        }
      });
    });
  });
})
.catch(err => {
  console.error("Error fetching request items:", err);
  Swal.fire({ icon: "error", title: "Error", text: "Failed to load request items." });
});
