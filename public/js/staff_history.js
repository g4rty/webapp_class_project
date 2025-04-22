const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

const userId = localStorage.getItem("userId");

fetch(`/history?role=staff&userId=${userId}`)
  .then(response => response.json())
  .then(items => {
    const container = document.getElementById("request-items");

    if (!items || items.length === 0) {
      container.innerHTML = '<p class="text-center">No history available.</p>';
      return;
    }

    function formatDate(dateStr) {
      if (!dateStr || dateStr === "0000-00-00" || dateStr === null) {
        return "Not Returned";
      }
      const date = new Date(dateStr);
      return isNaN(date.getTime())
        ? "Not Returned"
        : date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          });
    }

    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "d-flex bg-light rounded shadow-sm p-3 mb-3 align-items-center text-center w-100";

      let statusColor = item.status === "returned"
        ? "bg-success"
        : item.status === "approved"
          ? "text-success border border-success"
          : "text-danger border border-danger";

      const statusContent = item.status === "rejected"
        ? `<button 
             class="btn btn-outline-danger btn-sm reason-btn" 
             data-reason="${item.rejection_reason || 'No reason provided'}"
             data-bs-toggle="tooltip"
             title="Click to view rejection reason">
             <i class="fas fa-info-circle me-1"></i> View Rejection Reason
           </button>`
        : `<div class="badge ${statusColor} text-break w-100">${item.status}</div>`;

      row.innerHTML = `
        <div class="col fw-semibold">${item.id}</div>
        <div class="col d-flex justify-content-center">
          <img src="/img/${item.image}" class="img-fluid rounded" style="width: 150px; height: auto;" alt="${item.name}">
        </div>
        <div class="col d-flex align-items-center justify-content-center fw-medium text-break">${item.name}</div>
        <div class="col d-flex justify-content-center align-items-center">
          <div class="badge text-dark text-break">${formatDate(item.borrow_date)}</div>
        </div>
        <div class="col d-flex justify-content-center align-items-center">
          <div class="badge text-dark text-break">${formatDate(item.returned_date)}</div>
        </div>
        <div class="col d-flex justify-content-center align-items-center">
          <div class="badge text-dark text-break w-100">${item.borrower || 'Not Available'}</div>
        </div>
        <div class="col d-flex justify-content-center align-items-center">
          <div class="badge text-dark text-break w-100">${item.approved_by || 'Not Available'}</div>
        </div>
        <div class="col d-flex justify-content-center align-items-center">
          <div class="badge text-dark text-break w-100">${item.received_by || 'Not Available'}</div>
        </div>
        <div class="col d-flex justify-content-center align-items-center">
          ${statusContent}
        </div>
      `;

      container.appendChild(row);
    });

    // ✅ Attach event listener to all rejection reason buttons
    document.querySelectorAll(".reason-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        Swal.fire({
          icon: "info",
          title: "Rejection Reason",
          text: btn.dataset.reason,
          confirmButtonText: "Close"
        });
      });
    });

    // ✅ Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
  })
  .catch(error => {
    console.error('Error fetching history:', error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to fetch history data."
    });
  });
