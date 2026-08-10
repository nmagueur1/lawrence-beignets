'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'applications';

async function create(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    applicationId: ref.id,
    userId: data.userId,
    prenomRp: data.prenomRp,
    nomRp: data.nomRp,
    idRp: data.idRp,
    ageRp: data.ageRp,
    experience: data.experience,
    disponibilites: data.disponibilites,
    motivation: data.motivation,
    pourquoi: data.pourquoi,
    tempsDeJeu: data.tempsDeJeu,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    messageId: null,
  };
  await ref.set(payload);
  return payload;
}

async function get(applicationId) {
  const snap = await db.collection(COLLECTION).doc(applicationId).get();
  return snap.exists ? snap.data() : null;
}

async function update(applicationId, data) {
  await db.collection(COLLECTION).doc(applicationId).set(data, { merge: true });
}

module.exports = { create, get, update };
