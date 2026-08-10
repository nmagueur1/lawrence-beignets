'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'employees';

async function get(discordId) {
  const snap = await db.collection(COLLECTION).doc(discordId).get();
  return snap.exists ? snap.data() : null;
}

async function exists(discordId) {
  const snap = await db.collection(COLLECTION).doc(discordId).get();
  return snap.exists;
}

async function create(discordId, data) {
  const ref = db.collection(COLLECTION).doc(discordId);
  const payload = {
    discordId,
    username: data.username || null,
    rpName: data.rpName || null,
    prenomRp: data.prenomRp || null,
    nomRp: data.nomRp || null,
    idRp: data.idRp || null,
    grade: data.grade || 'NOVICE',
    joinedAt: data.joinedAt || new Date().toISOString(),
    active: true,
    totalBeignets: 0,
    totalEarned: 0,
    totalPaid: 0,
    balance: 0,
    points: 0,
    badges: [],
    payChannelId: data.payChannelId || null,
    lastSaleAt: null,
  };
  await ref.set(payload, { merge: true });
  return payload;
}

async function update(discordId, data) {
  await db.collection(COLLECTION).doc(discordId).set(data, { merge: true });
}

async function incrementFields(discordId, increments) {
  const payload = {};
  for (const [field, amount] of Object.entries(increments)) {
    payload[field] = FieldValue.increment(amount);
  }
  await db.collection(COLLECTION).doc(discordId).set(payload, { merge: true });
}

async function listByGrade(grade) {
  const snap = await db.collection(COLLECTION).where('grade', '==', grade).where('active', '==', true).get();
  return snap.docs.map((d) => d.data());
}

async function listAllActive() {
  const snap = await db.collection(COLLECTION).where('active', '==', true).get();
  return snap.docs.map((d) => d.data());
}

module.exports = { get, exists, create, update, incrementFields, listByGrade, listAllActive };
