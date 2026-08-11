'use strict';

const { db, FieldValue } = require('../firebase');
const counterRepo = require('./counterRepo');

const COLLECTION = 'saleRequests';

/**
 * Déclaration de vente faite depuis la tablette in-game. Contrairement à
 * `sales` (ventes déjà validées par un Manager via /valider-vente), ceci n'est
 * qu'une demande : elle ne modifie ni le solde ni les points de l'employé.
 * Le Manager reste seul à trancher via /valider-vente, comme avant — la
 * tablette ne fait que remonter l'information plus vite qu'un ticket.
 */
async function create({ employeeId, quantity, source }) {
  const value = await counterRepo.nextValue('saleRequestCounter');
  const requestId = `SR-${String(value).padStart(5, '0')}`;
  const ref = db.collection(COLLECTION).doc(requestId);
  const payload = {
    requestId,
    employeeId,
    quantity,
    source: source || 'TABLET',
    status: 'PENDING',
    createdAt: FieldValue.serverTimestamp(),
  };
  await ref.set(payload);
  return payload;
}

async function listPending() {
  const snap = await db.collection(COLLECTION).where('status', '==', 'PENDING').orderBy('createdAt', 'desc').get();
  return snap.docs.map((d) => d.data());
}

module.exports = { create, listPending };
