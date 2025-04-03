const toggleBtn = document.getElementById("toggle-btn");
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("main-content");

// Sidebar toggle
toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("active");
  content.classList.toggle("shifted");
});

// Load news from backend
function loadNews() {
  const container = document.getElementById("news-container");
  container.innerHTML = `<p class="text-center text-muted">Loading...</p>`;

  fetch("/news")
    .then(res => res.json())
    .then(newsList => {
      container.innerHTML = "";

      const count = Math.max(newsList.length, 3); // Always show 3 cards

      for (let i = 0; i < count; i++) {
        const news = newsList[i] || null; // Fill in placeholders if less than 3
        container.appendChild(createNewsCard(news));
      }
    })
    .catch(err => {
      console.error("Failed to fetch news:", err);
      container.innerHTML = `<p class="text-danger text-center">Failed to load news.</p>`;
    });
}

// Create a news card (either real or empty)
function createNewsCard(news) {
  const col = document.createElement("div");
  col.className = "col-md-4";

  const imageUrl = news?.image
    ? `/img/${news.image}`
    : "https://via.placeholder.com/300x200?text=No+News";

  const imageId = news?.id || "";

  col.innerHTML = `
    <div class="card shadow-sm">
      <img src="${imageUrl}" class="card-img-top" data-id="${imageId}" style="height: 200px; object-fit: cover;">
      <div class="card-body text-center">
        <button class="btn btn-primary me-2" onclick="openUploadSwal(this)">Upload</button>
        <button class="btn btn-danger" onclick="deleteImage(this)" ${!news ? "disabled" : ""}>Delete</button>
      </div>
    </div>
  `;
  return col;
}

// Upload News
function openUploadSwal(button) {
  Swal.fire({
    title: 'Upload News Image',
    html: `
      <input type="file" id="uploadInput" class="form-control mb-3" accept="image/*" />
      <img id="previewImage" src="https://via.placeholder.com/150" class="img-fluid" style="max-height:200px;" />
    `,
    showCancelButton: true,
    confirmButtonText: 'Upload',
    preConfirm: () => {
      const file = document.getElementById('uploadInput').files[0];
      if (!file) {
        Swal.showValidationMessage('Please select an image.');
        return false;
      }

      const formData = new FormData();
      formData.append('image', file);

      return fetch('/upload/news', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
      })
      .then(data => {
        Swal.fire('Uploaded!', 'Your image has been uploaded.', 'success')
          .then(() => loadNews()); // Reload news after upload
        return data;
      })
      .catch(() => {
        Swal.showValidationMessage('Upload failed.');
      });
    }
  });

  // Preview logic
  setTimeout(() => {
    const input = document.getElementById('uploadInput');
    input?.addEventListener('change', (e) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    });
  }, 100);
}

// Delete News
function deleteImage(button) {
  const card = button.closest('.card');
  const img = card.querySelector('img');
  const newsId = img.getAttribute('data-id');

  if (!newsId) {
    Swal.fire("Error", "No image ID found for this card.", "error");
    return;
  }

  Swal.fire({
    title: 'Delete this image?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      fetch(`/news/${newsId}`, {
        method: 'DELETE'
      })
      .then(response => {
        if (!response.ok) throw new Error("Failed to delete.");
        return response.json();
      })
      .then(data => {
        Swal.fire('Deleted!', data.message, 'success').then(() => loadNews());
      })
      .catch(err => {
        Swal.fire("Error", "Failed to delete image from server.", "error");
        console.error(err);
      });
    }
  });
}

loadNews(); // Load on page ready
