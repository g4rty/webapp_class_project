document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.clear(); // Clear session
      localStorage.clear(); 
      Swal.fire({
        icon: "success",
        title: "Logged Out",
        text: "You have been logged out.",
      }).then(() => {
        window.location.replace("/"); 
      });
    });
  }
});