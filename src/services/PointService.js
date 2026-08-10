'use strict';

const pointRuleRepo = require('../database/repositories/pointRuleRepo');
const pointRepo = require('../database/repositories/pointRepo');
const { POINT_RULE_TYPE, BRAND } = require('../config/constants');
const { baseEmbed } = require('../utils/embeds');
const { formatNumber, discordTimestamp } = require('../utils/format');

/**
 * Modèle retenu : palier déclenché PAR VENTE INDIVIDUELLE (pas de cumul carrière).
 * On prend, parmi les règles activées de type SALE_THRESHOLD dont le seuil est
 * atteint par la quantité vendue, celle dont le seuil est le plus élevé.
 */
async function getApplicableRule(quantity) {
  const rules = await pointRuleRepo.listEnabledByType(POINT_RULE_TYPE.SALE_THRESHOLD);
  const eligible = rules.filter((r) => quantity >= r.threshold);
  if (!eligible.length) return null;
  return eligible.reduce((best, r) => (r.threshold > best.threshold ? r : best), eligible[0]);
}

async function getHistory(employeeId) {
  return pointRepo.listByEmployee(employeeId);
}

async function listRules() {
  return pointRuleRepo.listAll();
}

async function createRule(data) {
  return pointRuleRepo.create(data);
}

async function updateRule(id, data) {
  const rule = await pointRuleRepo.get(id);
  if (!rule) return null;
  await pointRuleRepo.update(id, data);
  return pointRuleRepo.get(id);
}

async function deleteRule(id) {
  await pointRuleRepo.remove(id);
}

function buildPointsEmbed(employee, user) {
  return baseEmbed()
    .setTitle(`🏆 ${BRAND.NAME} — Points`)
    .setThumbnail(user?.displayAvatarURL ? user.displayAvatarURL() : null)
    .addFields(
      { name: '👤 Employé', value: `<@${employee.discordId}>`, inline: true },
      { name: '🏆 Points totaux', value: formatNumber(employee.points || 0), inline: true }
    );
}

function buildPointHistoryLine(entry) {
  const date = discordTimestamp(entry.createdAt?.toDate ? entry.createdAt.toDate() : entry.createdAt, 'd');
  const sign = entry.amount >= 0 ? '+' : '';
  return `🏆 **${sign}${entry.amount}** — ${entry.reason || entry.type} · ${date}`;
}

function buildRuleLine(rule) {
  return `\`${rule.id}\` — **${rule.name}** — dès ${formatNumber(rule.threshold)} beignets → +${rule.points} pts ${rule.enabled ? '✅' : '⛔ désactivée'}`;
}

module.exports = {
  getApplicableRule,
  getHistory,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  buildPointsEmbed,
  buildPointHistoryLine,
  buildRuleLine,
};
