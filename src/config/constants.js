'use strict';

/**
 * Constantes métier non-sensibles (jamais d'ID Discord ni de tarif ici).
 * Les IDs et tarifs vivent exclusivement dans Firestore (collection `config`).
 */

const GRADES = {
  NOVICE: 'NOVICE',
  PRO: 'PRO',
  MANAGER: 'MANAGER',
  PATRON: 'PATRON',
  CO_PATRON: 'CO_PATRON',
};

const GRADE_LABELS = {
  NOVICE: '👤 NOVICE',
  PRO: '👥 PRO',
  MANAGER: '🧠 MANAGER',
  PATRON: '👑 PATRON',
  CO_PATRON: '✨ CO-PATRON',
};

// Ordre hiérarchique croissant, utilisé pour valider promotions/rétrogradations.
const GRADE_ORDER = [GRADES.NOVICE, GRADES.PRO, GRADES.MANAGER, GRADES.PATRON, GRADES.CO_PATRON];

const SALE_STATUS = {
  PENDING: 'PENDING',
  VALIDATED: 'VALIDATED',
  CANCELLED: 'CANCELLED',
};

const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
  WAITING: 'WAITING',
};

const TICKET_CATEGORY = {
  QUESTION: 'QUESTION',
  FARM: 'FARM',
  SIGNALEMENT: 'SIGNALEMENT',
  MANAGEMENT: 'MANAGEMENT',
  AUTRE: 'AUTRE',
};

const TICKET_CATEGORY_LABELS = {
  QUESTION: { emoji: '❓', label: 'Question', prefix: 'question' },
  FARM: { emoji: '🍩', label: 'Question sur le farm', prefix: 'farm' },
  SIGNALEMENT: { emoji: '⚠️', label: 'Signalement interne', prefix: 'signalement' },
  MANAGEMENT: { emoji: '👤', label: 'Demande au management', prefix: 'management' },
  AUTRE: { emoji: '❔', label: 'Autre', prefix: 'autre' },
};

const TICKET_STATUS = {
  OPEN: 'OPEN',
  CLAIMED: 'CLAIMED',
  CLOSED: 'CLOSED',
};

const SANCTION_TYPE = {
  WARNING: 'WARNING',
  LAST_WARNING: 'LAST_WARNING',
  DISCIPLINARY: 'DISCIPLINARY',
  SUSPENSION: 'SUSPENSION',
  EXCLUSION: 'EXCLUSION',
};

const SANCTION_LABELS = {
  WARNING: '⚠️ Avertissement',
  LAST_WARNING: '🟠 Dernier avertissement',
  DISCIPLINARY: '🔴 Sanction disciplinaire',
  SUSPENSION: '⛔ Suspension',
  EXCLUSION: '❌ Exclusion',
};

const ABSENCE_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REFUSED: 'REFUSED',
};

const POINT_TYPE = {
  SALE: 'SALE',
  MANUAL: 'MANUAL',
  CORRECTION: 'CORRECTION',
};

const POINT_RULE_TYPE = {
  SALE_THRESHOLD: 'SALE_THRESHOLD',
  MANUAL: 'MANUAL',
};

const NOTE_TYPE = {
  POSITIVE: 'POSITIVE',
  NEUTRAL: 'NEUTRAL',
  DISCIPLINARY: 'DISCIPLINARY',
};

const NOTE_LABELS = {
  POSITIVE: '🟢 Positive',
  NEUTRAL: '⚪ Neutre',
  DISCIPLINARY: '🔴 Disciplinaire',
};

const BADGE_CRITERIA = {
  FIRST_SALE: 'FIRST_SALE',
  SALES_COUNT: 'SALES_COUNT',
  POINTS_TOTAL: 'POINTS_TOTAL',
  BEIGNETS_TOTAL: 'BEIGNETS_TOTAL',
};

// Catalogue de badges par défaut, semé une seule fois si la collection est vide.
// Reste éditable directement dans Firestore (collection `badges`).
const DEFAULT_BADGES = [
  { badgeId: 'first-sale', name: 'Première vente', emoji: '🍩', description: 'A validé sa toute première vente', criteria: { type: 'FIRST_SALE' } },
  { badgeId: 'points-100', name: '100 points', emoji: '🏆', description: 'A atteint 100 points', criteria: { type: 'POINTS_TOTAL', value: 100 } },
  { badgeId: 'points-500', name: '500 points', emoji: '🔥', description: 'A atteint 500 points', criteria: { type: 'POINTS_TOTAL', value: 500 } },
  { badgeId: 'sales-50', name: '50 ventes', emoji: '🚚', description: 'A validé 50 ventes', criteria: { type: 'SALES_COUNT', value: 50 } },
  { badgeId: 'employe-du-mois', name: 'Employé du mois', emoji: '👑', description: 'Élu employé du mois', criteria: { type: 'MANUAL' } },
];

// Blueprint des rôles fonctionnels : détectés par nom exact, jamais créés automatiquement.
const ROLE_BLUEPRINT = [
  { key: 'patron', name: '👑・PATRON' },
  { key: 'coPatron', name: '✨・CO-PATRON' },
  { key: 'manager', name: '🧠・MANAGER' },
  { key: 'pro', name: '👥・PRO' },
  { key: 'novice', name: '👤・NOVICE' },
  { key: 'pine', name: '🌲・PINE' },
  { key: 'gouvernement', name: '🗽・GOUVERNEMENT' },
  { key: 'visiteur', name: '✈️・VISITEUR' },
];

// Blueprint des catégories/salons : détectés par nom, créés uniquement s'ils manquent.
const CHANNEL_STRUCTURE = [
  {
    category: '📌 INFORMATIONS',
    channels: [
      { key: 'accueil', name: '👋・accueil' },
      { key: 'informations', name: 'ℹ️・informations' },
      { key: 'reglement', name: '📜・règlement' },
    ],
  },
  {
    category: '🍩 RECRUTEMENT',
    channels: [
      { key: 'recrutementOn', name: '🟢・recrutement-on' },
      { key: 'localisation', name: '📍・localisation' },
      { key: 'contact', name: '📄・contact' },
      { key: 'demandeRoles', name: '🎭・demande-rôles' },
    ],
  },
  {
    category: '🏢 BUREAU',
    channels: [
      { key: 'annonces', name: '📢・annonces' },
      { key: 'organigramme', name: '📋・organigramme' },
      { key: 'points', name: '🍩・points' },
    ],
  },
  {
    category: '🔒 STAFF',
    channels: [
      { key: 'staffTickets', name: '📥・tickets-staff' },
      { key: 'staffApplications', name: '📋・candidatures' },
      { key: 'logs', name: '📜・logs' },
    ],
  },
];

// Catégorie dédiée aux fiches de paie individuelles (existe déjà côté serveur en général).
const PAY_CATEGORY_NAME = '📄 FICHE DE PAYE';

// Catégorie créée à la volée pour héberger les salons de tickets (contact).
const TICKET_CATEGORY_NAME = '🎫 TICKETS';

const BRAND = {
  NAME: 'Lawrence Doughnuts',
  EMOJI: '🍩',
  COLOR: 0xE8A33D,
  COLOR_SUCCESS: 0x57F287,
  COLOR_DANGER: 0xED4245,
  COLOR_WARNING: 0xFEE75C,
  FOOTER: '🍩 Lawrence Doughnuts — GTA RP',
};

module.exports = {
  GRADES,
  GRADE_LABELS,
  GRADE_ORDER,
  SALE_STATUS,
  APPLICATION_STATUS,
  TICKET_CATEGORY,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS,
  SANCTION_TYPE,
  SANCTION_LABELS,
  ABSENCE_STATUS,
  POINT_TYPE,
  POINT_RULE_TYPE,
  ROLE_BLUEPRINT,
  CHANNEL_STRUCTURE,
  PAY_CATEGORY_NAME,
  TICKET_CATEGORY_NAME,
  NOTE_TYPE,
  NOTE_LABELS,
  BADGE_CRITERIA,
  DEFAULT_BADGES,
  BRAND,
};
