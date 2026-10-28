"use strict";
// Körs på Firebase-servern, ALDRIG i webbläsaren eller som statisk GitHub Pages-kod.
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

initializeApp();
const db = getFirestore();

exports.deleteCalendarUser = onCall(
  { region: "europe-west3", memory: "256MiB", maxInstances: 2, timeoutSeconds: 30 },
  async (request) => {
    // Lita aldrig på ett användarnamn, en e-postadress eller flagga från webbläsaren.
    const callerUid = request.auth?.uid;
    if (!callerUid) throw new HttpsError("unauthenticated", "Logga in som administratör.");
    const targetUid = request.data?.uid;
    if (typeof targetUid !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(targetUid)) {
      throw new HttpsError("invalid-argument", "Ogiltigt användar-ID.");
    }
    if (targetUid === callerUid) {
      throw new HttpsError("failed-precondition", "Du kan inte ta bort ditt eget konto.");
    }

    const callerRole = await db.doc(`administrators/${callerUid}`).get();
    if (!callerRole.exists || callerRole.get("active") !== true) {
      throw new HttpsError("permission-denied", "Endast administratören får radera konton.");
    }
    // Skydda ALLA konton som någon gång lagts till som administratörer.
    const targetRole = await db.doc(`administrators/${targetUid}`).get();
    if (targetRole.exists) {
      throw new HttpsError("failed-precondition", "Ett administratörskonto kan inte raderas här.");
    }
    const profileRef = db.doc(`users/${targetUid}`);
    const profile = await profileRef.get();
    if (!profile.exists) {
      throw new HttpsError("not-found", "Användaren finns inte i kalendern.");
    }

    // Stoppa skrivåtkomst omedelbart. Skulle något senare steg misslyckas
    // kan administratören försöka igen utan att användaren får tillbaka åtkomst.
    await profileRef.update({ approved: false });
    try {
      await getAuth().deleteUser(targetUid);
    } catch (error) {
      // Möjlig partiell föregående körning: Auth-kontot kan redan vara borta.
      if (error.code !== "auth/user-not-found") {
        console.error("Auth-delete failed", {callerUid,targetUid,code:error.code});
        throw new HttpsError("internal", "Firebase kunde inte radera inloggningskontot. Kontot är spärrat.");
      }
    }
    await profileRef.delete();
    console.info("Calendar user deleted", {callerUid,targetUid});
    // Medvetet behålls samtliga registreringar (som historisk data).
    return { ok: true };
  }
);
