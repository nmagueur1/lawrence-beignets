'use strict';

const { db, FieldValue } = require('../firebase');

const DOC_REF = db.collection('config').doc('counters');

/**
 * Incrémente atomiquement un compteur nommé et renvoie sa nouvelle valeur.
 * Utilisé pour générer des identifiants lisibles (ex: LD-00001).
 */
async function nextValue(counterName) {
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(DOC_REF);
    const current = snap.exists ? (snap.data()[counterName] || 0) : 0;
    const next = current + 1;
    tx.set(DOC_REF, { [counterName]: next }, { merge: true });
    return next;
  });
  return result;
}

module.exports = { nextValue };
