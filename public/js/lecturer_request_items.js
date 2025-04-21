const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

const container = document.getElementById("request-items");
const approveById = sessionStorage.getItem("userId") || localStorage.getItem("userId");

// Optional: Handle unauthorized
if (!approveById) {
  Swal.fire({
    icon: "error",
    title: "Unauthorized",
    text: "You are not logged in.",
  }).then(() => {
    window.location.replace("/login");
  });
}

fetch('/my-requests/lecturer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ status: 'pending' }),
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
        <div class="col-3 d-flex align-items-center justify-content-center fw-medium">
          ${item.asset_name}
        </div>
        <div class="col-2 d-flex align-items-center justify-content-center fw-medium">
          ${item.borrower}
        </div>
        <div class="col-4 d-flex justify-content-center align-items-center gap-2 flex-wrap">
          <button class="btn btn-primary btn-sm detail-btn">Detail</button>
          <button class="btn btn-success btn-sm approve-btn">Approve</button>
          <button class="btn btn-warning btn-sm reject-btn">Reject</button>
        </div>
      `;

      container.appendChild(row);

      // Detail Button
      row.querySelector(".detail-btn").addEventListener("click", () => {
        Swal.fire({
          title: item.asset_name,
          html: `
            <img src="/img/${item.asset_image}" class="img-fluid rounded mb-3" style="max-width: 300px;">
            <p><strong>Status:</strong> ${item.status}</p>
            <p><strong>Requested Date:</strong> ${item.request_date}</p>
            <p><strong>Return Date:</strong> ${item.return_date}</p>
            <p><strong>Reason:</strong> ${item.reason}</p>
          `,
          confirmButtonText: "Close"
        });
      });

      // ✅ Approve Button
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
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ approve_by_id: approveById }),
            })
              .then(res => res.json())
              .then(() => {
                Swal.fire({
                  icon: "success",
                  title: "Approved",
                  text: `${item.asset_name} has been approved.`,
                  timer: 1000,
                  showConfirmButton: false
                }).then(() => location.reload()); // ✅ Reload page
              })
              .catch(err => {
                console.error("Approval error:", err);
                Swal.fire({
                  icon: "error",
                  title: "Approval Failed",
                  text: "Something went wrong!",
                });
              });
          }
        });
      });

      // ✅ Reject Button
      row.querySelector(".reject-btn").addEventListener("click", () => {
        Swal.fire({
          title: "Reject Request",
          input: "textarea",
          inputLabel: "Rejection Reason",
          inputPlaceholder: `Enter the reason for rejecting ${item.asset_name}...`,
          inputAttributes: {
            'aria-label': 'Type your rejection reason here',
          },
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, reject it",
          cancelButtonText: "Cancel",
          footer: `<div id="char-count" style="font-size: 12px; color: #6c757d;"> 0 / 100 Characters </div>`, // Add footer for character count
          didOpen: () => {
            // Get the textarea input
            const textarea = Swal.getInput();
            const charCount = document.getElementById("char-count");
      
            // Update the character counter as the user types
            textarea.addEventListener("input", () => {
              const typed = textarea.value.length; // Count characters typed
              const remaining = 100 - typed; // Calculate remaining characters
              charCount.textContent = `${typed} / ${remaining} Characters`;
              charCount.style.color = remaining < 0 ? "red" : "#6c757d"; // Turn red if over the limit
            });
          },
          inputValidator: (value) => {
            if (!value) {
              return "Rejection reason is required!";
            }
            if (value.length < 10) {
              return "Rejection reason must be at least 10 characters long.";
            }
            if (value.length > 100) {
              return "Rejection reason must not exceed 100 characters.";
            }
          }
        }).then(result => {
          if (result.isConfirmed) {
            fetch(`/borrow/${item.request_id}/reject`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ approve_by_id: approveById, rejection_reason: result.value }),
            })
              .then(res => res.json())
              .then(() => {
                Swal.fire({
                  icon: "info",
                  title: "Rejected",
                  text: `"${item.asset_name}" has been rejected.`,
                  timer: 1000,
                  showConfirmButton: false
                }).then(() => location.reload()); // ✅ Reload page
              })
              .catch(err => {
                console.error("Rejection error:", err);
                Swal.fire({
                  icon: "error",
                  title: "Rejection Failed",
                  text: "Something went wrong!",
                });
              });
          }
        });
      });
    });
  })