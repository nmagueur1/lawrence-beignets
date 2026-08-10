'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'sanctions';

async function create(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    sanctionId: ref.id,
    employeeId: data.employeeId,
    issuedBy: data.issuedBy,
    type: data.type,
    reason: data.reason,
    date: FieldValue.serverTimestamp(),
    expiresAt: data.expiresAt || null,
    note: data.note || null,
    evidenceUrl: data.evidenceUrl || null,
  };
  await ref.set(payload);
  return payload;
}

async function listByEmployee(employeeId) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).orderBy('date', 'desc').get();
  return snap.docs.map((d) => d.data());
}

async function countByEmployee(employeeId) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).count().get();
  return snap.data().count;
}

module.exports = { create, listByEmployee, countByEmployee };
