// public/js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  // 1) Session Expired (not logged in)
  if (params.get("expired") === "1") {
    sessionStorage.clear();
    localStorage.clear();
    Swal.fire({
      icon: "warning",
      title: "Session Expired",
      text: "You’ve been logged out. Please sign in again.",
      confirmButtonText: "OK"
    }).then(() => {
      // remove query so this doesn’t loop if you reload
      window.location.replace("/login");
    });
    return;
  }

  // 2) Access Denied (wrong role)
  if (params.get("denied") === "1") {
    sessionStorage.clear();
    localStorage.clear();
    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "You don’t have permission to view that page.",
      confirmButtonText: "OK"
    }).then(() => {
      window.location.replace("/login");
    });
    return;
  }

  // 3) Normal Logout button (on protected pages)
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    Swal.fire({
      icon: "question",
      title: "Confirm Logout",
      text: "Are you sure you want to log out?",
      showCancelButton: true,
      confirmButtonText: "Yes, log me out",
      cancelButtonText: "Cancel"
    }).then(result => {
      if (result.isConfirmed) {
        sessionStorage.clear();
        localStorage.clear();
        Swal.fire({
          icon: "success",
          title: "Logged Out",
          text: "You have been logged out.",
          confirmButtonText: "OK"
        }).then(() => {
          window.location.replace("/");
        });
      }
    });
  });
});
