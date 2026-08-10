'use strict';

const { db } = require('../firebase');

const COLLECTION = 'pointRules';

async function create(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    id: ref.id,
    name: data.name,
    description: data.description || '',
    type: data.type || 'SALE_THRESHOLD',
    threshold: data.threshold,
    points: data.points,
    enabled: data.enabled !== false,
    order: data.order || 0,
  };
  await ref.set(payload);
  return payload;
}

async function update(id, data) {
  await db.collection(COLLECTION).doc(id).set(data, { merge: true });
}

async function remove(id) {
  await db.collection(COLLECTION).doc(id).delete();
}

async function get(id) {
  const snap = await db.collection(COLLECTION).doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function listAll() {
  const snap = await db.collection(COLLECTION).orderBy('threshold', 'asc').get();
  return snap.docs.map((d) => d.data());
}

async function listEnabledByType(type) {
  const snap = await db.collection(COLLECTION).where('type', '==', type).where('enabled', '==', true).get();
  return snap.docs.map((d) => d.data());
}

module.exports = { create, update, remove, get, listAll, listEnabledByType };
