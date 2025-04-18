const registerForm = document.getElementById("register-form");
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

registerForm.onsubmit = async function (e) {
    e.preventDefault();

    const first_name = registerForm.first_name.value;
    const last_name = registerForm.last_name.value;    
    const username = registerForm.username.value;
    const email = registerForm.email.value;
    const password = registerForm.password.value;
    const confirmPassword = registerForm.confirmPassword.value;

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({first_name,last_name, username, email, password, confirmPassword })
    };

    try {
        const response = await fetch("/register", options);
        if (response.status === 200) {

            Swal.fire({
                title: "Registration Successful",
                text: "You have registered as a student.",
                icon: "success",
                confirmButtonText: "Okay"
            }).then(() => {
                window.location.replace('/login');
            });
        } else if (response.status === 409) {
            throw new Error("Username or email already exists");
        } else if (response.status === 400) {
            const errorText = await response.text();
            throw new Error(errorText);  // Catch password mismatch or other validation errors
        } else {
            throw new Error("Registration failed");
        }
    } catch (err) {
        Swal.fire({
            title: "Registration Failed",
            text: err.message,
            icon: "error",
            confirmButtonText: "Okay"
        });
    }
};
