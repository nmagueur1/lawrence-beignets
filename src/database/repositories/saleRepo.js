'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'sales';

async function get(saleId) {
  const snap = await db.collection(COLLECTION).doc(saleId).get();
  return snap.exists ? snap.data() : null;
}

async function listByEmployee(employeeId, { limit = 500 } = {}) {
  const snap = await db
    .collection(COLLECTION)
    .where('employeeId', '==', employeeId)
    .where('status', '==', 'VALIDATED')
    .orderBy('validatedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data());
}

async function countByEmployee(employeeId) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).where('status', '==', 'VALIDATED').count().get();
  return snap.data().count;
}

module.exports = { get, listByEmployee, countByEmployee };
