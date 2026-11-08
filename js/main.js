(() => {
    "use strict";

    /* ---------- Footer year ---------- */
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    /* ---------- Mobile menu ---------- */
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    function setMenu(open) {
        navLinks.classList.toggle("active", open);
        menuToggle.setAttribute("aria-expanded", String(open));
    }

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            setMenu(!navLinks.classList.contains("active"));
        });

        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => setMenu(false));
        });
    }

    /* ---------- Rates refresh indicator ---------- */
    const countdown = document.getElementById("countdown");
    const lastRefresh = document.getElementById("lastRefresh");
    const ratesTable = document.querySelector(".rates-table");

    if (countdown && lastRefresh && ratesTable) {
        let seconds = 60;

        const updateRefreshTime = () => {
            lastRefresh.textContent = new Date().toLocaleTimeString("sr-RS");
            ratesTable.classList.add("refreshing");
            setTimeout(() => ratesTable.classList.remove("refreshing"), 1000);
        };

        updateRefreshTime();

        setInterval(() => {
            seconds--;
            countdown.textContent = seconds;

            if (seconds <= 0) {
                updateRefreshTime();
                seconds = 60;
            }
        }, 1000);
    }

    /* ---------- Service modal ---------- */
    const modal = document.getElementById("serviceModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalDescription = document.getElementById("modalDescription");
    const closeModal = modal && modal.querySelector(".close-modal");
    let lastTrigger = null;

    function openModal(card) {
        modalTitle.textContent = card.dataset.title;
        modalDescription.textContent = card.dataset.description;
        lastTrigger = card;
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        closeModal.focus();
    }

    function hideModal() {
        if (!modal.classList.contains("active")) return;
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        if (lastTrigger) lastTrigger.focus();
    }

    if (modal && modalTitle && modalDescription && closeModal) {
        document.querySelectorAll(".service-card").forEach(card => {
            card.addEventListener("click", () => openModal(card));
            card.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openModal(card);
                }
            });
        });

        closeModal.addEventListener("click", hideModal);

        modal.addEventListener("click", e => {
            if (e.target === modal) hideModal();
        });

        // Only one focusable element inside the dialog: keep Tab on it.
        modal.addEventListener("keydown", e => {
            if (e.key === "Tab") {
                e.preventDefault();
                closeModal.focus();
            }
        });
    }

    /* ---------- Escape closes modal / menu ---------- */
    document.addEventListener("keydown", e => {
        if (e.key !== "Escape") return;

        if (modal && modal.classList.contains("active")) {
            hideModal();
        } else if (navLinks && navLinks.classList.contains("active")) {
            setMenu(false);
            menuToggle.focus();
        }
    });
})();
