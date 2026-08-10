'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'backups';

async function create(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = { backupId: ref.id, ...data, createdAt: FieldValue.serverTimestamp() };
  await ref.set(payload);
  return payload;
}

async function get(backupId) {
  const snap = await db.collection(COLLECTION).doc(backupId).get();
  return snap.exists ? snap.data() : null;
}

async function listRecent(limit = 10) {
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => d.data());
}

module.exports = { create, get, listRecent };
