'use strict';

const { db } = require('../firebase');

const COLLECTION = 'payments';

async function get(paymentId) {
  const snap = await db.collection(COLLECTION).doc(paymentId).get();
  return snap.exists ? snap.data() : null;
}

async function listByEmployee(employeeId, { limit = 500 } = {}) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).orderBy('paidAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => d.data());
}

module.exports = { get, listByEmployee };
