# ExPoint Menjačnica — Website Audit Report

**Site:** https://expointng.com · **Repo:** `E:\ExPoint` (branch `main`, commit `84669f0`) · **Date:** 2026-11-08
**Scope:** Audit only. No project files were modified.

**How each finding was established**
- **[Verified]** means measured in headless Chrome (CDP), observed on the live site with `curl`, or confirmed by screenshot.
- **[Inspected]** means inferred from reading the code.
- No Lighthouse or field Core Web Vitals data was collected. Lighthouse isn't installed and the rules forbid installing tools. Performance statements are estimates unless marked [Verified].

---

## 1. Executive Summary

ExPoint is a small, single-page static site (one HTML file, one CSS file, one JS file) hosted on GitHub Pages under a custom domain. The architecture fits the job. The page is light (~4.3 KB gzipped HTML), and the custom CSS is well organized with design tokens.

Most problems are about **correctness and trust, not technology**:

1. **https://www.expointng.com shows a certificate error** [Verified]. Anyone who types `https://www.` gets a browser security warning.
2. **Developer placeholder text is live on the production page.** For example: *"Ubaci tačnu adresu, radno vreme i kasnije Google mapu ili iframe map embed."* ("Insert the exact address, working hours and later a Google map…").
3. **The page states contradictory working hours.** The hero gives seasonal hours (summer 08–13/17–20, winter 08–16). The Location section says "Pon – Sub 08:00 – 20:00".
4. **The rates table shows a fake "auto-refresh" countdown.** The table pulses and "Poslednje osvežavanje" updates every 60 s, but the rates are hard-coded in HTML and never change. For a currency exchange this suggests live data that doesn't exist.
5. **Bootstrap 5 was layered over an existing custom design, and the class names collide.** Because `.btn`, `.btn-primary`, `.btn-secondary`, `.card`, `.modal` and `.modal-content` are shared, the green primary buttons get a **blue border on hover and turn blue (#0a58ca) when pressed or keyboard-focused** [Verified]. Bootstrap's full JS bundle (~25 KB gz) is loaded but never used.
6. **Responsive defects:**
   - At 320 px the page scrolls horizontally (330 px document width) and partner logos spill outside their cards and overlap [Verified].
   - The "1000+" stat overflows its box at 320 and 375 px.
   - Between 769 and 991 px the nav links and logo wrap onto two lines [Verified].
7. **Accessibility gaps:**
   - Form fields have no labels and are not required.
   - Service cards can't be reached by keyboard.
   - The modal has no dialog semantics, no Escape handling and no focus management [Verified].
   - The map iframe has no title.
8. **SEO basics are partly broken:**
   - `og:image` returns 404 [Verified].
   - There is no LocalBusiness structured data, which is the biggest local-SEO opportunity for a single-location business.
   - The `<title>` doesn't mention the town.
   - The web manifest icon paths are broken (404) [Verified].

No secrets are exposed. The form endpoint ID is public by design. The site is HTTPS-only on the apex domain.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Markup | Hand-written HTML5, single page `index.html` | `lang="sr"`, Latin script |
| Styling | `css/style.css` (686 lines, custom properties) + **Bootstrap 5.3.3 CSS** from jsDelivr CDN | Bootstrap is used only for the grid (`container`, `row`, `col-*`, `g-*`) and a few utilities (`align-items-center`, `justify-content-center`, `mt-1`) |
| Scripts | `js/main.js` (78 lines, vanilla JS) + **Bootstrap 5.3.3 bundle JS** from CDN | Bootstrap JS is unused (no `data-bs-*` attributes, no `bootstrap.*` calls) |
| Fonts | System `Arial, Helvetica, sans-serif` | No web fonts, which is good for performance |
| Images | Local PNG/SVG partner logos and favicons; hero background hot-linked from `images.unsplash.com` | |
| Third-party services | Formspree (contact form POST), Google Maps embed iframe, jsDelivr CDN, Unsplash CDN | |
| Hosting | GitHub Pages (`Server: GitHub.com`, Fastly/Varnish), custom domain via `CNAME` = `expointng.com` | `Cache-Control: max-age=600` (GitHub default) |
| Build / tooling | **None**: no `package.json`, bundler, linter, tests, CI, `.gitignore` or README | Deploys straight from `main` |

---

## 3. Current Project Architecture

```
index.html            single page: header/nav, hero, rates, about, partners, services, location (map), contact (form), footer, modal
css/style.css         all custom styles; tokens in :root; one breakpoint (max-width: 768px)
js/main.js            mobile menu toggle, fake refresh countdown, service modal
images/               favicons + site.webmanifest; images/partners/ logos
CNAME, robots.txt, sitemap.xml
```

**How the parts interact**
- `main.js` selects elements by ID/class (`#menuToggle`, `#navLinks`, `#countdown`, `#lastRefresh`, `.rates-table`, `.service-card`, `#serviceModal`).
- Service-card content for the modal lives in `data-title` / `data-description` attributes.
- Rates are static `<td>` values in the HTML.

**Is the architecture appropriate?** Yes. A static single page on GitHub Pages is the right size for a one-location business site, and no framework is needed. There are two structural weaknesses:

1. **The Bootstrap integration was bolted on.** Commit `bd652ca` ("Bootstrap added") removed the custom `.container`/grid and added Bootstrap CSS+JS. The custom component class names were kept and now collide with Bootstrap's own components. That is the root cause of the button and modal style leakage below.
2. **Content that changes often (exchange rates, hours) is hard-coded** in markup, mixed with layout. Updating rates means editing HTML and deploying.

---

## 4. Issues & Improvements

Legend for **Visual impact**:
- **None** means no change to the rendered design.
- **Potential visual impact** means it could change appearance. Don't implement it without owner approval.
- **Restores intended design** means it changes current pixels only where today's rendering is a defect.

### 4.1 Code Quality

**CQ-1. Custom class names collide with Bootstrap components [Verified]**
- **Issue:** `.btn`, `.btn-primary`, `.btn-secondary`, `.card`, `.modal` and `.modal-content` are defined in both `style.css` and Bootstrap. Bootstrap's state rules (`.btn:hover`, `.btn:active`, `.btn:focus-visible`) have higher specificity than the custom `.btn` rule.
- **Location:** `css/style.css:95-126` (buttons), `:292` (`.card`), `:547-579` (modal). Markup at `index.html:73-74, 131, 215, 410, 426-427`.
- **Evidence:** Computed styles with transitions disabled:
  - `.btn-primary:hover` → border `rgb(10,88,202)` (Bootstrap blue).
  - `:active` → background `rgb(10,88,202)`.
  - `:focus-visible` → background `rgb(11,94,215)` with a blue ring `rgba(49,132,253,.5) 0 0 0 4px`.
  - `.btn-secondary:hover` → border `rgb(86,94,100)` (grey); `:active` → grey background.
  - `.modal-content` inherits Bootstrap's `1px solid rgba(0,0,0,.176)` border.
  - `.card` becomes `display:flex`.
- **Impact:** The green brand buttons flash blue/grey on click, hover and keyboard focus, which is off-brand. Future Bootstrap upgrades can silently change more.
- **Recommendation:** Pick one option.
  - (a) Neutralize Bootstrap's button variables inside the existing selectors, e.g. `.btn-primary{--bs-btn-hover-border-color:transparent;--bs-btn-active-bg:var(--accent-dark);--bs-btn-active-border-color:transparent;--bs-btn-focus-shadow-rgb:34,197,94}` and similar for `.btn-secondary`.
  - (b) Rename the custom classes (e.g. `.ex-btn`, `.ex-card`, `.ex-modal`) so Bootstrap component styles never apply.
- **Risk:** Medium · **Effort:** Small · **Visual impact:** Restores intended design. It changes hover/active/focus colours, so the owner should approve.

**CQ-2. Fake "refresh" logic in `main.js` [Inspected]**
- **Issue:** `updateRefreshTime()` stamps the current time and pulses the table every 60 s, but no data is fetched.
- **Location:** `js/main.js:14-46`; `index.html:124-127`.
- **Evidence:** No `fetch`/XHR anywhere. The rates are literal `<td>` values at `index.html:142-207`.
- **Impact:** It misleads users (see FN-1) and runs a 1-second timer forever, even in background tabs.
- **Recommendation:** Either remove the countdown and show a static "Kursna lista važi od: <date>" line in the same element, or make it real (see AR-2).
- **Risk:** Low · **Effort:** Small · **Visual impact:** None if the same element and classes are reused for the text.

**CQ-3. Design tokens defined but bypassed [Inspected]**
- **Issue:** `--radius: 18px` is used once, while `18px` is hard-coded 6 more times. `#f8fafc` is repeated instead of `var(--light)`. `white`/`#fff`/`#ffffff` are used instead of `var(--white)`. `--secondary` is never used.
- **Location:** `css/style.css:361, 377, 381, 383, 409, 450, 477, 504, 563, 567` and others.
- **Impact:** Maintainability only.
- **Recommendation:** Replace the literals with the existing tokens (same values) and remove `--secondary` or start using it.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**CQ-4. `transition: 0.3s ease` animates all properties [Inspected]**
- **Location:** `css/style.css:104, 192, 389, 412`.
- **Impact:** It animates unintended properties, including the Bootstrap colour changes in CQ-1, and costs a little performance.
- **Recommendation:** Name the properties, e.g. `transition: transform .3s ease, background-color .3s ease`. Durations stay identical.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (same timing on the intended properties).

**CQ-5. Leftover refactor comments and an empty element [Inspected]**
- **Issue:** The CSS has comments such as "replaces inline style=…" (`style.css:68, 82, 87`), and there is an empty `<div class="rate-note"></div>` (`index.html:210`). The empty div still renders 36 px of padding under the table.
- **Recommendation:** Remove the stale comments. Either fill `.rate-note` with the rate-validity note (pairs with CQ-2) or keep it intentionally.
- **Risk:** Low · **Effort:** Small · **Visual impact:** Potential visual impact if the empty `.rate-note` is removed (36 px of spacing). Prefer filling it.

**CQ-6. JS has no null-guards and the script tags carry redundant attributes [Inspected]**
- **Location:** `js/main.js:1-78`; `index.html:434-435`.
- **Issue:** There is no guard if an element is missing, which matters if a 404 page or second page reuses `main.js`. `defer` on a script at the end of `<body>` is redundant. The Bootstrap bundle has no `defer`.
- **Recommendation:** Wrap the code in an init function with early returns. Remove the Bootstrap JS tag (see PF-1).
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

### 4.2 Architecture

**AR-1. Bootstrap CSS is used only for the grid but ships the full framework [Inspected]**
- **Location:** `index.html:7`.
- **Evidence:** The only Bootstrap classes in the markup are `container`, `row`, `col-*`, `g-3`/`g-4`, `align-items-*`, `justify-content-center` and `mt-1`.
- **Impact:** 33,976 B gzipped of render-blocking third-party CSS [Verified transfer size]. Reboot and component styles cause the collisions in CQ-1.
- **Recommendation:** Short term, keep it, pin it with SRI (SE-2) and preconnect (PF-2). Long term (optional), replace it with `bootstrap-grid.min.css` plus the few utilities. **This is high visual risk.** Reboot currently sets heading margins and sizes, body margin, form-control and `<small>` sizing that the design silently depends on. Only attempt it with screenshot-diffing at every breakpoint.
- **Risk:** High · **Effort:** Medium · **Visual impact:** Potential visual impact.

**AR-2. Exchange rates are hard-coded in HTML [Inspected]**
- **Location:** `index.html:141-208`.
- **Impact:** Every rate update means editing markup inside the layout and deploying, which is error-prone. Nothing records when the rates were last valid.
- **Recommendation:**
  - Move the rates to `data/rates.json` (`{ "validFrom": "...", "rates": [{"code":"EUR","name":"Evro","buy":116.5,"sell":118}, ...] }`).
  - Have `main.js` render the **same `<tr>/<td data-label>` markup**.
  - Keep the current static rows as a no-JS fallback.
  - Display `validFrom` in the existing `.refresh-container`.
  - Keep it simple: no CMS or framework.
- **Risk:** Medium (empty table if the fetch fails, so keep the fallback; `fetch` doesn't work over `file://` when testing locally, so use a local server) · **Effort:** Medium · **Visual impact:** None if the markup is identical.

### 4.3 Performance

**PF-1. Unused Bootstrap JS bundle [Verified + Inspected]**
- **Location:** `index.html:434`.
- **Evidence:** 24,843 B gzipped transferred. The page has no `data-bs-*` attributes and no `bootstrap.` API usage. The modal and menu are implemented in `main.js`.
- **Impact:** Wasted download and parse, plus a third-party request that delays `DOMContentLoaded`.
- **Recommendation:** Remove the `<script>` tag.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**PF-2. Render-blocking third-party CSS with no connection hint [Inspected]**
- **Location:** `index.html:7`.
- **Impact:** First paint waits for DNS, TLS and download from `cdn.jsdelivr.net`. This is the main FCP/LCP cost (estimated, not measured).
- **Recommendation:** Add `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>`, or self-host `bootstrap.min.css` under `css/vendor/` so it shares the origin and HTTP/2 connection.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**PF-3. Hero background image is hot-linked, served at one size, and discovered late [Verified + Inspected]**
- **Location:** `css/style.css:211-213`.
- **Evidence:** It's a 1600 px-wide image for every viewport, 80,465 B transferred (AVIF via `auto=format`). The browser finds it only after parsing `style.css`.
- **Impact:** Mobile users download a desktop-size image. It depends on Unsplash keeping the URL and sends visitors' IPs to a third party. The hero is likely not the LCP element (the `<h1>` text probably is; estimated), so the impact is moderate.
- **Recommendation:**
  - Self-host the image (with attribution per the Unsplash licence) in AVIF/WebP at around 800 and 1600 widths.
  - Use `image-set()` or a `@media` override so smaller screens get the smaller file.
  - Keep `center/cover` and the gradient overlay identical.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (same image and cropping).

**PF-4. Below-the-fold partner logos aren't lazy-loaded and have no intrinsic size [Inspected]**
- **Location:** `index.html:283, 288, 293, 298`.
- **Recommendation:** Add `loading="lazy" decoding="async"` plus `width`/`height` attributes matching the intrinsic ratio. The CSS `max-width`/`max-height` still governs the displayed size.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**PF-5. Unoptimized SVG logo [Verified size]**
- **Location:** `images/partners/Logo-AMC-2024-v2a.svg` (58,047 B), displayed at most 180×80.
- **Recommendation:** Run it through SVGO, or export a ~2× PNG/WebP. Expect a large size reduction (estimated).
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (verify by eye).

**PF-6. Google Maps iframe [Inspected]**
- **Location:** `index.html:376-379`.
- **Evidence:** It already uses `loading="lazy"`, which is good. It still loads several hundred KB of Google JS once scrolled into view (estimated).
- **Recommendation:** Keep as is. A click-to-load facade would save more but changes the UI.
- **Risk:** — · **Effort:** — · **Visual impact:** A facade would be a potential visual impact, so not recommended.

**PF-7. No reduced-motion handling for smooth scroll, hover lifts or the pulse [Inspected]**
- Covered in A11Y-8. It has a negligible performance cost.

### 4.4 SEO

**SEO-1. `og:image` points to a missing file [Verified]**
- **Location:** `index.html:34`.
- **Evidence:** `https://expointng.com/images/og-image.jpg` returns **404**.
- **Impact:** Shares on Facebook, Viber, WhatsApp and LinkedIn show no preview image.
- **Recommendation:** Add a 1200×630 `images/og-image.jpg` (e.g. logo on the brand dark `#0f172a`). Also add `og:image:width`, `og:image:height`, `og:image:alt` and `og:site_name`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (meta only).

**SEO-2. No structured data (LocalBusiness) [Inspected]**
- **Location:** `<head>` of `index.html`.
- **Impact:** This is the biggest missed local-SEO signal for "menjačnica Negotin" searches. Google can't reliably read the address, hours, phone or geo.
- **Recommendation:** Add a JSON-LD `FinancialService` (a subtype of `LocalBusiness`) block with:
  - `name`, `url`, `telephone` (`+381605446081`), `email`
  - `address` (`JNA 9`, `19300 Negotin`, `RS`)
  - `geo` (≈44.2293, 22.5323, taken from the existing map embed)
  - `openingHoursSpecification` (after the hours are corrected, FN-2)
  - `image`, `priceRange`
  - Validate with Google's Rich Results Test.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**SEO-3. Weak `<title>` and inconsistent diacritics [Inspected]**
- **Location:** `index.html:13, 16, 30`.
- **Issue:** The title is "ExPoint Menjacnica", with no location or service. Head metadata and the logo use "Menjacnica" while body copy uses "Menjačnica".
- **Recommendation:** Use a title like `ExPoint Menjačnica Negotin – Kursna lista, Ria, MoneyGram` (≤60 characters). Use diacritics consistently in metadata.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None. The title only shows in the browser tab, and visible logo text isn't part of this change.

**SEO-4. Heading hierarchy skips levels [Verified]**
- **Evidence:** Order is H1, then **H3 "Brze informacije"** before any H2, then H2 "Kursna lista" and H3 "Zasto bas mi?". The modal also has an **empty `<h3 id="modalTitle">`** in the static DOM.
- **Location:** `index.html:92, 216, 429`.
- **Recommendation:** Change `Brze informacije` to an `<h2>` and extend the selector `.hero-card h3` to `.hero-card h2` with the same `font-size: 1.35rem`. Also pin `font-weight`/`line-height` so Bootstrap's reboot H2 sizing doesn't apply. The partners section has no `id`, so it can't be linked; add `id="partneri"`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None if the selector is updated. Verify with a screenshot.

**SEO-5. Missing Twitter/X card metadata [Inspected]**
- **Recommendation:** Add `twitter:card=summary_large_image`. The other X tags fall back to OG.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**SEO-6. Name/address consistency (NAP) [Inspected]**
- **Issue:** The address is written "Jna 9, Negotin" in visible text (`index.html:367, 397`) and "JNA 9" in the meta description. There is no `<address>` element.
- **Recommendation:** Use the same spelling as the Google Business Profile everywhere (likely "JNA 9, 19300 Negotin"). Wrap the contact details in `<address>` and reset its default italic style so it looks the same.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None if the italic reset is included.

**SEO-7. Sitemap metadata is stale or inaccurate [Inspected]**
- **Location:** `sitemap.xml`.
- **Evidence:** `lastmod 2026-08-07`, but the page last changed on 2026-08-29. `changefreq daily` doesn't match reality.
- **Recommendation:** Update `lastmod` whenever content changes (or drop it). Remove `changefreq` and `priority`, which Google ignores.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**SEO-8. Minor metadata issues [Inspected]**
- `<meta name="keywords">` is ignored by Google. It's harmless, so optional to remove.
- `lang="sr"` could be `sr-Latn`, since the content is Latin script.
- `og:url` and `canonical` are correct.
- `robots.txt` is fine.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

### 4.5 Accessibility

**A11Y-1. Form fields have no labels and no required validation [Verified]**
- **Location:** `index.html:405-411`.
- **Evidence:** 0 `<label>` elements. `required=false` on all four fields. Placeholder-only fields have no accessible name once the user starts typing.
- **Recommendation:**
  - Add a `<label for>` to each field, visually hidden with a standard `.visually-hidden` class (Bootstrap already provides it).
  - Add `required`, `autocomplete="name"` / `"email"`, and `id`s.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (labels are visually hidden).

**A11Y-2. Service cards are mouse-only [Verified]**
- **Location:** `index.html:313-350`; `js/main.js:53-66`.
- **Evidence:** `<article>` elements have `tabIndex = -1` and no role. Keyboard and switch users can't open them.
- **Recommendation:** Put a `<button type="button">` reset to look identical inside each card, or add `role="button" tabindex="0"` with an Enter/Space handler. The button-inside-card approach is preferable.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None. A focus outline appears on keyboard focus only.

**A11Y-3. The modal is not an accessible dialog [Verified]**
- **Location:** `index.html:426-432`; `js/main.js:48-78`.
- **Evidence:**
  - There's no `role="dialog"`, `aria-modal` or `aria-labelledby`.
  - Escape doesn't close it (`stillOpenAfterEscape: true`).
  - Focus isn't moved into the modal (`focusInsideModal: false`) or returned afterwards.
  - The close button reads "x" with no `aria-label`.
- **Recommendation:** Pick one option.
  - (a) Switch to the native `<dialog>` element. It's well supported and handles Escape and focus. Keep the same classes and override the `dialog` UA styles.
  - (b) Add the ARIA attributes, an Escape keydown handler, focus moving to the close button, and focus restored to the trigger.
  - Either way, add `aria-label="Zatvori"` to the close button.
- **Risk:** Low–Medium (`<dialog>` UA styles must be reset carefully) · **Effort:** Small · **Visual impact:** None if UA styles are reset.

**A11Y-4. Mobile menu toggle has no state [Verified]**
- **Location:** `index.html:53-55`; `js/main.js:4-12`.
- **Evidence:** `aria-expanded` is null and there's no `aria-controls`. Escape and clicking outside don't close the menu.
- **Recommendation:** Toggle `aria-expanded`, add `aria-controls="navLinks"`, and close the menu on Escape.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**A11Y-5. Primary button text contrast fails WCAG AA [Inspected + calculated]**
- **Location:** `css/style.css:108-111`.
- **Evidence:** White on `#22c55e` is **≈2.3:1**. Normal text needs 4.5:1, and even large text needs 3:1. Hover `#16a34a` is ≈3.3:1.
- **Recommendation:** This needs a colour change, so it's flagged only and **not to be implemented without owner approval**. Options are dark text on green, or darkening the green.
- **Risk:** Low · **Effort:** Small · **Visual impact:** **Potential visual impact.**

**A11Y-6. Map iframe has no title [Verified]**
- **Location:** `index.html:376`.
- **Recommendation:** Add `title="Mapa – ExPoint menjačnica, JNA 9, Negotin"`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**A11Y-7. Emoji icons are read aloud [Inspected]**
- **Location:** `index.html:315, 323, 331, 339, 347`.
- **Evidence:** Screen readers announce "game die", "money with wings" and so on.
- **Recommendation:** Add `aria-hidden="true"` to `.service-icon`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**A11Y-8. No `prefers-reduced-motion` support [Inspected]**
- **Location:** `css/style.css:25-27` (smooth scroll), `:113-116, 393-395, 417-419` (hover lifts), `:593-601` (pulse).
- **Recommendation:** Add `@media (prefers-reduced-motion: reduce){ html{scroll-behavior:auto} *{transition:none!important; animation:none!important} }`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None for default users. Only users with reduced motion enabled see the difference.

**A11Y-9. Weak input focus indicator [Verified]**
- **Location:** `css/style.css:502, 507-510`.
- **Evidence:** `outline:none`. On focus only the border turns `#22c55e`, which is ≈2.3:1 against white. WCAG 1.4.11 asks for 3:1.
- **Recommendation:** Flag only. Strengthening it changes how the focus state looks.
- **Risk:** Low · **Effort:** Small · **Visual impact:** Potential visual impact (focus state only).

**A11Y-10. No skip link, and the table lacks a caption and scope [Inspected]**
- **Issue:** There's no skip link to `<main>`. `rates-table` has no `<caption>` or `scope="col"`. The mobile `display:block` table loses table semantics in some screen readers.
- **Recommendation:**
  - Add a visually-hidden caption and `scope` attributes.
  - Add a skip link that is visible only on focus.
  - Optionally add `role="table"`/`row`/`cell` for the mobile layout.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None. The skip link shows only on keyboard focus.

### 4.6 Responsive Design (tested at 320, 375, 430, 768, 769, 900, 1024, 1440, 1920)

| Width | Horizontal overflow | Defects found |
|---|---|---|
| 320 | **Yes** (document 330 px) | Partner logos overflow cards; stat text overflows |
| 375 | No | "1000+" overflows its stat box; partner logos slightly overflow |
| 430 | No | none |
| 768 | No | Partner logos overflow card padding (167 > 154) |
| 769–991 | No | Nav links and logo wrap to two lines; partner logos overflow |
| 1024 / 1440 / 1920 | No | none |

**RD-1. Partner logos escape their cards on small and tablet screens [Verified, screenshot]**
- **Location:** `css/style.css:397-401`.
- **Evidence:** `.partner-card img{max-width:180px}` overrides the global `img{max-width:100%}`. At 320 px the images span `-10…170` and `150…330`, overlapping neighbouring cards and causing horizontal scroll. They also overflow at 375 and 768–991.
- **Recommendation:** Use `.partner-card img{max-width:min(180px,100%)}`. This gives identical rendering wherever the logo already fits.
- **Risk:** Low · **Effort:** Small · **Visual impact:** Restores intended design (changes only the broken widths).

**RD-2. Stat boxes overflow at ≤375 px [Verified, screenshot]**
- **Location:** `index.html:247-266`; `css/style.css:358-371`.
- **Evidence:** At 320, "1000+" needs 81 px in a 46 px content box and "najtraženije valute" overflows the viewport (right edge 323). At 375, "1000+" needs 81 px in a 64 px box.
- **Recommendation:** Inside a `@media (max-width:400px)` block only, reduce `.stat-box` padding (e.g. to 12px) and use `font-size:clamp(1.3rem,6vw,1.8rem)` for `.stat-box strong`. Add `overflow-wrap:anywhere` on the span.
- **Risk:** Low · **Effort:** Small · **Visual impact:** Potential visual impact, limited to ≤400 px where the layout is currently broken. Get owner sign-off.

**RD-3. Nav wraps between 769 and 991 px [Verified, screenshot]**
- **Location:** `css/style.css:140-171, 606`.
- **Evidence:** At 900 px, "Kursna lista" and "O nama" wrap to two lines (li height 51 vs 26) and the logo breaks onto two lines. The custom breakpoint (768) doesn't match the space the six links need.
- **Recommendation:** Pick one option.
  - (a) Add `white-space:nowrap` to `.nav-links a` and `.logo`, and reduce the gap at 769–991 (e.g. `gap:16px`).
  - (b) Move the hamburger breakpoint to `max-width: 991.98px`, which matches Bootstrap `lg`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** Potential visual impact. Tablet users would see a different nav arrangement, so get owner approval.

**RD-4. Anchor jumps hide section headings under the sticky header on mobile [Verified]**
- **Location:** `css/style.css:25-27, 131-138`.
- **Evidence:** At 320 and 375, after jumping to `#kursna-lista`, `#o-nama` or `#usluge`, the heading top sits at 70 px while the header bottom is at 81 px, so the heading is partly covered. On desktop there's only a 9 px margin.
- **Recommendation:** Add `html{scroll-padding-top:80px}`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None. Only the scroll landing position changes.

### 4.7 Security

**SE-1. https://www.expointng.com has an invalid certificate [Verified]**
- **Location:** DNS / GitHub Pages settings, not the repo.
- **Evidence:**
  - `curl https://www.expointng.com/` fails with `SEC_E_WRONG_PRINCIPAL`: the certificate doesn't cover `www`.
  - `http://www.` correctly 301s to `https://expointng.com/`.
  - `www` resolves via A records to the GitHub Pages IPs.
- **Impact:** Users and links using `https://www.` get a full-page browser security warning, which hurts trust and SEO.
- **Recommendation:**
  - Change the `www` DNS record to a **CNAME → `dimitrijepejkic.github.io`**, as GitHub recommends.
  - In repo Settings → Pages, re-save the custom domain so GitHub provisions a certificate covering both apex and `www`.
  - Keep "Enforce HTTPS" on.
- **Risk:** Low (DNS propagation) · **Effort:** Small · **Visual impact:** None.

**SE-2. CDN assets have no Subresource Integrity [Inspected]**
- **Location:** `index.html:7, 434`.
- **Recommendation:** Add `integrity="sha384-…"` and `crossorigin="anonymous"` using the official hashes from getbootstrap.com for 5.3.3, or self-host (PF-2).
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**SE-3. No spam protection on the contact form [Inspected]**
- **Location:** `index.html:405-411`.
- **Recommendation:**
  - Add Formspree's honeypot `<input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">`.
  - Add `required` (A11Y-1).
  - Optionally add a `_subject` hidden field.
  - The Formspree ID in the HTML is public by design, so it is not a secret.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**SE-4. `target="_blank"` without `rel` [Inspected]**
- **Location:** `index.html:282, 287, 292, 297`.
- **Evidence:** Modern browsers imply `noopener`, but older ones don't.
- **Recommendation:** Add `rel="noopener noreferrer"`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**SE-5. Security headers aren't configurable on GitHub Pages [Verified headers]**
- **Evidence:** The response has no CSP, `X-Frame-Options`, `Referrer-Policy` or `Permissions-Policy`.
- **Recommendation:** Optionally add `<meta http-equiv="Content-Security-Policy">` allowing `self`, `cdn.jsdelivr.net`, `images.unsplash.com`, `www.google.com` (frame) and `formspree.io` (form-action). Clickjacking protection (`frame-ancestors`) can't be set via meta. If headers become important, front the site with Cloudflare.
- **Risk:** Medium (an overly strict CSP breaks the map or form) · **Effort:** Small · **Visual impact:** None if correct.

**SE-6. Privacy note (informational) [Inspected]**
- **Evidence:** Google Maps, jsDelivr and Unsplash receive visitor IPs on page load.
- **Recommendation:** Self-hosting the hero and Bootstrap reduces this. Consider whether a short privacy notice is needed under Serbian data-protection law (ZZPL). That's a business/legal decision.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**No exposed secrets** were found in the repo or its git history (there are only 17 files). Author emails appear in commit metadata, which is normal for git.

### 4.8 Dependencies

**DEP-1. Bootstrap 5.3.3 loaded from CDN; the JS isn't needed [Inspected]**
- **Evidence:** The CSS and JS are pinned to an exact version, which is good. Newer 5.3.x patch releases exist (check the current version on getbootstrap.com). Patch updates within 5.3 are non-breaking in principle but can shift reboot or component styles.
- **Recommendation:** Remove the JS (PF-1). Keep the CSS on 5.3.3 until CQ-1 is fixed, then optionally bump with screenshot comparison. **Don't upgrade automatically.**
- **Risk:** Low · **Effort:** Small · **Visual impact:** None for removing the JS. Potential visual impact for a CSS bump.

**DEP-2. No package manager or tooling [Inspected]**
- **Evidence:** There's no `package.json`, so `npm audit`, lint, tests and a build don't apply. **Nothing was run.**
- **Recommendation:** Don't add a build step for this site. Optionally add an HTML validator and link checker in CI later (see DP-5).
- **Risk:** — · **Effort:** — · **Visual impact:** None.

### 4.9 Functionality & Content

**FN-1. Misleading "live refresh" on static rates [Inspected]** (P0 for trust)
- **Location:** `index.html:124-127`; `js/main.js:14-46`.
- **Evidence:** "Poslednje osvežavanje" always shows the visitor's current time, and the table pulses every 60 s with unchanged data.
- **Impact:** It implies real-time rates that may be outdated. That's a trust and possible consumer-protection concern for a currency exchange.
- **Recommendation:** Replace it with an honest "Kursna lista važi od: dd.mm.yyyy." in the same container, or implement AR-2.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (text only, same element).

**FN-2. Contradictory working hours [Inspected]**
- **Location:** `index.html:95-101` (seasonal hours) vs `index.html:368` ("Pon - Sub 08:00 - 20:00").
- **Impact:** Customers may arrive while the office is closed. Structured data (SEO-2) can't be correct until this is fixed.
- **Recommendation:** The owner should confirm the real schedule, then make all occurrences match.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (text only).

**FN-3. Developer and template copy is live in production [Inspected]**
- **Location:**
  - `index.html:364` "Ubaci tačnu adresu, radno vreme i kasnije Google mapu ili iframe map embed." (a development instruction)
  - `:241-242` "Sajt je osmišljen tako da korisnik…" (describes the website, not the business)
  - `:309` "Jednostavna prezentacija usluga."
  - `:422` "Dizajn i razvoj naslovne strane za menjacnicu." (reads like a template credit)
  - `:222` "Moderan i pregledan korisnički doživljaj" (listed as a reason to choose the business)
- **Recommendation:** Replace these with real business copy of similar length.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None if the text length is similar.

**FN-4. Rates table "Valuta" and "Oznaka" columns are identical [Inspected]**
- **Location:** `index.html:143-206`.
- **Issue:** Both columns show the code (e.g. EUR / EUR). "CHF-8" is unexplained.
- **Recommendation:** Put the full currency names in "Valuta" (Evro, Američki dolar, …). Explain CHF-8 (presumably old-series notes) in `.rate-note`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None (text only).

**FN-5. Contact form UX [Inspected; submission not tested]**
- **Location:** `index.html:405`.
- **Issue:** Submitting navigates away to Formspree's default page, and there's no validation (A11Y-1). The 2026-08-29 fix (`84669f0`) added the missing `name` attributes. Before it, submissions arrived empty. **The live endpoint wasn't tested** to avoid sending a real message.
- **Recommendation:** Add `required`, then send one controlled test submission and confirm it arrives in `expointoffice@gmail.com`. A custom redirect or AJAX success message is optional. AJAX adds a new UI state, so it's a potential visual impact.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None for the basic changes.

**FN-6. Partner links point to US-locale pages [Inspected]**
- **Location:** `index.html:282, 287` (`/en-us/`, `/us/en`).
- **Recommendation:** Link to the Serbian or regional pages.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**FN-7. Minor content issues [Inspected]**
- "4 najtraženije valute" doesn't match the 11 currencies listed (`index.html:262`).
- The `© 2026` year is hard-coded (`:422`), so it will be stale on 2027-01-01.
- The modal body scroll isn't locked.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

### 4.10 Deployment & Production Readiness

**DP-1. Web manifest is broken [Verified]**
- **Location:** `images/site.webmanifest`.
- **Evidence:**
  - Icon `src` is `/android-chrome-192x192.png`, which returns **404**. The real file is at `/images/android-chrome-192x192.png` (200).
  - `name` and `short_name` are empty.
  - `theme_color` is `#ffffff`, while the page `theme-color` is `#0b6efd` (Bootstrap blue) and the brand is `#0f172a`.
- **Recommendation:**
  - Fix the icon paths (`/images/...` or relative `android-chrome-192x192.png`).
  - Set `name: "ExPoint Menjačnica"` and `short_name: "ExPoint"`.
  - Align `theme_color`.
- **Risk:** Low · **Effort:** Small · **Visual impact:** `theme-color` tints the mobile browser address bar, so pick the value deliberately. The page itself is unaffected.

**DP-2. Invalid favicon MIME type and no root `favicon.ico` [Verified]**
- **Location:** `index.html:9-10`.
- **Evidence:** `type="images/png"` is invalid; it should be `image/png`. Chrome tolerated it, but other browsers may skip the icon. `https://expointng.com/favicon.ico` returns **404**, because the file is only in `/images/`.
- **Recommendation:** Fix the type and copy `favicon.ico` to the repo root.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**DP-3. No custom 404 page [Verified]**
- **Evidence:** Unknown paths return GitHub's generic 404 page.
- **Recommendation:** Add a `404.html` that reuses `css/style.css`, the header and the footer, with a link home.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None on existing pages.

**DP-4. Cache behaviour [Verified]**
- **Evidence:** GitHub Pages serves `Cache-Control: max-age=600`, which can't be changed. CSS and JS updates show up within about 10 minutes.
- **Recommendation:** Optionally version asset URLs (`style.css?v=2025…`) on releases.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**DP-5. No CI, `.gitignore` or README [Inspected]**
- **Recommendation:** Optionally add a small README (how to update rates and hours, how to deploy). Optionally add a GitHub Action that runs an HTML validator and link checker on push.
- **Risk:** Low · **Effort:** Small · **Visual impact:** None.

**DP-6. Live site matches the repo [Verified]**
- **Evidence:** Live `index.html` is identical to the local file, ignoring CRLF. HTTP→HTTPS redirect on the apex works (301). `sitemap.xml` and `robots.txt` are served (200).

---

## 5. Prioritized Improvement Roadmap

**P0 — Critical**
1. SE-1: Fix the `www` HTTPS certificate (DNS CNAME plus re-save in Pages settings).
2. FN-3: Remove the developer placeholder text and template copy.
3. FN-2: Reconcile the working hours.
4. FN-1 / CQ-2: Remove the fake live-refresh indicator and show the real validity date.

**P1 — High**
5. CQ-1: Neutralize the Bootstrap button and modal collisions (owner approves the restored button states).
6. RD-1, RD-4: Fix partner logo overflow and anchor offset. RD-2 and RD-3 need owner approval.
7. A11Y-1, A11Y-2, A11Y-3, A11Y-4, SE-3: Form labels, required fields and honeypot; keyboard-accessible cards; accessible modal; menu ARIA.
8. SEO-1, SEO-2, SEO-3: Add the OG image, LocalBusiness JSON-LD and a better title.
9. PF-1: Remove the unused Bootstrap JS.
10. DP-1: Fix the manifest.

**P2 — Medium**
11. SE-2 / PF-2: Add SRI or self-host Bootstrap CSS, plus preconnect.
12. AR-2: Move rates to `data/rates.json`.
13. PF-3, PF-4, PF-5: Self-host a responsive hero image, lazy-load logos, optimize the AMC SVG.
14. A11Y-6, A11Y-7, A11Y-8, A11Y-10; SEO-4, SEO-6: Iframe title, aria-hidden emojis, reduced motion, table semantics, heading levels, `<address>`.
15. CQ-3, CQ-4, CQ-6: Token cleanup, specific transitions, JS init guard.

**P3 — Low**
16. DP-2, DP-3, SEO-5, SEO-7, SEO-8, SE-4, FN-4, FN-6, FN-7, DP-4, DP-5, CQ-5.
17. Owner design decisions: A11Y-5 (button contrast), A11Y-9 (input focus), AR-1 (replace full Bootstrap CSS).

---

## 6. Quick Wins (minimal effort, no visual change)

- Remove the Bootstrap JS `<script>` tag (−24.8 KB gz, one fewer third-party request).
- Add `html{scroll-padding-top:80px}` so mobile anchors stop hiding headings.
- `.partner-card img{max-width:min(180px,100%)}` fixes the 320 px horizontal scroll and logo overlap (only changes broken widths).
- Fix the manifest icon paths and names, `type="image/png"`, and copy `favicon.ico` to root.
- Add `og:image` (create the file), `og:site_name`, `twitter:card`.
- Add the LocalBusiness JSON-LD (after the hours are confirmed).
- Add visually-hidden labels, `required`, `autocomplete` and the `_gotcha` honeypot to the form.
- Add the iframe `title`, `aria-hidden` on emoji icons, `aria-label` on the modal close button, and `aria-expanded` on the menu toggle.
- Add an Escape key handler for the modal and menu.
- Add `rel="noopener noreferrer"` on external links.
- Add `prefers-reduced-motion` CSS.
- Add `loading="lazy"` on partner logos.
- Add preconnect to jsDelivr.

---

## 7. Potential Risks

| Change | Risk |
|---|---|
| Removing or replacing Bootstrap CSS (AR-1) | **High.** Reboot and heading styles silently shape the current look (heading sizes and margins, body margin, `<small>`, form defaults). Requires screenshot diffs at every breakpoint. |
| Overriding Bootstrap button variables or renaming classes (CQ-1) | Changes hover/active/focus colours (intended, but visible). Renaming classes risks missing a selector. |
| Moving the nav breakpoint (RD-3) or resizing stat boxes (RD-2) | Visible layout change for tablet or small phones. Needs owner approval. |
| Changing `<h3>` to `<h2>` (SEO-4) | Bootstrap reboot gives H2 a different size. The selector must be updated in the same change. |
| `<dialog>` migration (A11Y-3) | UA dialog styles (border, padding, backdrop) must be reset or the modal will look different. |
| CSP meta tag (SE-5) | Can block Google Maps, Formspree or the hero image if a source is missing. |
| Rates moved to JSON (AR-2) | A fetch failure leaves the table empty unless a static fallback is kept. `fetch` fails under `file://`, so test with a local HTTP server. |
| DNS change for `www` (SE-1) | Brief propagation window. Don't touch the apex A records. |
| SRI hashes (SE-2) | A wrong hash blocks the stylesheet entirely, so the page renders unstyled. Copy the official hashes. |
| Removing the empty `.rate-note` (CQ-5) | Removes 36 px of spacing under the table. |

---

## 8. Recommended Implementation Order

1. **Owner confirmations (blocking):** the real working hours, the replacement copy for the placeholder text, the rate-validity wording, and whether to approve the visual-impact items (CQ-1, RD-2, RD-3, A11Y-5, A11Y-9).
2. **SE-1** DNS/Pages fix. Independent of code; do it first.
3. **Content fixes:** FN-3, FN-2, FN-1/CQ-2, FN-4. Text only, one commit.
4. **Head/meta:** SEO-1 (create `og-image.jpg`), SEO-3, SEO-5, SEO-8, DP-1, DP-2, then SEO-2 JSON-LD. JSON-LD depends on step 3 for the hours.
5. **Zero-visual CSS/HTML fixes:** RD-4, RD-1, PF-4, A11Y-6/7/8/10, SE-4, PF-1 (remove Bootstrap JS), PF-2 (preconnect), SE-2 (SRI).
6. **JS accessibility:** A11Y-1 (labels and required), SE-3 honeypot, A11Y-2 (card buttons), A11Y-3 (modal), A11Y-4 (menu). Then send one real test submission (FN-5).
7. **Approved visual fixes:** CQ-1, RD-2, RD-3. Take before/after screenshots at all 7 widths.
8. **Refactors:** CQ-3, CQ-4, CQ-6, SEO-4, SEO-6. Screenshot-diff after each.
9. **Optional:** AR-2 (rates JSON), PF-3 (self-hosted responsive hero), PF-5, DP-3 (404 page), DP-5 (README/CI), DEP-1 (Bootstrap patch bump).

After each step, re-run the responsive check at 320/375/430/768/1024/1440/1920. Also check the live site with `curl` for the 404s fixed in SEO-1, DP-1 and DP-2.

---

## 9. Overall Assessment (estimated scores; no Lighthouse run)

| Area | Score | Rationale |
|---|---|---|
| Code quality | **6/10** | Clean, readable vanilla JS and well-sectioned CSS with tokens. Points lost for the Bootstrap class collisions, fake refresh logic, bypassed tokens and leftover artifacts. |
| Architecture | **7/10** | Static single page on GitHub Pages fits the job well. Points lost for bolting on Bootstrap and hard-coding volatile data (rates and hours) in markup. |
| Performance | **7/10** (estimated) | Small page (4.3 KB gz HTML), system fonts, lazy map. Points lost for 34 KB render-blocking third-party CSS, 25 KB unused JS, a 1600 px hero for all devices and a 58 KB SVG. Transfer sizes are measured; Core Web Vitals weren't. |
| SEO | **5/10** | Canonical, meta description, OG basics, sitemap and robots are present. Points lost for the 404 OG image, no LocalBusiness schema, a weak title, heading skips and NAP inconsistency. |
| Accessibility | **4/10** | Points lost for unlabeled form, mouse-only cards, inaccessible modal, missing iframe title, failing button contrast and no reduced-motion support. |
| Security | **7/10** | No secrets, HTTPS on apex, minimal attack surface. Points lost for the invalid `www` certificate, no SRI and no form spam protection. |
| Responsive implementation | **6/10** | Good at 430 px and ≥1024 px. Points lost for horizontal overflow at 320 px, logo overlap at ≤991 px, stat overflow at ≤375 px, nav wrapping at 769–991 px and hidden headings after anchor jumps on mobile. All verified. |
| Production readiness | **5/10** | It deploys and works. Points lost for the `www` certificate error, placeholder copy, contradictory hours, misleading refresh indicator and broken manifest/OG assets. |

---

### Top 10 findings
1. `https://www.` certificate error (SE-1) [Verified].
2. Developer placeholder copy live (FN-3).
3. Contradictory working hours (FN-2).
4. Fake live-refresh on static rates (FN-1).
5. Bootstrap collisions turn the green buttons blue on hover, press and focus (CQ-1) [Verified].
6. 320 px horizontal overflow and partner logo overlap (RD-1) [Verified].
7. Inaccessible form, cards and modal (A11Y-1/2/3) [Verified].
8. Missing OG image and broken manifest icons (SEO-1, DP-1) [Verified].
9. No LocalBusiness structured data and a weak title (SEO-2/3).
10. Unused 25 KB Bootstrap JS plus render-blocking CDN CSS without SRI or preconnect (PF-1/2, SE-2).

### First five improvements to implement
1. Fix the `www` DNS/certificate (SE-1).
2. Content pass: placeholder copy, hours, honest rate date (FN-1/2/3).
3. Meta pass: OG image, manifest, favicon type, title, JSON-LD (SEO-1/2/3, DP-1/2).
4. Zero-visual CSS fixes: `scroll-padding-top`, partner `max-width:min()`, reduced motion, and removing Bootstrap JS (RD-4, RD-1, A11Y-8, PF-1).
5. Form and interaction accessibility: labels, required, honeypot, keyboard cards, accessible modal, menu ARIA (A11Y-1–4, SE-3).

### Confirmation
No project files were modified during the audit. `git status` was clean before and after. All diagnostics (headless Chrome scripts, screenshots, browser profiles) were written only to the session scratchpad outside the repo. Live-site checks were read-only HTTP GET requests. No packages were installed, no configuration was changed, and nothing was committed or pushed.
