'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'logs';

async function create(entry) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    id: ref.id,
    action: entry.action,
    targetUserId: entry.targetUserId || null,
    actorId: entry.actorId || null,
    date: FieldValue.serverTimestamp(),
    details: entry.details || {},
    transactionId: entry.transactionId || null,
  };
  await ref.set(payload);
  return payload;
}

module.exports = { create };
