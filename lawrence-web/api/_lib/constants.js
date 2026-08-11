'use strict';

// Copie minimale des constantes non-sensibles du bot (src/config/constants.js).
// Dupliquée volontairement : ce dossier est un déploiement Vercel autonome,
// il n'importe aucun fichier du bot.

const GRADE_LABELS = {
  NOVICE: '👤 NOVICE',
  PRO: '👥 PRO',
  MANAGER: '🧠 MANAGER',
  PATRON: '👑 PATRON',
  CO_PATRON: '✨ CO-PATRON',
};

const GRADE_ORDER = ['NOVICE', 'PRO', 'MANAGER', 'PATRON', 'CO_PATRON'];

module.exports = { GRADE_LABELS, GRADE_ORDER };
