'use strict';

const { db } = require('./firebase');

/**
 * Consomme un code généré par /tablette lier sur Discord. Le même code peut
 * servir à lier la tablette FiveM OU ce site web (le code n'est rien de plus
 * qu'une preuve courte durée que tu contrôles ce compte Discord) : un seul
 * mécanisme de liaison pour les deux clients.
 */
async function consumeCode(code) {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();
  const ref = db.collection('tabletLinks').doc(normalized);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  await ref.delete().catch(() => null);

  if (data.expiresAt < Date.now()) return null;
  return data;
}

module.exports = { consumeCode };
