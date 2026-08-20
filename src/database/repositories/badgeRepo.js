'use strict';

const { db } = require('../firebase');

const COLLECTION = 'badges';

async function listCatalog() {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => d.data());
}

async function ensureCatalog(defaults) {
  const snap = await db.collection(COLLECTION).limit(1).get();
  if (!snap.empty) return false;
  const batch = db.batch();
  for (const badge of defaults) {
    batch.set(db.collection(COLLECTION).doc(badge.badgeId), badge);
  }
  await batch.commit();
  return true;
}

/**
 * Ajoute en base tout badge de `defaults` qui n'existe pas encore (par
 * `badgeId`), sans jamais toucher aux badges déjà présents (y compris ceux
 * édités manuellement dans Firestore). Contrairement à `ensureCatalog`,
 * peut être rappelée à chaque relance de /setup pour faire apparaître de
 * nouveaux badges ajoutés à DEFAULT_BADGES sans rien écraser.
 */
async function syncCatalog(defaults) {
  const snap = await db.collection(COLLECTION).get();
  const existingIds = new Set(snap.docs.map((d) => d.id));
  const missing = defaults.filter((badge) => !existingIds.has(badge.badgeId));
  if (!missing.length) return 0;
  const batch = db.batch();
  for (const badge of missing) {
    batch.set(db.collection(COLLECTION).doc(badge.badgeId), badge);
  }
  await batch.commit();
  return missing.length;
}

module.exports = { listCatalog, ensureCatalog, syncCatalog };
