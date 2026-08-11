'use strict';

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

/**
 * Connexion au MÊME projet Firestore que le bot Discord (mêmes credentials,
 * à configurer séparément dans les variables d'environnement Vercel). Aucun
 * fichier du bot n'est importé : ce dossier est un déploiement autonome.
 */
function buildCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[Firebase] Variables manquantes : FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY sont requises (à définir dans les Environment Variables du projet Vercel).'
    );
  }

  privateKey = privateKey.replace(/\\n/g, '\n');
  return { projectId, clientEmail, privateKey };
}

let app;
if (!getApps().length) {
  const { projectId, clientEmail, privateKey } = buildCredential();
  app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

module.exports = { db, FieldValue };
