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
