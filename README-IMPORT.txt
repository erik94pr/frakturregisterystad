# Import av pappersregistreringar för vikul (2026)

Denna version är förberedd för att låta administratören föra in historiska registreringar från fotografierna för januari–juni 2026 på kontot `vikul`. **Det har inte skrivits något till den aktiva databasen.**

## Så gör du

1. Packa upp ZIP-filen.
2. Ersätt `app.js` i GitHub med den medföljande versionen. Ladda även upp `importera-vikul-2026.html` till repositoryts rot. Behåll övriga fungerande webbplatsfiler som de är. `firebase-config.js` behöver inte ändras.
3. Öppna Firebase Console → Firestore → Rules. Ersätt den publicerade regeltexten med innehållet i `firestore.rules` från ZIP-filen. Klicka **Publish**. Koden ger bara projektets administratör möjlighet att skapa historiska poster i en befintlig användares namn; ingen vanlig användare kan göra det.
4. Logga in som administratör på https://erik94pr.github.io/frakturregisterystad/ och öppna sedan https://erik94pr.github.io/frakturregisterystad/importera-vikul-2026.html i samma webbläsare.
5. Bekräfta att sidan hittar kontot `vikul`. Alla datum med uppgift är förvalda, inklusive de åtta gulmarkerade osäkra datumen. Du kan ändra antal men behöver inte göra det. Tryck på **Importera markerade till vikul** och bekräfta. Varje datum som redan är registrerat på vikul hoppas över och skrivs inte över.
6. Gå tillbaka till kalendern och granska januari–juni 2026. Nollor som uttryckligen skrivits på papperet lagras som 0 registrerade frakturer och räknas som registrerade dagar. Även manuella 0-registreringar sparas nu. Borttagning sker med en separat Ta bort-knapp.

## Sammanställning

- 136 avlästa datum är förvalda (128 tydliga och 8 osäkra uppskattningar).
- Totalt 364 frakturer inklusive uppskattningarna, enligt pappersavläsningen.
- 45 blankrutor importeras inte.
- Osäkerhet: 9 februari (3), 25 februari (2), 21 mars (2), 25 mars (7), 11 april (3), 19 april (2), 13 maj (4), 3 juni (4).
- Befintliga registreringar på vikul för samma datum hoppas över, inte skrivs över.

## Tolkning och begränsningar

- Varje papperstally representerar antal frakturer och periodens årtal antas vara 2026 (första sidan säger 2026).
- Blanka datum har **inte** tolkats som noll. Till exempel är 7 februari och 6 maj blanka. De importeras inte.
- Uttryckligt skrivna nollor 8 och 24 januari, 12, 14, 21, 23 och 28 februari, samt 3, 11, 18 och 20 mars sparas som en registrering med 0.
- `avlasning-vikul-2026.csv` innehåller alla 181 datum januari–juni, även blanka, och noteringar om osäkra avläsningar. `importera-vikul-2026.html` visar alla markerade datum och kan hantera korrigeringar före import.
- Fotona har marginalanteckningar med andra namn. Samtliga avlästa datum tillskrivs `vikul` enligt instruktion, utan antaganden om vem som faktiskt skrev varje streck.
- Importen kan inte göras från ChatGPT utan autentiserad åtkomst till Firebase. Den sker först när administratören genomför den via webbplatsen.
