# Frakturkalendern

En enkel svensk, mobilanpassad månadskalender för att ange antal registrerade frakturer per dag. Grönmarkerade dagar har minst en registrering. Alla ser månadens totalsumma, antal aktiva dagar och varje registrerares namn/antal per dag. En användare kan ändra eller ta bort sin **egen** registrering för varje dag.

## Årsstatistik och Excel-export

När du väljer år visas täckningsgraden: **antal kalenderdatum med minst en registrering / årets samtliga 365 eller 366 datum × 100**. Det är inte andelen frakturer registrerade i Svenska Frakturregistret och är inte ett kvalitetsmått för faktisk registertäckning. Framtida datum ingår i nämnaren, även om året ännu inte är slut. För vardagar/arbetsdagar skulle en annan nämnare behövas.

Knappen **Exportera hela året till Excel** skapar `Frakturkalender_ÅÅÅÅ.xlsx` med tre flikar: Alla datum (inklusive noll-dagar), Årsöversikt med täckningsgrad per månad och för hela året, och Per registrerare med namn/antal. Biblioteket SheetJS laddas från jsDelivr och kräver internetanslutning även i demoläge. Vid Firebase-anslutning används samma realtidsdata som kalendern.

## Prova designen

Filerna fungerar i demoläge innan Firebase är anslutet. Demoläget sparar **bara i den egna webbläsaren** och delas inte mellan användare. Kör gärna en lokal server (`python3 -m http.server 8000`) och öppna `http://localhost:8000`.

## Aktivera gemensamma registreringar (Firebase)

1. Skapa ett projekt på https://console.firebase.google.com/ .
2. Lägg till en **webbapp** i projektinställningarna och kopiera dess `firebaseConfig`-värden till `firebase-config.js`.
3. Under **Authentication → Sign-in method**, slå på **Anonymous**.
4. Skapa databasen **Cloud Firestore** (produktionsläge, välj lämplig EU-region).
5. Öppna **Firestore Database → Rules**. Ersätt reglerna med texten i `firestore.rules` och välj **Publish**.
6. Publicera alla filer utom README om du vill på GitHub Pages. `firestore.rules` är för Firebase-konsolen, inte för GitHub Pages.
7. Testa att två olika webbläsare kan se samma uppgifter.

## Publicera via GitHub Pages

1. Skapa ett nytt publikt repository på GitHub, exempelvis `frakturkalender`.
2. Lägg `index.html`, `style.css`, `app.js` och `firebase-config.js` i repositoryts rot.
3. Gå till **Settings → Pages → Build and deployment**, välj **Deploy from a branch**, `main`, `/ (root)` och **Save**.
4. Webbplatsen publiceras normalt på `https://DITT-ANVÄNDARNAMN.github.io/frakturkalender/`.

## Behörighet och integritet

- Besökare kan läsa namnen och antalen utan konto. Endast en anonymt inloggad användare kan skriva och redigera sina egna poster enligt reglerna.
- Anonyma Firebase-identiteter är **bundna till webbläsarens lokala inloggning**. Om användaren byter telefon/rensar webbdata kan hen inte längre redigera gamla poster. Namn är inte en verifierad identitet.
- Ingen patientinformation ska läggas in. Detta är ett fristående verktyg och överför inte data till Svenska Frakturregistret.
- Öppen anonym registrering innebär risk för felaktiga/spamregistreringar. För klinisk drift rekommenderas riktig inloggning (t.ex. arbetskonton), administratörsbehörighet och fastställda rutiner för personuppgifter.
- Verifiera Firebase-kostnader och eventuell personuppgiftsbehandling enligt arbetsgivarens riktlinjer innan verklig användning.
