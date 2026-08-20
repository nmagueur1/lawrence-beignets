'use strict';

const badgeRepo = require('../database/repositories/badgeRepo');
const employeeRepo = require('../database/repositories/employeeRepo');
const saleRepo = require('../database/repositories/saleRepo');
const sanctionRepo = require('../database/repositories/sanctionRepo');
const LogService = require('./LogService');
const { baseEmbed } = require('../utils/embeds');
const {
  DEFAULT_BADGES,
  GRADE_ORDER,
  GRADES,
  BADGE_RARITY_LABELS,
  BADGE_CATEGORY_LABELS,
  BADGE_CATEGORY_ORDER,
} = require('../config/constants');

async function seedCatalog() {
  // Synchro incrémentale : ajoute les badges manquants sans jamais toucher à
  // ceux déjà présents (édités ou non) dans Firestore. Voir badgeRepo.syncCatalog.
  return badgeRepo.syncCatalog(DEFAULT_BADGES);
}

async function getCatalog() {
  return badgeRepo.listCatalog();
}

function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  return new Date(value);
}

/**
 * Compte la plus longue série en cours de jours consécutifs (jusqu'à
 * aujourd'hui ou hier) avec au moins une vente validée. Renvoie 0 si la
 * dernière vente remonte à plus d'un jour (la série est rompue).
 */
function computeSalesStreak(sales) {
  if (!sales.length) return 0;

  const days = new Set();
  for (const sale of sales) {
    const d = toDate(sale.validatedAt);
    if (!d) continue;
    days.add(d.toISOString().slice(0, 10));
  }
  if (!days.size) return 0;

  const sortedDays = [...days].sort().reverse(); // ISO desc = plus récent d'abord
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const mostRecent = new Date(`${sortedDays[0]}T00:00:00Z`);
  const gapFromToday = Math.round((today.getTime() - mostRecent.getTime()) / 86400000);
  if (gapFromToday > 1) return 0; // aucune vente aujourd'hui ni hier : série rompue

  let streak = 0;
  let expected = mostRecent;
  for (const dayStr of sortedDays) {
    const day = new Date(`${dayStr}T00:00:00Z`);
    if (day.getTime() === expected.getTime()) {
      streak += 1;
      expected = new Date(expected.getTime() - 86400000);
    } else if (day.getTime() < expected.getTime()) {
      break;
    }
  }
  return streak;
}

/**
 * Rassemble toutes les statistiques nécessaires à l'évaluation des critères
 * de badges pour un employé. Centralisé ici pour être utilisé aussi bien par
 * `checkAndAwardBadges` (attribution) que par `getCatalogProgress` (affichage
 * de la progression dans /badges).
 */
async function computeEmployeeStats(employee) {
  const [salesCount, sales, sanctionsCount] = await Promise.all([
    saleRepo.countByEmployee(employee.discordId),
    saleRepo.listByEmployee(employee.discordId),
    sanctionRepo.countByEmployee(employee.discordId),
  ]);

  const joined = toDate(employee.joinedAt);
  const seniorityDays = joined ? Math.floor((Date.now() - joined.getTime()) / 86400000) : 0;

  return {
    salesCount,
    sanctionsCount,
    points: employee.points || 0,
    totalBeignets: employee.totalBeignets || 0,
    totalEarned: employee.totalEarned || 0,
    seniorityDays,
    salesStreak: computeSalesStreak(sales),
    gradeIndex: GRADE_ORDER.indexOf(employee.grade),
  };
}

function gradeCriteriaIndex(value) {
  // 'DIRECTION' couvre PATRON et CO-PATRON (Direction), jamais distingués.
  const targetGrade = value === 'DIRECTION' ? GRADES.PATRON : value;
  return GRADE_ORDER.indexOf(targetGrade);
}

function meetsCriteria(criteria, stats) {
  switch (criteria.type) {
    case 'FIRST_SALE':
      return stats.salesCount >= 1;
    case 'SALES_COUNT':
      return stats.salesCount >= criteria.value;
    case 'POINTS_TOTAL':
      return stats.points >= criteria.value;
    case 'BEIGNETS_TOTAL':
      return stats.totalBeignets >= criteria.value;
    case 'EARNED_TOTAL':
      return stats.totalEarned >= criteria.value;
    case 'SENIORITY_DAYS':
      return stats.seniorityDays >= criteria.value;
    case 'SALES_STREAK':
      return stats.salesStreak >= criteria.value;
    case 'GRADE_REACHED':
      return stats.gradeIndex >= gradeCriteriaIndex(criteria.value);
    case 'CLEAN_SALES':
      return stats.salesCount >= criteria.value && stats.sanctionsCount === 0;
    case 'MANUAL':
    default:
      return false; // jamais attribué automatiquement
  }
}

/**
 * Vérifie le catalogue de badges et attribue automatiquement ceux nouvellement
 * mérités par l'employé (appelé après chaque vente validée).
 */
async function checkAndAwardBadges(client, employee) {
  const catalog = await getCatalog();
  const owned = new Set((employee.badges || []).map((b) => (typeof b === 'string' ? b : b.badgeId)));
  const stats = await computeEmployeeStats(employee);

  const newlyAwarded = [];
  for (const badge of catalog) {
    if (owned.has(badge.badgeId)) continue;
    if (meetsCriteria(badge.criteria, stats)) newlyAwarded.push(badge);
  }

  if (!newlyAwarded.length) return [];

  const updatedBadges = [
    ...(employee.badges || []),
    ...newlyAwarded.map((b) => ({ badgeId: b.badgeId, awardedAt: new Date().toISOString() })),
  ];
  await employeeRepo.update(employee.discordId, { badges: updatedBadges });

  for (const badge of newlyAwarded) {
    await LogService.log(client, {
      action: 'BADGE OBTENU',
      targetUserId: employee.discordId,
      details: { Badge: `${badge.emoji} ${badge.name}` },
    });
  }

  const user = await client.users.fetch(employee.discordId).catch(() => null);
  if (user) {
    await user
      .send({
        embeds: [
          baseEmbed()
            .setTitle('🏆 Nouveau(x) badge(s) débloqué(s) !')
            .setDescription(
              newlyAwarded
                .map((b) => `${b.emoji} **${b.name}** ${b.rarity ? `(${BADGE_RARITY_LABELS[b.rarity] || b.rarity})` : ''} — ${b.description}`)
                .join('\n')
            ),
        ],
      })
      .catch(() => null);
  }

  return newlyAwarded;
}

function formatBadgeList(employeeBadges, catalog) {
  if (!employeeBadges?.length) return `Aucun badge pour le moment (0/${catalog?.length || 0}).`;
  const byId = new Map(catalog.map((b) => [b.badgeId, b]));
  const list = employeeBadges
    .map((b) => {
      const id = typeof b === 'string' ? b : b.badgeId;
      const meta = byId.get(id);
      return meta ? `${meta.emoji} ${meta.name}` : id;
    })
    .join(' · ');
  return catalog?.length ? `${list}\n*(${employeeBadges.length}/${catalog.length} badges obtenus — détail avec \`/badges\`)*` : list;
}

/**
 * Renvoie une barre de progression textuelle du style `████░░░░░░ 42%`.
 */
function buildProgressBar(current, target, size = 10) {
  const ratio = target > 0 ? Math.min(1, current / target) : 0;
  const filled = Math.round(ratio * size);
  const bar = '█'.repeat(filled) + '░'.repeat(size - filled);
  return `${bar} ${Math.floor(ratio * 100)}%`;
}

function numericStatFor(criteriaType, stats) {
  switch (criteriaType) {
    case 'SALES_COUNT':
    case 'FIRST_SALE':
      return stats.salesCount;
    case 'POINTS_TOTAL':
      return stats.points;
    case 'BEIGNETS_TOTAL':
      return stats.totalBeignets;
    case 'EARNED_TOTAL':
      return stats.totalEarned;
    case 'SENIORITY_DAYS':
      return stats.seniorityDays;
    case 'SALES_STREAK':
      return stats.salesStreak;
    case 'CLEAN_SALES':
      return stats.salesCount;
    default:
      return null;
  }
}

// Pastille compacte de rareté pour les listes denses (catalogue /badges).
const RARITY_DOT = { COMMON: '⚪', RARE: '🔵', EPIC: '🟣', LEGENDARY: '🟡' };

/**
 * Ligne d'affichage compacte (une seule ligne, pour tenir dans la limite de
 * 1024 caractères par field d'embed Discord) d'un badge pour /badges : pastille
 * de rareté, nom, puis statut (obtenu, ou verrouillé avec barre de progression
 * quand mesurable).
 */
function describeBadgeLine(badge, owned, stats) {
  const dot = RARITY_DOT[badge.rarity] || '⚪';
  const header = `${dot} ${badge.emoji} **${badge.name}**`;

  if (owned) return `${header} — ✅ obtenu`;

  if (badge.criteria.type === 'MANUAL') {
    return `${header} — 🔒 *attribution manuelle*`;
  }

  if (badge.criteria.type === 'GRADE_REACHED') {
    return `${header} — 🔒 *${badge.description}*`;
  }

  if (badge.criteria.type === 'CLEAN_SALES') {
    const current = Math.min(stats.salesCount, badge.criteria.value);
    const bar = buildProgressBar(current, badge.criteria.value);
    const sanctionNote = stats.sanctionsCount > 0 ? ' ⚠️ sanction au dossier' : '';
    return `${header} — 🔒 ${bar} (${current}/${badge.criteria.value})${sanctionNote}`;
  }

  const current = numericStatFor(badge.criteria.type, stats);
  if (current === null || badge.criteria.value === undefined) {
    return `${header} — 🔒 *${badge.description}*`;
  }
  const bar = buildProgressBar(current, badge.criteria.value);
  return `${header} — 🔒 ${bar} (${Math.min(current, badge.criteria.value)}/${badge.criteria.value})`;
}

/**
 * Regroupe le catalogue par catégorie (dans l'ordre BADGE_CATEGORY_ORDER),
 * chaque badge annoté de son statut/progression pour cet employé. Utilisé par
 * la commande /badges.
 */
async function getCatalogProgress(employee) {
  const [catalog, stats] = await Promise.all([getCatalog(), computeEmployeeStats(employee)]);
  const owned = new Set((employee.badges || []).map((b) => (typeof b === 'string' ? b : b.badgeId)));

  const byCategory = new Map();
  for (const badge of catalog) {
    const category = badge.category || 'SPECIAL';
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(badge);
  }

  const categories = [...byCategory.keys()].sort((a, b) => {
    const ia = BADGE_CATEGORY_ORDER.indexOf(a);
    const ib = BADGE_CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const sections = categories.map((category) => {
    const badges = byCategory.get(category);
    const lines = badges.map((badge) => describeBadgeLine(badge, owned.has(badge.badgeId), stats));
    return { category, label: BADGE_CATEGORY_LABELS[category] || category, lines };
  });

  return { sections, ownedCount: owned.size, totalCount: catalog.length };
}

module.exports = {
  seedCatalog,
  getCatalog,
  computeEmployeeStats,
  checkAndAwardBadges,
  formatBadgeList,
  getCatalogProgress,
  buildProgressBar,
};
