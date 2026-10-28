# Frakturkalendern – användarnamn och godkännande

1. I Firebase Authentication → Sign-in method: aktivera **Email/Password**.
2. Skapa administratör genom att på hemsidan välja "Skapa konto" och ange `erik94pr@hotmail.com` som användarnamn. Verifiera mejlet från Firebase. Logga sedan in på hemsidan med administratörsadressen och lösenordet. Endast den verifierade adressen får adminbehörighet.
3. Kopiera innehållet från `firestore.rules` till Firebase → Firestore → Rules och välj Publish.
4. Ladda upp `index.html`, `app.js`, `style.css`, `firebase-config.js` till GitHub Pages. `firestore.rules` ska inte läggas som körbar webbfil.

**Användare:** Skapar användarnamn (a-z 0-9 punkt understreck bindestreck), namn och lösenord. Återställningsmejl är frivilligt och sparas i Firestore men används inte automatiskt av Firebase Authentication. Admin kan godkänna/spärra i hemsidan efter att administratörskontot satts upp och verifierats.

**Viktig begränsning:** Firebase Email/Password använder en intern syntetisk e-postadress för vanliga användare. Automatisk lösenordsåterställning till alternativ mejl stöds INTE utan en betrodd backend. I denna prototyp måste bortglömt lösenord hanteras manuellt med separat säkert administrativt förfarande. Inbyggd Firebase-konsol ger inte enkel klientbaserad reset till en sekundär adress. För driftsättning med fungerande lösenordsåterställning rekommenderas i stället e-post som kontots primära Firebase-identitet, eller en backendfunktion med Firebase Admin SDK.

**Säkerhet:** Publicerade kalenderdata med namn är personuppgifter. Inga patientdata får registreras. Administratörsbehörighet är kontrollerad i Firestore-reglerna och inte bara i gränssnittet.
