'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'players';

/**
 * Association identifiant FiveM (ex: "license:abcd1234") ↔ discordId. Un même
 * discordId peut avoir plusieurs identifiants liés (plusieurs personnages).
 * Créée uniquement par l'API tablette au moment de la consommation d'un code
 * (voir tabletLinkRepo), jamais par le bot directement.
 */
async function link(identifier, discordId, meta = {}) {
  const ref = db.collection(COLLECTION).doc(identifier);
  const payload = {
    identifier,
    discordId,
    linkedAt: FieldValue.serverTimestamp(),
    ...meta,
  };
  await ref.set(payload, { merge: true });
  return payload;
}

async function getByIdentifier(identifier) {
  const snap = await db.collection(COLLECTION).doc(identifier).get();
  return snap.exists ? snap.data() : null;
}

async function unlink(identifier) {
  await db.collection(COLLECTION).doc(identifier).delete();
}

module.exports = { link, getByIdentifier, unlink };
