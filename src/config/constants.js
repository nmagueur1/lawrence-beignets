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
  CANDIDATURE_ATTENTE: 'CANDIDATURE_ATTENTE',
};

const TICKET_CATEGORY_LABELS = {
  QUESTION: { emoji: '❓', label: 'Question' },
  FARM: { emoji: '🍩', label: 'Question sur le farm' },
  SIGNALEMENT: { emoji: '⚠️', label: 'Signalement interne' },
  MANAGEMENT: { emoji: '👤', label: 'Demande au management' },
  AUTRE: { emoji: '❔', label: 'Autre' },
  CANDIDATURE_ATTENTE: { emoji: '🗂️', label: 'Candidature en attente (CV)' },
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
  EARNED_TOTAL: 'EARNED_TOTAL',
  SENIORITY_DAYS: 'SENIORITY_DAYS',
  SALES_STREAK: 'SALES_STREAK',
  GRADE_REACHED: 'GRADE_REACHED',
  CLEAN_SALES: 'CLEAN_SALES',
  // Jamais évalué automatiquement (aucun cas dans BadgeService.meetsCriteria) :
  // attribué à la main, ex. `employe-du-mois` via le job jobs/employeeOfMonth.js.
  MANUAL: 'MANUAL',
};

const BADGE_RARITY = {
  COMMON: 'COMMON',
  RARE: 'RARE',
  EPIC: 'EPIC',
  LEGENDARY: 'LEGENDARY',
};

const BADGE_RARITY_LABELS = {
  COMMON: '⚪ Commun',
  RARE: '🔵 Rare',
  EPIC: '🟣 Épique',
  LEGENDARY: '🟡 Légendaire',
};

// Ordre croissant de rareté, utilisé pour trier l'affichage du catalogue.
const BADGE_RARITY_ORDER = [BADGE_RARITY.COMMON, BADGE_RARITY.RARE, BADGE_RARITY.EPIC, BADGE_RARITY.LEGENDARY];

const BADGE_CATEGORY_LABELS = {
  VENTES: '🍩 Ventes',
  BEIGNETS: '📦 Beignets livrés',
  POINTS: '🏆 Points',
  ARGENT: '💰 Argent généré',
  ANCIENNETE: '📅 Ancienneté',
  STREAK: '🔥 Régularité',
  GRADE: '🎭 Carrière',
  INTEGRITE: '🛡️ Sans-faute',
  SPECIAL: '✨ Spécial',
};

// Ordre d'affichage des catégories dans /badges.
const BADGE_CATEGORY_ORDER = ['VENTES', 'BEIGNETS', 'POINTS', 'ARGENT', 'ANCIENNETE', 'STREAK', 'GRADE', 'INTEGRITE', 'SPECIAL'];

// Catalogue de badges par défaut. Semé au premier /setup, puis synchronisé
// (uniquement les badges manquants sont ajoutés) à chaque relance de /setup —
// ajouter une entrée ici suffit, elle apparaîtra en base au prochain /setup
// sans jamais toucher aux badges déjà personnalisés dans Firestore.
const DEFAULT_BADGES = [
  // 🍩 Ventes
  { badgeId: 'first-sale', name: 'Première vente', emoji: '🍩', description: 'A validé sa toute première vente', category: 'VENTES', rarity: 'COMMON', criteria: { type: 'FIRST_SALE' } },
  { badgeId: 'sales-10', name: 'Apprenti vendeur', emoji: '🥉', description: 'A validé 10 ventes', category: 'VENTES', rarity: 'COMMON', criteria: { type: 'SALES_COUNT', value: 10 } },
  { badgeId: 'sales-50', name: '50 ventes', emoji: '🚚', description: 'A validé 50 ventes', category: 'VENTES', rarity: 'RARE', criteria: { type: 'SALES_COUNT', value: 50 } },
  { badgeId: 'sales-100', name: 'Centurion du beignet', emoji: '📦', description: 'A validé 100 ventes', category: 'VENTES', rarity: 'RARE', criteria: { type: 'SALES_COUNT', value: 100 } },
  { badgeId: 'sales-250', name: 'Machine à beignets', emoji: '🏭', description: 'A validé 250 ventes', category: 'VENTES', rarity: 'EPIC', criteria: { type: 'SALES_COUNT', value: 250 } },
  { badgeId: 'sales-500', name: 'Légende du comptoir', emoji: '🌟', description: 'A validé 500 ventes', category: 'VENTES', rarity: 'LEGENDARY', criteria: { type: 'SALES_COUNT', value: 500 } },
  { badgeId: 'sales-1000', name: 'Mythe vivant', emoji: '💫', description: 'A validé 1000 ventes', category: 'VENTES', rarity: 'LEGENDARY', criteria: { type: 'SALES_COUNT', value: 1000 } },

  // 📦 Beignets livrés (volume total)
  { badgeId: 'beignets-1000', name: '1 000 beignets', emoji: '🍩', description: 'A livré 1 000 beignets au total', category: 'BEIGNETS', rarity: 'COMMON', criteria: { type: 'BEIGNETS_TOTAL', value: 1000 } },
  { badgeId: 'beignets-5000', name: '5 000 beignets', emoji: '🍩', description: 'A livré 5 000 beignets au total', category: 'BEIGNETS', rarity: 'RARE', criteria: { type: 'BEIGNETS_TOTAL', value: 5000 } },
  { badgeId: 'beignets-10000', name: '10 000 beignets', emoji: '🍩', description: 'A livré 10 000 beignets au total', category: 'BEIGNETS', rarity: 'EPIC', criteria: { type: 'BEIGNETS_TOTAL', value: 10000 } },
  { badgeId: 'beignets-25000', name: 'Roi du glaçage', emoji: '👑', description: 'A livré 25 000 beignets au total', category: 'BEIGNETS', rarity: 'LEGENDARY', criteria: { type: 'BEIGNETS_TOTAL', value: 25000 } },

  // 🏆 Points
  { badgeId: 'points-100', name: '100 points', emoji: '🏆', description: 'A atteint 100 points', category: 'POINTS', rarity: 'COMMON', criteria: { type: 'POINTS_TOTAL', value: 100 } },
  { badgeId: 'points-500', name: '500 points', emoji: '🔥', description: 'A atteint 500 points', category: 'POINTS', rarity: 'RARE', criteria: { type: 'POINTS_TOTAL', value: 500 } },
  { badgeId: 'points-1000', name: '1 000 points', emoji: '💎', description: 'A atteint 1 000 points', category: 'POINTS', rarity: 'EPIC', criteria: { type: 'POINTS_TOTAL', value: 1000 } },
  { badgeId: 'points-2500', name: '2 500 points', emoji: '🌠', description: 'A atteint 2 500 points', category: 'POINTS', rarity: 'LEGENDARY', criteria: { type: 'POINTS_TOTAL', value: 2500 } },

  // 💰 Argent généré
  { badgeId: 'earned-1000', name: '1 000$ générés', emoji: '💵', description: 'A généré 1 000$ de chiffre d\'affaires', category: 'ARGENT', rarity: 'COMMON', criteria: { type: 'EARNED_TOTAL', value: 1000 } },
  { badgeId: 'earned-5000', name: '5 000$ générés', emoji: '💰', description: 'A généré 5 000$ de chiffre d\'affaires', category: 'ARGENT', rarity: 'RARE', criteria: { type: 'EARNED_TOTAL', value: 5000 } },
  { badgeId: 'earned-25000', name: '25 000$ générés', emoji: '🏦', description: 'A généré 25 000$ de chiffre d\'affaires', category: 'ARGENT', rarity: 'EPIC', criteria: { type: 'EARNED_TOTAL', value: 25000 } },
  { badgeId: 'earned-100000', name: '100 000$ générés', emoji: '🤑', description: 'A généré 100 000$ de chiffre d\'affaires', category: 'ARGENT', rarity: 'LEGENDARY', criteria: { type: 'EARNED_TOTAL', value: 100000 } },

  // 📅 Ancienneté (depuis employee.joinedAt)
  { badgeId: 'seniority-7', name: 'Nouvelle recrue', emoji: '🌱', description: '7 jours chez Lawrence Beignets', category: 'ANCIENNETE', rarity: 'COMMON', criteria: { type: 'SENIORITY_DAYS', value: 7 } },
  { badgeId: 'seniority-30', name: '1 mois au poste', emoji: '📅', description: '30 jours chez Lawrence Beignets', category: 'ANCIENNETE', rarity: 'COMMON', criteria: { type: 'SENIORITY_DAYS', value: 30 } },
  { badgeId: 'seniority-90', name: '3 mois de service', emoji: '🗓️', description: '90 jours chez Lawrence Beignets', category: 'ANCIENNETE', rarity: 'RARE', criteria: { type: 'SENIORITY_DAYS', value: 90 } },
  { badgeId: 'seniority-180', name: '6 mois de service', emoji: '📆', description: '180 jours chez Lawrence Beignets', category: 'ANCIENNETE', rarity: 'EPIC', criteria: { type: 'SENIORITY_DAYS', value: 180 } },
  { badgeId: 'seniority-365', name: 'Vétéran (1 an)', emoji: '🎖️', description: '365 jours chez Lawrence Beignets', category: 'ANCIENNETE', rarity: 'LEGENDARY', criteria: { type: 'SENIORITY_DAYS', value: 365 } },

  // 🔥 Régularité (jours consécutifs avec au moins une vente validée)
  { badgeId: 'streak-3', name: 'Trois jours d\'affilée', emoji: '⚡', description: '3 jours consécutifs avec une vente validée', category: 'STREAK', rarity: 'COMMON', criteria: { type: 'SALES_STREAK', value: 3 } },
  { badgeId: 'streak-7', name: 'Semaine parfaite', emoji: '🔥', description: '7 jours consécutifs avec une vente validée', category: 'STREAK', rarity: 'RARE', criteria: { type: 'SALES_STREAK', value: 7 } },
  { badgeId: 'streak-30', name: 'Mois de feu', emoji: '🌋', description: '30 jours consécutifs avec une vente validée', category: 'STREAK', rarity: 'LEGENDARY', criteria: { type: 'SALES_STREAK', value: 30 } },

  // 🎭 Carrière (grade atteint)
  { badgeId: 'grade-pro', name: 'Passage PRO', emoji: '👥', description: 'A atteint le grade PRO', category: 'GRADE', rarity: 'RARE', criteria: { type: 'GRADE_REACHED', value: 'PRO' } },
  { badgeId: 'grade-manager', name: 'Passage MANAGER', emoji: '🧠', description: 'A atteint le grade MANAGER', category: 'GRADE', rarity: 'EPIC', criteria: { type: 'GRADE_REACHED', value: 'MANAGER' } },
  { badgeId: 'grade-direction', name: 'Entrée en Direction', emoji: '👑', description: 'A atteint la Direction (PATRON / CO-PATRON)', category: 'GRADE', rarity: 'LEGENDARY', criteria: { type: 'GRADE_REACHED', value: 'DIRECTION' } },

  // 🛡️ Sans-faute (ventes validées sans aucune sanction au dossier)
  { badgeId: 'clean-25', name: '25 ventes sans accroc', emoji: '🕊️', description: '25 ventes validées, aucune sanction au dossier', category: 'INTEGRITE', rarity: 'RARE', criteria: { type: 'CLEAN_SALES', value: 25 } },
  { badgeId: 'clean-100', name: '100 ventes sans accroc', emoji: '🛡️', description: '100 ventes validées, aucune sanction au dossier', category: 'INTEGRITE', rarity: 'EPIC', criteria: { type: 'CLEAN_SALES', value: 100 } },

  // ✨ Spécial (attribution manuelle)
  { badgeId: 'employe-du-mois', name: 'Employé du mois', emoji: '👑', description: 'Élu employé du mois', category: 'SPECIAL', rarity: 'LEGENDARY', criteria: { type: 'MANUAL' } },
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

// Catégorie créée à la volée (ou via /cv-categorie) pour archiver les CV des
// candidatures mises en attente.
const CV_CATEGORY_NAME = '🗂️ CV EN ATTENTE';

const BRAND = {
  NAME: 'Lawrence Beignets',
  EMOJI: '🍩',
  COLOR: 0xE8A33D,
  COLOR_SUCCESS: 0x57F287,
  COLOR_DANGER: 0xED4245,
  COLOR_WARNING: 0xFEE75C,
  FOOTER: '🍩 Lawrence Beignets — GTA RP',
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
  CV_CATEGORY_NAME,
  NOTE_TYPE,
  NOTE_LABELS,
  BADGE_CRITERIA,
  BADGE_RARITY,
  BADGE_RARITY_LABELS,
  BADGE_RARITY_ORDER,
  BADGE_CATEGORY_LABELS,
  BADGE_CATEGORY_ORDER,
  DEFAULT_BADGES,
  BRAND,
};
