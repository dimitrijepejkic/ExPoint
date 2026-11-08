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

    /* ---------- Exchange rates (data/kursna-lista.json) ---------- */
    const RATES_URL = "data/kursna-lista.json";
    const ratesTable = document.querySelector(".rates-table");
    const ratesBody = ratesTable && ratesTable.querySelector("tbody");

    const isValidRate = r =>
        r && typeof r.naziv === "string" && typeof r.oznaka === "string" &&
        Number.isFinite(r.kupovni) && Number.isFinite(r.prodajni);

    // Keep "(8. serija)"-style notes on one line.
    const keepParensTogether = text =>
        text.replace(/\(([^)]*)\)/g, m => m.replace(/ /g, " "));

    function renderRates(rates) {
        const columns = [
            ["Valuta", r => keepParensTogether(r.naziv)],
            ["Oznaka", r => r.oznaka],
            ["Kupovni kurs", r => String(r.kupovni)],
            ["Prodajni kurs", r => String(r.prodajni)]
        ];
        const rows = rates.map(rate => {
            const tr = document.createElement("tr");
            columns.forEach(([label, value]) => {
                const td = document.createElement("td");
                td.dataset.label = label;
                td.textContent = value(rate);
                tr.appendChild(td);
            });
            return tr;
        });
        ratesBody.replaceChildren(...rows);
    }

    const ratesUpdated = document.getElementById("ratesUpdated");

    // "2026-11-09T08:15:00+01:00" -> "09.11.2026. u 08:15" (Belgrade time).
    function formatUpdated(iso) {
        const date = new Date(iso);
        if (typeof iso !== "string" || Number.isNaN(date.getTime())) return "—";
        const parts = Object.fromEntries(
            new Intl.DateTimeFormat("en-GB", {
                timeZone: "Europe/Belgrade", day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", hourCycle: "h23"
            }).formatToParts(date).map(p => [p.type, p.value])
        );
        return `${parts.day}.${parts.month}.${parts.year}. u ${parts.hour}:${parts.minute}`;
    }

    // Loads the JSON and replaces the table rows. On any problem (offline,
    // file:// preview, typo in the JSON) the rows already on the page stay.
    async function loadRates() {
        if (!ratesBody) return;
        try {
            const res = await fetch(RATES_URL, { cache: "no-cache" });
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            const rates = data && data.kursevi;
            if (!Array.isArray(rates) || rates.length === 0 || !rates.every(isValidRate)) {
                throw new Error("neispravan format kursne liste");
            }
            renderRates(rates);
            if (ratesUpdated) ratesUpdated.textContent = formatUpdated(data.azurirano);
        } catch (err) {
            console.warn("Kursna lista nije učitana iz " + RATES_URL + ":", err.message);
        }
    }

    /* ---------- Rates refresh indicator ---------- */
    const countdown = document.getElementById("countdown");

    if (countdown && ratesTable) {
        let seconds = 60;

        const updateRefreshTime = () => {
            loadRates();
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

    /* ---------- Click-to-load Google map ---------- */
    const mapConsent = document.getElementById("mapConsent");
    const mapLoad = document.getElementById("mapLoad");

    if (mapConsent && mapLoad) {
        mapLoad.addEventListener("click", () => {
            const iframe = document.createElement("iframe");
            iframe.title = mapConsent.dataset.mapTitle;
            iframe.src = mapConsent.dataset.mapSrc;
            iframe.width = "100%";
            iframe.height = "450";
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = "no-referrer-when-downgrade";
            mapConsent.replaceWith(iframe);
            iframe.focus();
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
