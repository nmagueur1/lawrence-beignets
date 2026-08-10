'use strict';

const badgeRepo = require('../database/repositories/badgeRepo');
const employeeRepo = require('../database/repositories/employeeRepo');
const saleRepo = require('../database/repositories/saleRepo');
const LogService = require('./LogService');
const { baseEmbed } = require('../utils/embeds');
const { DEFAULT_BADGES } = require('../config/constants');

async function seedCatalog() {
  return badgeRepo.ensureCatalog(DEFAULT_BADGES);
}

async function getCatalog() {
  return badgeRepo.listCatalog();
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
    default:
      return false;
  }
}

/**
 * Vérifie le catalogue de badges et attribue automatiquement ceux nouvellement
 * mérités par l'employé (appelé après chaque vente validée).
 */
async function checkAndAwardBadges(client, employee) {
  const catalog = await getCatalog();
  const owned = new Set((employee.badges || []).map((b) => (typeof b === 'string' ? b : b.badgeId)));
  const salesCount = await saleRepo.countByEmployee(employee.discordId);
  const stats = { salesCount, points: employee.points || 0, totalBeignets: employee.totalBeignets || 0 };

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
            .setDescription(newlyAwarded.map((b) => `${b.emoji} **${b.name}** — ${b.description}`).join('\n')),
        ],
      })
      .catch(() => null);
  }

  return newlyAwarded;
}

function formatBadgeList(employeeBadges, catalog) {
  if (!employeeBadges?.length) return 'Aucun badge pour le moment.';
  const byId = new Map(catalog.map((b) => [b.badgeId, b]));
  return employeeBadges
    .map((b) => {
      const id = typeof b === 'string' ? b : b.badgeId;
      const meta = byId.get(id);
      return meta ? `${meta.emoji} ${meta.name}` : id;
    })
    .join(' · ');
}

module.exports = { seedCatalog, getCatalog, checkAndAwardBadges, formatBadgeList };
