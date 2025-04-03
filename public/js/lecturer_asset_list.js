const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

const container = document.getElementById("request-items");

fetch("/assets")
  .then((res) => res.json()) 
  .then((items) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const row = document.createElement("div");
      row.className = "d-flex bg-light rounded shadow-sm p-3 mb-3 align-items-center w-100";

      row.innerHTML = `
        <div class="col-1 text-center fw-semibold">${item.id}</div>
        <div class="col-1 d-flex justify-content-center">
            <img src="/img/${item.image}" class="img-fluid rounded" style="width: 150px; height: auto;" alt="${item.name}">
        </div>
        <div class="col-2 d-flex align-items-center justify-content-center fw-medium">
            ${item.name}
        </div>
        <div class="col-3 d-flex justify-content-center align-items-center">
            <span class="badge border rounded-3 bg-transparent 
              ${item.status === "Pending" ? "text-warning" : item.status === "Available" ? "text-success" : item.status === "Disable" ? "text-secondary" : "text-danger"}">
              ${item.status}
            </span>
        </div>
        <div class="col-5 d-flex justify-content-center align-items-center gap-2 flex-wrap">
            <button class="btn btn-success btn-sm view-btn">View Detail</button>
        </div>
      `;

      container.appendChild(row);

      const viewBtn = row.querySelector(".view-btn");
      viewBtn.addEventListener("click", () => {
        Swal.fire({
          title: item.name,
          html: `
            <img src="/img/${item.image}" alt="${item.name}" class="img-fluid rounded mb-3" style="max-width: 300px;">
            <p><strong>Status:</strong> ${item.status}</p>
            <p><strong>Quantity:</strong> ${item.quantity}</p>
          `,
          confirmButtonText: "Close"
        });
      });
    }
  })
  .catch((err) => {
    console.error("Failed to load assets:", err);
    container.innerHTML = `<p class="text-danger">Failed to load asset list.</p>`;
  });


