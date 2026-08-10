'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'absences';

async function create(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    absenceId: ref.id,
    employeeId: data.employeeId,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    comment: data.comment || null,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload);
  return payload;
}

async function get(absenceId) {
  const snap = await db.collection(COLLECTION).doc(absenceId).get();
  return snap.exists ? snap.data() : null;
}

async function update(absenceId, data) {
  await db.collection(COLLECTION).doc(absenceId).set(data, { merge: true });
}

async function listByEmployee(employeeId) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => d.data());
}

async function countByEmployee(employeeId) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).count().get();
  return snap.data().count;
}

module.exports = { create, get, update, listByEmployee, countByEmployee };
