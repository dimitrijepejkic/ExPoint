# ExPoint Menjačnica — sajt

Statički sajt menjačnice ExPoint (JNA 9, Negotin), objavljen preko GitHub Pages na **https://expointng.com**.

## Struktura

| Fajl | Namena |
|---|---|
| `index.html` | Cela stranica: meni, kursna lista, o nama, partneri, usluge, lokacija, kontakt forma |
| `css/style.css` | Svi stilovi (boje i zaobljenja su na vrhu fajla, u `:root`) |
| `js/main.js` | Učitavanje kursne liste, mobilni meni, prozor za usluge, odbrojavanje, godina u futeru |
| `data/kursna-lista.json` | **Kursevi**: ovde se menjaju |
| `privatnost.html` | Politika privatnosti |
| `404.html` | Stranica „nije pronađeno" |
| `images/` | Ikonice sajta, slika za deljenje (`og-image.jpg`), logotipi partnera (`images/partners/`), pozadinska slika (`images/hero/`) |
| `CNAME` | Domen `expointng.com` za GitHub Pages |
| `sitemap.xml`, `robots.txt` | Za pretraživače |

Bootstrap 5.3.3 CSS je lokalno u `css/vendor/bootstrap.min.css` (koristi se samo za raspored kolona). Sajt ne učitava ništa sa spoljnih servera osim Google mape i kontakt forme (Formspree). Nema build koraka ni npm-a.

## Česte izmene

### Promena kursne liste
Kursevi su u fajlu **`data/kursna-lista.json`**. HTML ne treba dirati. Svaki red izgleda ovako:

```json
{ "naziv": "Evro", "oznaka": "EUR", "kupovni": 116.5, "prodajni": 118 },
```

**Najlakše preko GitHub-a, i sa telefona:** otvorite repozitorijum → `data` → `kursna-lista.json` → ikonica olovke → promenite brojeve → **Commit changes**. Sajt se osveži za par minuta. Posetioci koji su već na stranici vide novi kurs pri sledećem osvežavanju (svakih 60 s).

Pravila, da fajl ostane ispravan:
- Decimalni brojevi pišu se sa **tačkom**: `116.5`, a ne `116,5`. Brojevi idu bez navodnika.
- Tekst (`naziv`, `oznaka`) ide **pod navodnicima**.
- Svaki red osim poslednjeg završava se **zarezom**.
- Za novu valutu kopirajte ceo red `{ ... },`. Redosled u fajlu je redosled u tabeli.

Ako fajl ima grešku, sajt prikazuje rezervnu tabelu iz `index.html` (sekcija `<!-- KURSNA LISTA -->`), a ne praznu listu. Zato je dobro da se i ta rezervna tabela s vremena na vreme uskladi sa JSON-om. Ispravnost fajla možete proveriti na https://jsonlint.com.

Ako se broj valuta promeni, ažurirajte i polje „valuta u ponudi" u sekciji `<!-- O NAMA -->` u `index.html`.

### Promena radnog vremena
Radno vreme se nalazi na **tri mesta**. Promenite sva tri:
1. `index.html`, kartica „Brze informacije" (sekcija `<!-- HERO -->`)
2. `index.html`, sekcija `<!-- LOKACIJA -->`, red „Radno vreme"
3. `index.html`, u `<head>`, blok `application/ld+json` → `openingHoursSpecification` (ovo čita Google)

### Promena partnera
Logo stavite u `images/partners/`, pa u sekciji `<!-- PARTNERI -->` promenite `href` (link), `src` (logo) i `alt` (naziv). Odgovarajuću karticu ažurirajte i u sekciji `<!-- USLUGE -->`.

Posle izmene sadržaja promenite datum `<lastmod>` u `sitemap.xml`.

## Lokalni pregled
Ako `index.html` otvorite direktno iz foldera, kursna lista se ne čita iz JSON-a (pregledači to ne dozvoljavaju za lokalne fajlove), pa vidite rezervnu tabelu. Za tačan prikaz pokrenite lokalni server iz foldera projekta:

```
python -m http.server 8000
```

pa otvorite http://localhost:8000.

## Objavljivanje
Svaki `git push` na granu `main` se automatski objavljuje na GitHub Pages. Izmene su vidljive za ~1–10 minuta, jer GitHub kešira fajlove do 10 minuta.

Kontakt forma šalje poruke preko Formspree (`formspree.io`) na `expointoffice@gmail.com`.
