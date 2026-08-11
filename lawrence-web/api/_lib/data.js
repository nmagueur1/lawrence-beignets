'use strict';

const { db, FieldValue } = require('./firebase');

// Lecture/écriture directe des mêmes collections que le bot. Requêtes
// identiques à celles déjà utilisées par src/database/repositories du bot
// (mêmes champs, mêmes tris) pour éviter tout besoin de nouvel index Firestore.

async function getEmployee(discordId) {
  const snap = await db.collection('employees').doc(discordId).get();
  return snap.exists ? snap.data() : null;
}

async function listActiveEmployees() {
  const snap = await db.collection('employees').where('active', '==', true).get();
  return snap.docs.map((d) => d.data());
}

async function getSalesHistory(discordId, limit = 20) {
  const snap = await db
    .collection('sales')
    .where('employeeId', '==', discordId)
    .where('status', '==', 'VALIDATED')
    .orderBy('validatedAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => d.data());
}

async function getPaymentsHistory(discordId, limit = 20) {
  const snap = await db.collection('payments').where('employeeId', '==', discordId).orderBy('paidAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => d.data());
}

async function getPointsHistory(discordId, limit = 20) {
  const snap = await db.collection('points').where('employeeId', '==', discordId).orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map((d) => d.data());
}

async function nextCounterValue(counterName) {
  const ref = db.collection('config').doc('counters');
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? snap.data()[counterName] || 0 : 0;
    const next = current + 1;
    tx.set(ref, { [counterName]: next }, { merge: true });
    return next;
  });
}

/**
 * Même logique que src/database/repositories/saleRequestRepo.js côté bot :
 * ne crée qu'une demande (PENDING), ne touche jamais au solde/points. Utilise
 * le MÊME compteur Firestore (config/counters.saleRequestCounter) donc les
 * identifiants SR-xxxxx restent uniques, que la déclaration vienne de la
 * tablette in-game ou du site web.
 */
async function createSaleRequest({ employeeId, quantity, source }) {
  const value = await nextCounterValue('saleRequestCounter');
  const requestId = `SR-${String(value).padStart(5, '0')}`;
  const payload = {
    requestId,
    employeeId,
    quantity,
    source: source || 'WEB',
    status: 'PENDING',
    createdAt: FieldValue.serverTimestamp(),
  };
  await db.collection('saleRequests').doc(requestId).set(payload);
  return payload;
}

/**
 * Même schéma que src/database/repositories/absenceRepo.js : écrit dans la
 * même collection `absences`, donc /absence historique et la validation
 * staff sur Discord fonctionnent sans aucun changement.
 */
async function createAbsenceRequest({ employeeId, startDate, endDate, reason, comment }) {
  const ref = db.collection('absences').doc();
  const payload = {
    absenceId: ref.id,
    employeeId,
    startDate,
    endDate,
    reason,
    comment: comment || null,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload);
  return payload;
}

async function getReglement() {
  const snap = await db.collection('config').doc('reglement').get();
  return snap.exists ? snap.data() : {};
}

module.exports = {
  getEmployee,
  listActiveEmployees,
  getSalesHistory,
  getPaymentsHistory,
  getPointsHistory,
  createSaleRequest,
  createAbsenceRequest,
  getReglement,
};
