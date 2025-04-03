const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

// Assume staffId is stored in localStorage after login
const userId = localStorage.getItem("userId");

fetch(`/history?role=staff&userId=${userId}`)
  .then(response => response.json())
  .then(items => {
    const container = document.getElementById("request-items");
    if (items.length === 0) {
      container.innerHTML = '<p class="text-center">No history available.</p>';
      return;
    }

    function formatDate(dateStr) {
      if (!dateStr || dateStr === "0000-00-00" || dateStr === null) {
        return "Not Returned";
      }

      const date = new Date(dateStr);

      // If the date is invalid, show fallback
      if (isNaN(date.getTime())) {
        return "Not Returned";
      }

      // Format as DD/MM/YYYY (British style)
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }



    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "d-flex bg-light rounded shadow-sm p-3 mb-3 align-items-center text-center w-100";
      let statusColor = item.status === "returned" ? "bg-success" : item.status === "approved" ? "bg-warning" : "bg-danger";
      row.innerHTML = `
    <div class="col fw-semibold">${item.id}</div>
    <div class="col d-flex justify-content-center">
      <img src="/img/${item.image}" class="img-fluid rounded" style="width: 80px; height: auto;" alt="${item.name}">
    </div>
    <div class="col d-flex align-items-center justify-content-center fw-medium">${item.name}</div>
    <div class="col flex-grow-1 d-flex justify-content-center align-items-center">
      <span class="badge text-dark">${formatDate(item.borrow_date)}</span>
    </div>
    <div class="col d-flex justify-content-center align-items-center">
      <span class="badge text-dark">${formatDate(item.returned_date)}</span>
    </div>
    <div class="col d-flex justify-content-center align-items-center">
      <span class="badge text-dark">${item.borrower}</span>
    </div>
    <div class="col d-flex justify-content-center align-items-center">
      <span class="badge text-dark">${item.approved_by || 'N/A'}</span>
    </div>
    <div class="col d-flex justify-content-center align-items-center">
      <span class="badge text-dark">${item.received_by || 'N/A'}</span>
    </div>
    <div class="col d-flex justify-content-center align-items-center">
      <span class="badge ${statusColor} text-white">${item.status}</span>
    </div>
  `;
      container.appendChild(row);
    });
  })
  .catch(error => console.error('Error fetching history:', error));
