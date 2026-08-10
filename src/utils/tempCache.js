'use strict';

/**
 * Cache mémoire volatile à courte durée de vie, utilisé pour faire transiter des
 * données entre deux interactions liées (ex: modal en plusieurs étapes, car Discord
 * limite un modal à 5 champs texte maximum).
 */
const store = new Map();
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function set(key, value) {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function del(key) {
  store.delete(key);
}

module.exports = { set, get, del };
