const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("pickup-items");

  fetch("/handover-requests")
    .then((res) => res.json())
    .then((items) => {
      if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = `<p class="text-center w-100">No handover requests found.</p>`;
        return;
      }

      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "d-flex bg-light rounded shadow-sm p-3 mb-3 mt-3 align-items-center w-100";
        // row.style.height = "120px";

        row.innerHTML = `
        <div class="col-1 text-center fw-semibold">${item.request_id}</div>
        <div class="col-1 d-flex justify-content-center">
          <img src="/img/${item.asset_image}" class="img-fluid rounded" style="width: 150px; height: auto;" alt="${item.asset_name}">
        </div>
        <div class="col-2 text-center">${item.asset_name}</div>
        <div class="col-2 text-center">${item.borrower_first_name} ${item.borrower_last_name}</div>
        <div class="col-2 text-center">${item.approved_by_name || "N/A"}</div>
        <div class="col-2 text-center">${new Date(item.borrow_date).toLocaleDateString()}</div>
        <div class="col-2 text-center">
          <button class="btn btn-success handover-btn" data-id="${item.request_id}">
            Handover
          </button>
        </div>
      `;

        container.appendChild(row);
      });

      // Event listener for handover buttons
      document.querySelectorAll(".handover-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
        const requestId = this.dataset.id;
        const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

          if (!userId || isNaN(userId)) {
            Swal.fire("Error", "User ID not found in session. Please log in again.", "error");
            return;
          }

          Swal.fire({
            title: "Confirm Handover?",
            text: "Are you handing over this asset?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#198754",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, Handover"
          }).then((result) => {
            if (result.isConfirmed) {
              fetch(`/handover/${requestId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId })
              })
                .then(async (res) => {
                  const data = await res.json().catch(() => null);
                  if (!data) {
                    throw new Error("Invalid JSON response");
                  }
                  if (data.success) {
                    Swal.fire("Success!", data.message, "success").then(() => location.reload());
                  } else {
                    Swal.fire("Error", data.message, "error");
                  }
                })
                .catch((err) => {
                  console.error("Handover Error:", err);
                  Swal.fire("Error", "Something went wrong. Please try again.", "error");
                });
            }
          });
        });
      });
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      container.innerHTML = `<p class="text-danger text-center w-100">Failed to load handover requests.</p>`;
    });
});