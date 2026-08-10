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

module.exports = { listCatalog, ensureCatalog };
