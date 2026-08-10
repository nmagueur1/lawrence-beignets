'use strict';

const { db } = require('../firebase');

const COLLECTION = 'config';

/**
 * `config` est une collection de documents "singleton" (un document par domaine :
 * roles, channels, rates, permissions, recruitment, messages, counters, ...).
 * Ce repository fait de simples get/set/merge sur ces documents.
 */
async function getDoc(docId) {
  const snap = await db.collection(COLLECTION).doc(docId).get();
  return snap.exists ? snap.data() : null;
}

async function setDoc(docId, data, { merge = true } = {}) {
  await db.collection(COLLECTION).doc(docId).set(data, { merge });
}

async function ensureDoc(docId, defaults) {
  const ref = db.collection(COLLECTION).doc(docId);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set(defaults);
    return defaults;
  }
  return snap.data();
}

module.exports = { getDoc, setDoc, ensureDoc };
