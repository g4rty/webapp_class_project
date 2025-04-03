document.addEventListener("DOMContentLoaded", () => {
    fetchDashboardData();
});

function fetchDashboardData() {
    fetch("/dashboard", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }
            return response.json();
        })
        .then((data) => {
            updateDashboardCounts(data); // Ensure this updates the UI
            showPieChart(data);
        })
        .catch((error) => {
            console.error("Error fetching dashboard data:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to load dashboard data.",
            });
        });
}

function updateDashboardCounts(data) {
    document.querySelector(".availableQ").textContent = data.available || 0;
    document.querySelector(".pendingQ").textContent = data.pending || 0;
    document.querySelector(".disabledQ").textContent = data.disabled || 0;
    document.querySelector(".borrowedQ").textContent = data.borrowed || 0;
}

function showPieChart(data) {
    const ctx = document.getElementById("statusChart").getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Available", "Pending", "Disabled", "Borrowed"],
            datasets: [
                {
                    data: [data.available, data.pending, data.disabled, data.borrowed],
                    backgroundColor: ["#28a745", "#ffc107", "#6c757d", "#007bff"],
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "top",
                },
            },
            layout: {
                padding: 20, // reduce the chart size
            },
        },
    });
}
