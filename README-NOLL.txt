# Ny funktion: spara 0 frakturer som registrerad dag

En registrering med antal 0 sparas nu på samma sätt som 1, 2, 3 ... i Firestore.
Den ger en grön datumruta med 0 st och användarnamnet. Dagen räknas med
bland registrerade datum (även i årsprocent och Excel) utan att öka totalsumman
för frakturer. Om andra användare registrerat samma dag summeras deras antal.

För att ta bort en felaktig registrering ska man använda den särskilda
"Ta bort"-knappen vid posten och bekräfta borttagningen. Vanliga godkända
användare kan bara ta bort sin egen registrering. Administratören kan ta
bort och ändra allas registreringar.

## Installera
1. Ladda upp den nya `app.js` och `index.html` till GitHub-projektets rot
   (ersätt de tidigare). `style.css` och `firebase-config.js` ändras inte.
2. I Firebase Console: Firestore Database > Rules. Ersätt texten med hela
   innehållet i den nya `firestore.rules` och klicka på Publish. Utan
   nya regler nekas skrivningar där count=0.
3. Ladda om hemsidan med Ctrl+F5. Logga in som godkänd användare och
   spara 0 på ett tidigare tomt datum. Datumet ska bli grönt med "0 st".
4. Ta bort den provregistreringen via Ta bort-knappen om den inte är riktig.

## Importen av vikul
`importera-vikul-2026.html` och `avlasning-vikul-2026.csv` från den
föregående importversionen finns kvar. Nollorna från papperskalendern
hanteras som registrerade dagar och förvalda importposter. Importera inte
samma period flera gånger: importsidan hoppar över redan sparade poster.

Viktigt: Användare och befintliga registreringar i Firestore ändras inte
när webbplatsfilerna och reglerna uppdateras. Gör en export/back-up av data
innan större ändringar i verksamhetsbruk.
