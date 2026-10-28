# Frakturkalendern – administratör genom Firebase UID

## Installera

1. Firebase Console → Authentication → Sign-in method: aktivera **Email/Password**. Ingen e-postverifiering krävs.
2. Firebase Console → Firestore Database → Rules: klistra in `firestore.rules` och tryck **Publish**.
3. Under Firebase Authentication → Users: hitta ditt BEFINTLIGA användarkonto (`erik@users.frakturkalender.invalid` om du registrerat användarnamnet erik). Kopiera hela **User UID** med kopieringsikonen. Använd INTE e-postadress eller en avkortad UID från skärmbilden.
4. Firestore Database → Data → **Start collection**. Collection ID: `administrators`. Välj **Document ID** = hela användarens UID. Lägg till fältet `active`, typ **boolean**, värde `true`. Spara. Detta är den ENDA manuella bootstrap-åtgärden och måste utföras av projektägaren i Firebase Console. Ingen klient kan skapa eller ändra adminroller.
5. Öppna `index.html` via GitHub Pages efter att de fyra webbplatsfilerna (`index.html`, `style.css`, `app.js`, `firebase-config.js`) laddats upp på nytt. Logga in med samma användarnamn/lösenord som tidigare. Du ska se **Administrera användare**.
6. Provregistrera ett nytt konto med ett annat användarnamn, logga in som admin och välj **Godkänn**. Testa i två olika webbläsare.

## Särskilt om redan skapade konton

Befintliga konton behålls, inklusive det interna syntetiska e-postformatet `anvandarnamn@users.frakturkalender.invalid`. Det befintliga kontot kan alltså göras till administratör via UID utan mejlverifiering. Om admin-kontot skapades med en annan inloggningsadress än det användarnamn du väljer, logga in med det befintliga kontots ursprungliga inloggningsuppgift.

## Säkerhet

Administratörer identifieras av UID via säkerhetsreglerna, inte genom e-poststräng. **Administrators-dokumenten får bara skapas via Firebase Console av projektägaren** (serveradministratör). Varken en användare eller någon i webbläsaren kan ge sig själv åtkomst. Godkända konton får registrera och ändra sina egna poster. Alla kan läsa kalendern. Användarnamn och namn kan vara personuppgifter; använd inte patientuppgifter.

Återställningsmejl är bara en kontaktuppgift i nuläget, INTE automatisk lösenordsåterställning. Att bygga korrekt återställning för syntetiska e-postkonton kräver en betrodd backend med Firebase Admin SDK.

Inga externa mail skickas automatiskt.


## Korrigering av sparning (2026-10-28)
Den tidigare säkerhetsregeln använde `x.date.substring(0,7)`, en metod som inte stöds i Firestore Security Rules. Detta orsakade nekade skrivningar. Den är ersatt med en kontroll via `split('-')`.

**Viktigt:** Öppna Firebase Console → Firestore → Rules och publicera innehållet i denna ZIP-fils `firestore.rules`. Att bara ladda upp GitHub-filer ändrar inte säkerhetsreglerna. Ladda också upp `app.js` för bättre felmeddelanden. Se till att administratörens användarprofil finns under `users/<UID>`; på äldre konton skapas den av appen när du loggar in.

## Namn direkt i kalendern
Varje grön datumruta visar nu antalet registrerade frakturer och namnet på alla som har registrerat frakturer denna dag. Namnen läses från befintliga registreringar, så inga ändringar i Firestore-regler eller databas krävs. Uppdatera bara `app.js` och `style.css` på GitHub.

## Offentlig kalender utan inloggning
Alla kan öppna kalendern och se datum, namn, antal, årsstatistik och exportera Excel utan inloggning. Använd knappen **Logga in / Skapa konto** först när registrering önskas. Endast godkända användare och administratörer kan skriva till Firestore. Firestore-reglerna tillåter offentlig läsning av `registrations` men kräver godkänt konto för skrivningar. Befintliga regler behöver inte ändras för denna uppdatering.

## Administratör: redigera och radera andras registreringar

När du har loggat in med ditt administratörskonto: öppna en grön dag i kalendern. I listan **Registrerat denna dag** finns knapparna **Ändra** och **Ta bort** bredvid **andra användares** poster. Ändra anger ett nytt antal (1–9999), Ta bort kräver bekräftelse. Dina egna poster uppdateras fortfarande genom fältet **Mitt antal registrerade frakturer** (0 raderar posten). Totalsummor och Excel-export uppdateras via Firestores realtidssynkronisering.

**Installation:** Ersätt `app.js` och `style.css` på GitHub och publicera den nya `firestore.rules` under Firebase Console → Firestore → Rules → Publish. **Behåll övriga filer**. Adminrollen kontrolleras via `administrators/<UID>.active == true` i Firestore. Andra godkända användare får fortfarande bara ändra egna poster.

Redigering och borttagning av andra användares registreringar ger för närvarande ingen separat revisionslogg. För spårbarhet i klinisk användning bör en sådan införas innan skarp drift.

## Korrigering: admin-knappar saknas
Tidigare visades **Ändra** och **Ta bort** bara för poster där registrerarens UID skilde sig från administratörens. Nu visas de för ALLA poster om `administrators/<inloggat UID>.active` är `true`. Detta omfattar även administratörens egna poster.

**Uppdatera bara `app.js` på GitHub.** Kontrollera att rätt konto är inloggat och att administratörspanelen syns. Öppna sedan ett datum med registreringar. Hård-uppdatera webbläsaren med Ctrl+F5, eller testa privat fönster om gammal JavaScript-fil ligger i cache.

Inga nya Firestore-regler krävs om du redan publicerat reglerna från `frakturkalender-admin-redigera-registreringar.zip`. Om administratörspanelen inte visas måste `administrators/<UID>/active` kontrolleras i Firebase.
