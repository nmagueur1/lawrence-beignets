'use strict';

const { db, FieldValue } = require('../firebase');

const COLLECTION = 'tickets';

async function create(data) {
  const ref = db.collection(COLLECTION).doc();
  const payload = {
    ticketId: ref.id,
    channelId: data.channelId,
    userId: data.userId,
    category: data.category,
    status: 'OPEN',
    assignedTo: null,
    priority: false,
    // Embed complémentaire figé à la création (ex: résumé de candidature pour les
    // CV mis en attente), réaffiché tel quel à chaque rafraîchissement du ticket.
    extraEmbed: data.extraEmbed || null,
    createdAt: FieldValue.serverTimestamp(),
    closedAt: null,
    closedBy: null,
    closeReason: null,
    transcriptUrl: null,
  };
  await ref.set(payload);
  return payload;
}

async function getByChannel(channelId) {
  const snap = await db.collection(COLLECTION).where('channelId', '==', channelId).limit(1).get();
  return snap.empty ? null : snap.docs[0].data();
}

async function get(ticketId) {
  const snap = await db.collection(COLLECTION).doc(ticketId).get();
  return snap.exists ? snap.data() : null;
}

async function update(ticketId, data) {
  await db.collection(COLLECTION).doc(ticketId).set(data, { merge: true });
}

async function listOpen() {
  const snap = await db.collection(COLLECTION).where('status', '!=', 'CLOSED').get();
  return snap.docs.map((d) => d.data());
}

module.exports = { create, getByChannel, get, update, listOpen };
