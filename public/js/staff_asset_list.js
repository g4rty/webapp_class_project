const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("request-items");

  fetch("/assets")
    .then((res) => res.json())
    .then((items) => {
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "d-flex bg-light rounded shadow-sm p-3 mb-3 align-items-center w-100";
        row.innerHTML = `
          <div class="col text-center fw-semibold">${item.id}</div>
          <div class="col d-flex justify-content-center">
              <img src="/img/${item.image}" class="img-fluid rounded" style="width: 150px; height: auto;" alt="${item.name}">
          </div>
          <div class="col text-center">${item.name}</div>
          <div class="col text-center">${item.quantity}</div>
          <div class="col text-center">
              <span class="badge border rounded-3 bg-transparent ${item.status === "Available" ? "text-success" : item.status === "Pending" ? "text-warning" : item.status === "Disable" ? "text-secondary" : "text-danger"}">
                ${item.status}
              </span>
          </div>
          <div class="col text-center">
              <button class="btn btn-warning text-white edit-btn" data-id="${item.id}" data-name="${item.name}" data-status="${item.status}" data-quantity="${item.quantity}">
                Edit
              </button>
              <button class="btn ${item.status === "Disable" ? "btn-success" : "btn-dark"} toggle-btn mx-2"
                data-id="${item.id}" data-status="${item.status}">
                ${item.status === "Disable" ? "Enable" : "Disable"}
              </button>
          </div>
        `;

        container.appendChild(row);
        row.querySelector(".edit-btn").addEventListener("click", function () {
          const assetId = this.getAttribute("data-id");
          const assetName = this.getAttribute("data-name");
          const assetStatus = this.getAttribute("data-status");
          const assetQuantity = this.getAttribute("data-quantity");
          const assetImage = item.image; // assuming `item.image` is available

          Swal.fire({
            title: "Edit Asset",
            html: `
              <form class="text-start">
                <div class="mb-3">
                  <label class="form-label fw-bold">Asset ID</label>
                  <input id="asset-id" class="form-control" value="${assetId}" disabled>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Asset Name</label>
                  <input id="asset-name" class="form-control" value="${assetName}">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Amount Left</label>
                  <input id="asset-quantity" class="form-control" type="number" value="${assetQuantity}">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Status</label>
                  <select id="asset-status" class="form-select">
                    <option value="Available" ${assetStatus === "Available" ? "selected" : ""}>Available</option>
                    <option value="Borrowed" ${assetStatus === "Borrowed" ? "selected" : ""}>Borrowed</option>
                    <option value="Disable" ${assetStatus === "Disable" ? "selected" : ""}>Disable</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Image</label>
                  <input id="asset-image" type="file" accept="image/*" class="form-control">
                  <img id="asset-image-preview" src="/img/${assetImage}" class="mt-2 rounded" style="max-height: 100px;">
                </div>
              </form>
            `,
            showCancelButton: true,
            confirmButtonText: "Save",
            cancelButtonText: "Cancel",
            preConfirm: () => {
              const imageFile = document.getElementById("asset-image").files[0];
              return {
                id: assetId,
                name: document.getElementById("asset-name").value,
                quantity: document.getElementById("asset-quantity").value,
                status: document.getElementById("asset-status").value,
                image: imageFile
              };
            },
            didOpen: () => {
              const imageInput = document.getElementById("asset-image");
              const preview = document.getElementById("asset-image-preview");

              imageInput.addEventListener("change", function () {
                const file = this.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    preview.src = e.target.result;
                  };
                  reader.readAsDataURL(file);
                }
              });
            }
          }).then((result) => {
            if (result.isConfirmed) {
              const formData = new FormData();
              formData.append("name", result.value.name);
              formData.append("quantity", result.value.quantity);
              formData.append("status", result.value.status);
              if (result.value.image) {
                formData.append("image", result.value.image); // optional
              }

              fetch(`/asset/update/${result.value.id}`, {
                method: "POST",
                body: formData
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    Swal.fire("Saved!", "Your changes have been saved.", "success").then(() => {
                      location.reload(); // Refresh UI
                    });
                  } else {
                    Swal.fire("Error", "Failed to save asset changes.", "error");
                  }
                })
                .catch((err) => {
                  Swal.fire("Error", "Something went wrong while saving.", "error");
                  console.error("Save error:", err);
                });
            }
          });
        });



        // Disable/Enable Button
        const toggleButton = row.querySelector(".toggle-btn");

        toggleButton.addEventListener("click", function () {
          const assetId = this.getAttribute("data-id");
          const currentStatus = this.getAttribute("data-status");

          // ตรวจสอบสถานะว่าเป็นการ Disable หรือ Enable
          const isDisabling = currentStatus !== "Disable"; // ถ้าไม่ได้เป็น Disabled ก็แสดงว่าเป็นการ Disable

          Swal.fire({
            title: isDisabling ? "Are you sure?" : "Enable this item?",
            text: isDisabling ? "This item will be disabled!" : "This item will be enabled again!",
            icon: isDisabling ? "warning" : "info",
            showCancelButton: true,
            confirmButtonColor: isDisabling ? "#d33" : "#28a745",
            cancelButtonColor: "#6c757d",
            confirmButtonText: isDisabling ? "Yes, disable it!" : "Yes, enable it!"
          }).then((result) => {
            if (result.isConfirmed) {
              const newStatus = isDisabling ? "Disable" : "Available"; // เปลี่ยนสถานะให้เป็น Disabled หรือ Available

              // เปลี่ยนสถานะใน UI
              const statusBadge = row.querySelector(".badge");
              statusBadge.innerText = newStatus;
              statusBadge.innerText = newStatus;
              statusBadge.classList.remove("text-success", "text-warning", "text-secondary", "text-danger");
              statusBadge.classList.add(
                newStatus === "Available" ? "text-success" :
                  newStatus === "Pending" ? "text-warning" :
                    newStatus === "Disable" ? "text-secondary" :
                      "text-danger"
              );


              // เปลี่ยนปุ่มจาก Disable เป็น Enable
              toggleButton.innerText = newStatus === "Disable" ? "Enable" : "Disable";
              toggleButton.classList.remove("btn-success", "btn-dark");
              toggleButton.classList.add(newStatus === "Disable" ? "btn-success" : "btn-dark");
              toggleButton.setAttribute("data-status", newStatus);


              Swal.fire(newStatus === "Disable" ? "Disabled!" : "Enabled!", `The item is now ${newStatus}.`, "success");

              // ส่งข้อมูลไป API เพื่ออัปเดตสถานะ
              fetch(`/asset/${assetId}/toggle_status`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
              })
                .then((res) => res.json())
                .then((data) => {
                  if (!data.success) {
                    Swal.fire("Error", "Failed to update status.", "error");
                  } else {
                    console.log(`Asset ID ${assetId} is now ${newStatus}`);
                  }
                })
                .catch((error) => {
                  Swal.fire("Error", "Failed to update status.", "error");
                });
            }
          });
        });

        document.querySelector(".btn-info").addEventListener("click", function (event) {
          event.preventDefault();

          Swal.fire({
            title: "Add New Asset",
            html: `
              <form class="text-start">
                <div class="mb-3">
                  <label class="form-label fw-bold">Image</label>
                  <input id="asset-image" type="file" accept="image/*" class="form-control">
                  <img id="asset-image-preview" src="" class="mt-2 rounded d-none" style="max-height: 100px;">
                </div> 
                <div class="mb-3">
                  <label class="form-label fw-bold">Asset Name</label>
                  <input id="new-asset-name" class="form-control">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Desription</label>
                  <input id="new-asset-type" class="form-control">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Quantity</label>
                  <input id="new-asset-quantity" class="form-control" type="number" min="1">
                </div>
                <div class="mb-3">
                  <label class="form-label fw-bold">Status</label>
                  <select id="new-asset-status" class="form-select">
                    <option value="Available">Available</option>
                    <option value="Borrowed">Borrowed</option>
                  </select>
                </div>
              </form>
            `,
            showCancelButton: true,
            confirmButtonText: "Save",
            cancelButtonText: "Cancel",
            preConfirm: () => {
              return {
                name: document.getElementById("new-asset-name").value,
                type: document.getElementById("new-asset-type").value,
                quantity: document.getElementById("new-asset-quantity").value,
                status: document.getElementById("new-asset-status").value,
                image: document.getElementById("asset-image").files[0]
              };
            },
            didOpen: () => {
              const imageInput = document.getElementById("asset-image");
              const preview = document.getElementById("asset-image-preview");

              imageInput.addEventListener("change", function () {
                const file = this.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.classList.remove("d-none");
                  };
                  reader.readAsDataURL(file);
                }
              });
            }
          }).then((result) => {
            if (result.isConfirmed) {
              const formData = new FormData();
              formData.append("name", result.value.name);
              formData.append("type", result.value.type);
              formData.append("quantity", result.value.quantity);
              formData.append("status", result.value.status);
              if (result.value.image) {
                formData.append("image", result.value.image);
              }

              fetch("/asset/add", {
                method: "POST",
                body: formData
              })
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    Swal.fire("Added!", "New asset has been added.", "success").then(() => {
                      location.reload();
                    });
                  } else {
                    Swal.fire("Error", "Failed to add asset.", "error");
                  }
                })
                .catch(err => {
                  console.error(err);
                  Swal.fire("Error", "Server error occurred.", "error");
                });
            }
          });
        });
      });
    });
});
