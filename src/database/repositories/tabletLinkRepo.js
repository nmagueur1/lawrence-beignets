'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'tabletLinks';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Code de liaison éphémère : généré par /tablette lier (côté Discord), consommé
 * une seule fois par l'API tablette pour associer un identifiant FiveM à un
 * discordId. Jamais réutilisable après consommation (voir tabletLinkRepo.remove).
 */
async function create(code, discordId, ttlMs = DEFAULT_TTL_MS) {
  const ref = db.collection(COLLECTION).doc(code);
  const payload = {
    code,
    discordId,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Date.now() + ttlMs,
  };
  await ref.set(payload);
  return payload;
}

async function get(code) {
  const snap = await db.collection(COLLECTION).doc(code).get();
  return snap.exists ? snap.data() : null;
}

async function remove(code) {
  await db.collection(COLLECTION).doc(code).delete();
}

module.exports = { create, get, remove };
