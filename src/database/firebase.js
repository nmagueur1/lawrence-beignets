'use strict';

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');

function buildCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[Firebase] Variables manquantes : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY sont requises.'
    );
  }

  // Les clés stockées en .env contiennent des "\n" littéraux : on les convertit en vrais retours ligne.
  privateKey = privateKey.replace(/\\n/g, '\n');

  return { projectId, clientEmail, privateKey };
}

let app;
if (!getApps().length) {
  const { projectId, clientEmail, privateKey } = buildCredential();
  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

module.exports = { db, FieldValue, Timestamp, app };
