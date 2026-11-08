/*
 * Admin page for the exchange-rate list (private, unlinked page; see README).
 *
 * Reads and writes data/kursna-lista.json in the GitHub repository through the
 * GitHub Contents API. Each save is a commit; GitHub Pages republishes the
 * site about a minute later. The access token (fine-grained, this repo only,
 * Contents: read & write) is kept only in this browser's storage.
 */
(() => {
    "use strict";

    const OWNER = "dimitrijepejkic";
    const REPO = "ExPoint";
    const PATH = "data/kursna-lista.json";
    const BRANCH = "main";
    const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;
    const TOKEN_KEY = "expoint-admin-token";

    const $ = id => document.getElementById(id);
    const loginView = $("loginView");
    const editorView = $("editorView");
    const loginForm = $("loginForm");
    const tokenInput = $("tokenInput");
    const rememberInput = $("rememberInput");
    const ratesForm = $("ratesForm");
    const rowsBox = $("ratesRows");
    const rowTemplate = $("rowTemplate");
    const addRowBtn = $("addRow");
    const saveBtn = $("saveBtn");
    const logoutBtn = $("logoutBtn");
    const adminUpdated = $("adminUpdated");
    const adminStatus = $("adminStatus");
    const globalStatus = $("globalStatus");

    let token = "";
    let fileSha = "";
    let dirty = false;

    /* ---------- token storage (never sent anywhere except api.github.com) ---------- */
    function readToken() {
        for (const store of [window.localStorage, window.sessionStorage]) {
            try {
                const t = store.getItem(TOKEN_KEY);
                if (t) return t;
            } catch (e) { /* storage blocked */ }
        }
        return "";
    }

    function storeToken(value, remember) {
        try {
            (remember ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, value);
        } catch (e) { /* storage blocked: token lives only in memory for this visit */ }
    }

    function clearToken() {
        for (const store of [window.localStorage, window.sessionStorage]) {
            try { store.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
        }
        token = "";
    }

    /* ---------- UI helpers ---------- */
    function showStatus(box, type, text, link) {
        box.hidden = false;
        box.className = "admin-status is-" + type;
        box.textContent = text;
        if (link) {
            box.append(" ");
            const a = document.createElement("a");
            a.href = link.href;
            a.textContent = link.text;
            a.target = "_blank";
            a.rel = "noopener";
            box.append(a);
        }
    }

    function hideStatus(box) {
        box.hidden = true;
        box.textContent = "";
    }

    function showLogin(message) {
        editorView.hidden = true;
        loginView.hidden = false;
        rowsBox.replaceChildren();
        dirty = false;
        if (message) showStatus(globalStatus, "error", message);
        else hideStatus(globalStatus);
        tokenInput.value = "";
        tokenInput.focus();
    }

    function showEditor() {
        loginView.hidden = true;
        editorView.hidden = false;
        hideStatus(globalStatus);
    }

    // ISO time -> "09.11.2026. u 08:15" in Belgrade time.
    function formatDate(iso) {
        const date = iso ? new Date(iso) : new Date();
        if (Number.isNaN(date.getTime())) return "—";
        const p = Object.fromEntries(
            new Intl.DateTimeFormat("en-GB", {
                timeZone: "Europe/Belgrade", day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", hourCycle: "h23"
            }).formatToParts(date).map(x => [x.type, x.value])
        );
        return `${p.day}.${p.month}.${p.year}. u ${p.hour}:${p.minute}`;
    }

    /* ---------- base64 <-> UTF-8 (keeps č, ć, š, ž, đ intact) ---------- */
    function decodeBase64Utf8(b64) {
        const bin = atob(b64.replace(/\s/g, ""));
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder("utf-8").decode(bytes);
    }

    function encodeUtf8Base64(text) {
        const bytes = new TextEncoder().encode(text);
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(bin);
    }

    /* ---------- GitHub API ---------- */
    function api(method, body) {
        const url = method === "GET" ? `${API_URL}?ref=${BRANCH}` : API_URL;
        return fetch(url, {
            method,
            cache: "no-store",
            headers: {
                "Accept": "application/vnd.github+json",
                "Authorization": `Bearer ${token}`,
                "X-GitHub-Api-Version": "2022-11-28",
                ...(body ? { "Content-Type": "application/json" } : {})
            },
            body: body ? JSON.stringify(body) : undefined
        });
    }

    const isAuthError = status => status === 401 || status === 403 || status === 404;
    const AUTH_MESSAGE = "Pristupni ključ nije ispravan ili je istekao. Unesite važeći ključ.";

    /* ---------- rows ---------- */
    function addRow(rate) {
        const row = rowTemplate.content.firstElementChild.cloneNode(true);
        const set = (field, value) => { row.querySelector(`[data-field="${field}"]`).value = value; };
        if (rate) {
            set("naziv", rate.naziv);
            set("oznaka", rate.oznaka);
            set("kupovni", String(rate.kupovni));
            set("prodajni", String(rate.prodajni));
        }
        updateRemoveLabel(row);
        rowsBox.appendChild(row);
        return row;
    }

    function updateRemoveLabel(row) {
        const code = row.querySelector('[data-field="oznaka"]').value.trim();
        row.querySelector('[data-action="remove"]').setAttribute("aria-label", code ? `Ukloni ${code}` : "Ukloni valutu");
    }

    function renderRows(rates) {
        rowsBox.replaceChildren();
        rates.forEach(addRow);
    }

    /* ---------- validation ---------- */
    // "116,5" / " 116.50 " -> 116.5 ; returns NaN when not a positive number
    function parseRate(raw) {
        const v = raw.replace(/\s/g, "").replace(",", ".");
        if (!/^\d+(\.\d+)?$/.test(v)) return NaN;
        const n = Number(v);
        return n > 0 ? n : NaN;
    }

    function markInvalid(input, invalid) {
        input.classList.toggle("is-invalid", invalid);
        if (invalid) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
    }

    function collectRates() {
        const rows = [...rowsBox.querySelectorAll(".admin-row")];
        const errors = [];
        const seen = new Set();
        const rates = rows.map((row, i) => {
            const get = f => row.querySelector(`[data-field="${f}"]`);
            const nazivEl = get("naziv"), oznakaEl = get("oznaka"), kupEl = get("kupovni"), prodEl = get("prodajni");
            const naziv = nazivEl.value.trim();
            const oznaka = oznakaEl.value.trim().toUpperCase();
            const kupovni = parseRate(kupEl.value);
            const prodajni = parseRate(prodEl.value);
            const label = oznaka || naziv || `red ${i + 1}`;

            markInvalid(nazivEl, !naziv);
            markInvalid(oznakaEl, !oznaka || seen.has(oznaka));
            markInvalid(kupEl, Number.isNaN(kupovni));
            markInvalid(prodEl, Number.isNaN(prodajni));

            if (!naziv) errors.push(`${label}: upišite naziv valute.`);
            if (!oznaka) errors.push(`${label}: upišite oznaku valute.`);
            else if (seen.has(oznaka)) errors.push(`${oznaka}: oznaka se ponavlja.`);
            if (Number.isNaN(kupovni)) errors.push(`${label}: kupovni kurs mora biti broj veći od nule.`);
            if (Number.isNaN(prodajni)) errors.push(`${label}: prodajni kurs mora biti broj veći od nule.`);
            if (!Number.isNaN(kupovni) && !Number.isNaN(prodajni) && kupovni > prodajni) {
                markInvalid(kupEl, true);
                markInvalid(prodEl, true);
                errors.push(`${label}: kupovni kurs ne može biti veći od prodajnog.`);
            }
            if (oznaka) seen.add(oznaka);
            return { naziv, oznaka, kupovni, prodajni };
        });
        if (rates.length === 0) errors.push("Lista mora imati bar jednu valutu.");
        return { rates, errors };
    }

    // Same layout as the hand-written file: one currency per line.
    function buildJson(rates, updatedIso) {
        const lines = rates.map(r =>
            `    { "naziv": ${JSON.stringify(r.naziv)}, "oznaka": ${JSON.stringify(r.oznaka)}, ` +
            `"kupovni": ${r.kupovni}, "prodajni": ${r.prodajni} }`
        );
        return `{\n  "azurirano": ${JSON.stringify(updatedIso)},\n  "kursevi": [\n${lines.join(",\n")}\n  ]\n}\n`;
    }

    /* ---------- load & save ---------- */
    async function loadFile(note) {
        showStatus(globalStatus, "info", "Učitavam kursnu listu…");
        let res;
        try {
            res = await api("GET");
        } catch (e) {
            showStatus(globalStatus, "error", "Nema veze sa internetom ili GitHub nije dostupan. Pokušajte ponovo.");
            return false;
        }
        if (isAuthError(res.status)) {
            clearToken();
            showLogin(AUTH_MESSAGE);
            return false;
        }
        if (!res.ok) {
            showStatus(globalStatus, "error", `Kursna lista nije učitana (greška ${res.status}). Pokušajte ponovo.`);
            return false;
        }
        const meta = await res.json();
        let data;
        try {
            data = JSON.parse(decodeBase64Utf8(meta.content));
        } catch (e) {
            showStatus(globalStatus, "error", "Fajl sa kursnom listom je oštećen. Javite se developeru.");
            return false;
        }
        fileSha = meta.sha;
        renderRows(Array.isArray(data.kursevi) ? data.kursevi : []);
        adminUpdated.textContent = data.azurirano ? formatDate(data.azurirano) : "—";
        dirty = false;
        showEditor();
        if (note) showStatus(adminStatus, "error", note);
        else hideStatus(adminStatus);
        return true;
    }

    async function save(event) {
        event.preventDefault();
        const { rates, errors } = collectRates();
        if (errors.length) {
            showStatus(adminStatus, "error", "Proverite označena polja: " + errors.join(" "));
            const firstInvalid = rowsBox.querySelector(".is-invalid");
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        const nowIso = new Date().toISOString();
        const body = {
            message: `Kursna lista: ${formatDate(nowIso).replace(" u ", " ")}`,
            content: encodeUtf8Base64(buildJson(rates, nowIso)),
            sha: fileSha,
            branch: BRANCH
        };

        saveBtn.disabled = true;
        saveBtn.textContent = "Čuvam…";
        showStatus(adminStatus, "info", "Čuvam kursnu listu…");
        try {
            const res = await api("PUT", body);
            if (res.ok) {
                const result = await res.json();
                fileSha = result.content.sha;
                dirty = false;
                adminUpdated.textContent = formatDate(nowIso);
                rates.forEach((r, i) => {
                    const row = rowsBox.children[i];
                    row.querySelector('[data-field="oznaka"]').value = r.oznaka;
                    row.querySelector('[data-field="kupovni"]').value = String(r.kupovni);
                    row.querySelector('[data-field="prodajni"]').value = String(r.prodajni);
                });
                showStatus(adminStatus, "success",
                    `Sačuvano ${formatDate(nowIso)}. Nova kursna lista biće na sajtu za oko 1 minut.`,
                    { href: "/#kursna-lista", text: "Otvori sajt" });
            } else if (res.status === 409) {
                await loadFile("Kursna lista je u međuvremenu promenjena (npr. sa drugog uređaja). Učitana je " +
                    "najnovija verzija – proverite kurseve i sačuvajte ponovo.");
            } else if (isAuthError(res.status)) {
                clearToken();
                showLogin(AUTH_MESSAGE + " Vaše izmene nisu sačuvane.");
            } else {
                showStatus(adminStatus, "error", `Čuvanje nije uspelo (greška ${res.status}). Pokušajte ponovo.`);
            }
        } catch (e) {
            showStatus(adminStatus, "error",
                "Nema veze sa internetom. Izmene nisu sačuvane, ali su i dalje u poljima – pokušajte ponovo.");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Sačuvaj kursnu listu";
        }
    }

    /* ---------- events ---------- */
    loginForm.addEventListener("submit", async e => {
        e.preventDefault();
        const value = tokenInput.value.trim();
        if (!value) {
            showStatus(globalStatus, "error", "Unesite pristupni ključ.");
            return;
        }
        token = value;
        const ok = await loadFile();
        if (ok) storeToken(value, rememberInput.checked);
    });

    ratesForm.addEventListener("submit", save);

    rowsBox.addEventListener("input", e => {
        dirty = true;
        if (e.target.matches('[data-field="oznaka"]')) updateRemoveLabel(e.target.closest(".admin-row"));
        if (e.target.classList.contains("is-invalid")) markInvalid(e.target, false);
    });

    rowsBox.addEventListener("click", e => {
        const btn = e.target.closest('[data-action="remove"]');
        if (!btn) return;
        const row = btn.closest(".admin-row");
        const code = row.querySelector('[data-field="oznaka"]').value.trim() || "ovu valutu";
        if (window.confirm(`Ukloniti ${code} iz kursne liste?`)) {
            row.remove();
            dirty = true;
            addRowBtn.focus();
        }
    });

    addRowBtn.addEventListener("click", () => {
        const row = addRow();
        dirty = true;
        row.querySelector('[data-field="naziv"]').focus();
    });

    logoutBtn.addEventListener("click", () => {
        if (dirty && !window.confirm("Imate nesačuvane izmene. Ipak se odjaviti?")) return;
        clearToken();
        showLogin();
    });

    window.addEventListener("beforeunload", e => {
        if (dirty) {
            e.preventDefault();
            e.returnValue = "";
        }
    });

    /* ---------- start ---------- */
    token = readToken();
    if (token) loadFile();
    else showLogin();
})();
