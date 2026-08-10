'use strict';

const { db } = require('../firebase');

const COLLECTION = 'points';

async function listByEmployee(employeeId, { limit = 500 } = {}) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => d.data());
}

module.exports = { listByEmployee };
