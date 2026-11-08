# ExPoint Menjačnica — sajt

Statički sajt menjačnice ExPoint (JNA 9, Negotin), objavljen preko GitHub Pages na **https://expointng.com**.

## Struktura

| Fajl | Namena |
|---|---|
| `index.html` | Cela stranica: meni, kursna lista, o nama, partneri, usluge, lokacija, kontakt forma |
| `css/style.css` | Svi stilovi (boje i zaobljenja su na vrhu fajla, u `:root`) |
| `js/main.js` | Mobilni meni, prozor za usluge, odbrojavanje iznad kursne liste, godina u futeru |
| `404.html` | Stranica „nije pronađeno" |
| `images/` | Ikonice sajta, slika za deljenje (`og-image.jpg`), logotipi partnera (`images/partners/`) |
| `CNAME` | Domen `expointng.com` za GitHub Pages |
| `sitemap.xml`, `robots.txt` | Za pretraživače |

Bootstrap 5.3.3 CSS se učitava sa CDN-a (samo za raspored kolona). Nema build koraka ni npm-a.

## Česte izmene

### Promena kursne liste
U `index.html` pronađite sekciju `<!-- KURSNA LISTA -->`. Svaki red tabele izgleda ovako:

```html
<tr>
  <td data-label="Valuta">Evro</td>
  <td data-label="Oznaka">EUR</td>
  <td data-label="Kupovni kurs">116.5</td>
  <td data-label="Prodajni kurs">118</td>
</tr>
```

Promenite samo brojeve. Kod nove valute kopirajte ceo `<tr>…</tr>` red. Ako se broj valuta promeni, ažurirajte i polje „valuta u ponudi" u sekciji `<!-- O NAMA -->`.

### Promena radnog vremena
Radno vreme se nalazi na **tri mesta**. Promenite sva tri:
1. `index.html`, kartica „Brze informacije" (sekcija `<!-- HERO -->`)
2. `index.html`, sekcija `<!-- LOKACIJA -->`, red „Radno vreme"
3. `index.html`, u `<head>`, blok `application/ld+json` → `openingHoursSpecification` (ovo čita Google)

### Promena partnera
Logo stavite u `images/partners/`, pa u sekciji `<!-- PARTNERI -->` promenite `href` (link), `src` (logo) i `alt` (naziv). Odgovarajuću karticu ažurirajte i u sekciji `<!-- USLUGE -->`.

Posle izmene sadržaja promenite datum `<lastmod>` u `sitemap.xml`.

## Lokalni pregled
Dovoljno je otvoriti `index.html` u pregledaču. Za tačan prikaz (manifest, 404 stranica) pokrenite lokalni server iz foldera projekta:

```
python -m http.server 8000
```

pa otvorite http://localhost:8000.

## Objavljivanje
Svaki `git push` na granu `main` se automatski objavljuje na GitHub Pages. Izmene su vidljive za ~1–10 minuta, jer GitHub kešira fajlove do 10 minuta.

Kontakt forma šalje poruke preko Formspree (`formspree.io`) na `expointoffice@gmail.com`.
