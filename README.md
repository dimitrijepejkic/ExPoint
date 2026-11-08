# ExPoint Menjačnica — sajt

Statički sajt menjačnice ExPoint (JNA 9, Negotin), objavljen preko GitHub Pages na **https://expointng.com**.

## Struktura

| Fajl | Namena |
|---|---|
| `index.html` | Cela stranica: meni, kursna lista, o nama, partneri, usluge, lokacija, kontakt forma |
| `css/style.css` | Svi stilovi (boje i zaobljenja su na vrhu fajla, u `:root`) |
| `js/main.js` | Učitavanje kursne liste, mobilni meni, prozor za usluge, odbrojavanje, godina u futeru |
| `data/kursna-lista.json` | **Kursevi** (menjaju se preko admin stranice) |
| `admin.html`, `js/editor.js` | Admin stranica za izmenu kursne liste (vidi ispod) |
| `_config.yml` | Isključuje README i izveštaj iz objave na sajtu |
| `privatnost.html` | Politika privatnosti |
| `kontakt.html`, `kontakt.vcf` | Stranica koju otvara QR kod (pozovi, Viber, WhatsApp, email, sajt, mapa, sačuvaj kontakt) |
| `qr/` | QR kod za štampu i digitalno (nije objavljen na sajtu) |
| `tools/update-versions.py` | Osvežava `?v=` oznake verzije CSS/JS fajlova (nije objavljen na sajtu) |
| `404.html` | Stranica „nije pronađeno" |
| `images/` | Ikonice sajta, slika za deljenje (`og-image.jpg`), logotipi partnera (`images/partners/`), pozadinska slika (`images/hero/`) |
| `CNAME` | Domen `expointng.com` za GitHub Pages |
| `sitemap.xml`, `robots.txt` | Za pretraživače |

Bootstrap 5.3.3 CSS je lokalno u `css/vendor/bootstrap.min.css` (koristi se samo za raspored kolona). Sajt ne učitava ništa sa spoljnih servera osim Google mape i kontakt forme (Formspree). Nema build koraka ni npm-a.

## Česte izmene

### Promena kursne liste – admin stranica (svakodnevno)
Kurs se menja na **https://expointng.com/admin.html**, i sa telefona:

1. Otvorite `expointng.com/admin.html`. Na novom uređaju unesite pristupni ključ (samo prvi put).
2. Promenite kupovni i prodajni kurs. Decimale mogu sa zarezom ili tačkom (`116,5` ili `116.5`).
3. Kliknite **„Sačuvaj kursnu listu"**. Nova lista je na sajtu za ~1 minut, sa datumom „Kursna lista ažurirana: …".

Stranica sama proverava unos (prazna polja, slova umesto brojeva, kupovni veći od prodajnog, oznaka koja se ponavlja), pa neispravna lista ne može da se sačuva. Valute se dodaju dugmetom „+ Dodaj valutu" i uklanjaju dugmetom ✕. Redosled na admin stranici je redosled na sajtu.

Savet: na telefonu dodajte admin stranicu na početni ekran (Chrome: meni ⋮ → „Dodaj na početni ekran"; Safari: Deli → „Dodaj na početni ekran").

#### Adresa i indeksiranje
- Admin stranica je na `expointng.com/admin.html`. Nema linka ka njoj sa sajta i nije u `sitemap.xml` ni u `robots.txt` (koji je javan). `noindex` meta oznake zabranjuju pretraživačima da je indeksiraju.
- Botovi često nasumično isprobavaju adrese tipa `admin.html`, pa je mogu otvoriti, ali bez pristupnog ključa ne mogu ništa da pročitaju ni promene. Prava zaštita je ključ.
- Ako želite manje očiglednu adresu, preimenujte fajl (npr. `urednik-$(openssl rand -hex 6).html`) i pošaljite klijentu novu adresu.

#### Pristupni ključ (za developera)
Admin stranica čuva izmene direktno u ovaj repozitorijum preko GitHub API-ja. Za to joj treba **fine-grained token**:

1. GitHub → avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. *Token name*: npr. `ExPoint kursna lista`. *Expiration*: npr. 1 godina (upišite podsetnik u kalendar).
3. *Repository access*: **Only select repositories** → `dimitrijepejkic/ExPoint`.
4. *Permissions* → *Repository permissions* → **Contents: Read and write**. Ostalo ostaviti kako jeste.
5. **Generate token**, kopirajte ga (prikazuje se samo jednom) i pošaljite klijentu privatno, npr. porukom koju posle obriše.

Bezbednost:
- Token radi samo za ovaj repozitorijum, ali u njemu može da menja bilo koji fajl, dakle ceo sajt. Čuvajte ga kao lozinku.
- Čuva se samo u pregledaču uređaja na kom je unet. Na deljenom računaru isključite „Zapamti na ovom uređaju" ili kliknite „Odjavi se sa ovog uređaja".
- **Izgubljen telefon / sumnja na zloupotrebu:** GitHub → Settings → Developer settings → Fine-grained tokens → token → **Revoke**. Odmah prestaje da radi. Zatim napravite novi.
- Kad token istekne, admin stranica javlja „Pristupni ključ nije ispravan ili je istekao". Napravite novi i klijent ga ponovo unese.

Svako čuvanje je commit „Kursna lista: DD.MM.GGGG. HH:MM" u istoriji repozitorijuma, pa se svaka izmena vidi i može da se vrati (GitHub → `data/kursna-lista.json` → **History**).

#### Ručna izmena (rezervna opcija)
Kursevi su u fajlu `data/kursna-lista.json` i mogu se menjati i direktno na GitHub-u (olovka → **Commit changes**). Pravila: decimalni brojevi sa **tačkom**, tekst pod navodnicima, zarez posle svakog reda osim poslednjeg. Polje `"azurirano"` je datum koji se prikazuje na sajtu; admin stranica ga upisuje sama.

Ako fajl ima grešku, sajt prikazuje rezervnu tabelu iz `index.html` (sekcija `<!-- KURSNA LISTA -->`). Ta tabela se ne menja automatski, pa je dobro povremeno je uskladiti sa aktuelnim kursom.

Ako se broj valuta promeni, ažurirajte i polje „valuta u ponudi" u sekciji `<!-- O NAMA -->` u `index.html`.

### Promena radnog vremena
Radno vreme se nalazi na **tri mesta**. Promenite sva tri:
1. `index.html`, kartica „Brze informacije" (sekcija `<!-- HERO -->`)
2. `index.html`, sekcija `<!-- LOKACIJA -->`, red „Radno vreme"
3. `index.html`, u `<head>`, blok `application/ld+json` → `openingHoursSpecification` (ovo čita Google)

### Promena partnera
Logo stavite u `images/partners/`, pa u sekciji `<!-- PARTNERI -->` promenite `href` (link), `src` (logo) i `alt` (naziv). Odgovarajuću karticu ažurirajte i u sekciji `<!-- USLUGE -->`.

Posle izmene sadržaja promenite datum `<lastmod>` u `sitemap.xml`.

### QR kod
QR kod vodi na **https://expointng.com/kontakt**, stranicu sa dugmićima: Pozovite, Viber, WhatsApp, Email, Posetite sajt, Lokacija na mapi, Sačuvaj kontakt.

- `qr/expoint-kontakt-qr.svg`: samo QR kod, vektorski (štampa u bilo kojoj veličini).
- `qr/expoint-kontakt-qr.png`: samo QR kod, 2000×2000 px.
- `qr/expoint-kontakt-kartica.svg` / `.png`: brendirana kartica 10×14 cm za izlog, pult ili letak.

Saveti za štampu: QR kod ne manji od **2,5 cm**, beli okvir oko koda se ne seče, tamni kod na svetloj podlozi (ne obrnuto). Pre štampe celog tiraža skenirajte probni otisak.

Telefon, email i ostalo menjaju se u `kontakt.html` i `kontakt.vcf`. **QR kod ostaje isti** dok se ne promeni adresa `/kontakt`.

## Lokalni pregled
Ako `index.html` otvorite direktno iz foldera, kursna lista se ne čita iz JSON-a (pregledači to ne dozvoljavaju za lokalne fajlove), pa vidite rezervnu tabelu. Za tačan prikaz pokrenite lokalni server iz foldera projekta:

```
python -m http.server 8000
```

pa otvorite http://localhost:8000.

## Izmena CSS-a ili JavaScript-a
Stranice učitavaju `css/style.css`, `js/main.js` i `js/editor.js` sa oznakom verzije (npr. `style.css?v=479352d1`), da pregledači ne bi koristili staru, zapamćenu verziju. **Posle svake izmene tih fajlova** pokrenite:

```
python tools/update-versions.py
```

Skripta sama izračuna nove oznake i upiše ih u sve stranice. Stranica `kontakt.html` (QR kod) ima stilove ugrađene u sebe i ne zavisi od `style.css`.

## Objavljivanje
Svaki `git push` na granu `main` se automatski objavljuje na GitHub Pages. Izmene su vidljive za ~1–10 minuta, jer GitHub kešira fajlove do 10 minuta.

Kontakt forma šalje poruke preko Formspree (`formspree.io`) na `expointoffice@gmail.com`.
