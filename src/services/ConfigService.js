'use strict';

const configRepo = require('../database/repositories/configRepo');

/**
 * Cache mémoire au-dessus de la collection Firestore `config`.
 * Aucun ID Discord ni tarif ne doit jamais être en dur ailleurs dans le code :
 * tout passe par ce service.
 */

const DEFAULTS = {
  roles: { patron: null, coPatron: null, manager: null, pro: null, novice: null, pine: null, gouvernement: null, visiteur: null },
  channels: {},
  messages: {},
  rates: { NOVICE: 13, PRO: 19, MANAGER: 25, PATRON: 50, CO_PATRON: 50 },
  permissions: { managerCanPay: false, managerSanctionTypes: ['WARNING', 'LAST_WARNING'] },
  recruitment: { open: false },
  announcements: {},
  reports: { weeklyEnabled: true },
  badges: {},
  tickets: {},
  counters: { saleCounter: 0 },
  maintenance: { enabled: false },
};

const cache = new Map();

async function get(docId) {
  if (cache.has(docId)) return cache.get(docId);
  const defaults = DEFAULTS[docId] || {};
  const data = await configRepo.ensureDoc(docId, defaults);
  const merged = { ...defaults, ...data };
  cache.set(docId, merged);
  return merged;
}

async function set(docId, data) {
  await configRepo.setDoc(docId, data, { merge: true });
  cache.delete(docId);
  return get(docId);
}

function invalidate(docId) {
  if (docId) cache.delete(docId);
  else cache.clear();
}

// Raccourcis fréquemment utilisés
async function getRoles() { return get('roles'); }
async function getChannels() { return get('channels'); }
async function getRates() { return get('rates'); }
async function getPermissions() { return get('permissions'); }
async function getMessages() { return get('messages'); }

module.exports = { get, set, invalidate, getRoles, getChannels, getRates, getPermissions, getMessages, DEFAULTS };
