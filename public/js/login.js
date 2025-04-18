const form_login = document.getElementById("form-login");

function togglePassword(fieldId, button) {
  const input = document.getElementById(fieldId);
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

form_login.onsubmit = async function (e) {
    e.preventDefault();
    const username = form_login.username.value.trim();
    const password = form_login.password.value;

    const options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    };

    try {
        const response = await fetch('/login', options);

        if (response.ok) {
            const result = await response.json();
            const userRole = result.role; // Normalize role
            const userId = result.userId;

            if (!userRole || !userId) {
                throw new Error("Missing user role or ID in server response.");
            }

            // Store user info in both sessionStorage and localStorage
            localStorage.setItem("userId", userId);
            localStorage.setItem("role", userRole);
            sessionStorage.setItem("userId", userId);
            sessionStorage.setItem("role", userRole);

            // SweetAlert and Redirect
            Swal.fire({
                title: "Login Success",
                text: `Welcome ${userRole}!`,
                icon: "success",
                confirmButtonText: "Okay"
            }).then(() => {
                // Redirect based on role
                const redirectPath = {
                    student: "/student/home",
                    staff: "/staff/home",
                    lecturer: "/lecturer/home"
                };

                window.location.replace(redirectPath[userRole] || "/");
            });

        } else if (response.status === 401) {
            const result = await response.text();
            throw new Error(result);
        } else {
            throw new Error("Unexpected server error");
        }
    } catch (err) {
        console.error("Login error:", err);

        Swal.fire({
            title: "Login Failed",
            text: err.message || "An unexpected error occurred.",
            icon: "error",
            confirmButtonText: "Okay"
        });
    }
};
