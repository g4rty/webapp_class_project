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
      const status = item.quantity === 0 ? "Borrowed" : item.status;
      const row = document.createElement("div");
      row.className = "d-flex bg-light rounded shadow-sm p-3 mb-3 align-items-center w-100";

      row.innerHTML = `
        <div class="col text-center fw-semibold">${item.id}</div>
        <div class="col d-flex justify-content-center">
            <img src="/img/${item.image}" class="img-fluid rounded" style="width: 150px; height: auto;" alt="${item.name}">
        </div>
        <div class="col d-flex align-items-center justify-content-center fw-medium">
            ${item.name}
        </div>
        <div class="col text-center fw-semibold">${item.quantity}</div>
        <div class="col d-flex justify-content-center align-items-center">
            <span class="badge border rounded-3 bg-transparent 
              ${status === "Pending" ? "text-warning" : status === "Available" ? "text-success" : status === "Disable" ? "text-secondary" : status === "Borrowed" ? "text-danger" : "text-dark"}">
                ${status}
            </span>
        </div>
         
      `;

      container.appendChild(row);
    }
  })
  .catch((err) => {
    console.error("Failed to load assets:", err);
    container.innerHTML = `<p class="text-danger">Failed to load asset list.</p>`;
  });


