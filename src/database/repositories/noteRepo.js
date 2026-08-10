'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'notes';

async function create(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    noteId: ref.id,
    employeeId: data.employeeId,
    authorId: data.authorId,
    type: data.type,
    content: data.content,
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload);
  return payload;
}

async function listByEmployee(employeeId) {
  const snap = await db.collection(COLLECTION).where('employeeId', '==', employeeId).orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => d.data());
}

module.exports = { create, listByEmployee };
