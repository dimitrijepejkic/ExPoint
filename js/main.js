const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});

const countdown = document.getElementById("countdown");
const lastRefresh = document.getElementById("lastRefresh");
const ratesTable = document.querySelector(".rates-table");

let seconds = 60;

function updateRefreshTime() {
    const now = new Date();

    lastRefresh.textContent =
        now.toLocaleTimeString("sr-RS");

    ratesTable.classList.add("refreshing");

    setTimeout(() => {
        ratesTable.classList.remove("refreshing");
    }, 1000);
}

updateRefreshTime();

setInterval(() => {

    seconds--;

    countdown.textContent = seconds;

    if (seconds <= 0) {
        updateRefreshTime();
        seconds = 60;
    }

}, 1000);

const modal = document.getElementById("serviceModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const closeModal = document.querySelector(".close-modal");

document.querySelectorAll(".service-card").forEach(card => {

    card.addEventListener("click", () => {

        modalTitle.textContent =
            card.dataset.title;

        modalDescription.textContent =
            card.dataset.description;

        modal.classList.add("active");
    });

});

closeModal.addEventListener("click", () => {
    modal.classList.remove("active");
});

modal.addEventListener("click", e => {

    if (e.target === modal) {
        modal.classList.remove("active");
    }

});