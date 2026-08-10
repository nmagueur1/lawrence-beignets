'use strict';

const StatsService = require('../services/StatsService');
const ConfigService = require('../services/ConfigService');
const employeeRepo = require('../database/repositories/employeeRepo');
const LogService = require('../services/LogService');
const { baseEmbed } = require('../utils/embeds');
const { formatNumber } = require('../utils/format');
const { BRAND } = require('../config/constants');

/**
 * Score configurable : points + (beignets vendus / 10). Calculé sur les ventes
 * et points du mois écoulé (pas de cumul carrière).
 */
function computeScore(entry) {
  return entry.points + entry.beignets / 10;
}

async function run(client) {
  const { byEmployee } = await StatsService.getMonthlyStats(new Date(Date.now() - 24 * 60 * 60 * 1000));
  if (!byEmployee.length) return;

  const ranked = [...byEmployee].sort((a, b) => computeScore(b) - computeScore(a));
  const winner = ranked[0];
  if (!winner) return;

  const badgeAward = { badgeId: 'employe-du-mois', awardedAt: new Date().toISOString() };
  const employee = await employeeRepo.get(winner.employeeId);
  if (employee) {
    const badges = [...(employee.badges || []).filter((b) => (typeof b === 'string' ? b : b.badgeId) !== 'employe-du-mois'), badgeAward];
    await employeeRepo.update(winner.employeeId, { badges });
  }

  const embed = baseEmbed()
    .setTitle(`👑 ${BRAND.NAME} — EMPLOYÉ DU MOIS`)
    .setDescription(`Félicitations à <@${winner.employeeId}> !`)
    .addFields(
      { name: '🍩 Beignets vendus (mois)', value: formatNumber(winner.beignets), inline: true },
      { name: '🏆 Points (mois)', value: formatNumber(winner.points), inline: true },
      { name: '📊 Score', value: formatNumber(Math.round(computeScore(winner))), inline: true }
    );

  const channels = await ConfigService.getChannels();
  const channel = channels.annonces ? await client.channels.fetch(channels.annonces).catch(() => null) : null;
  if (channel) await channel.send({ embeds: [embed] }).catch(() => null);

  await LogService.log(client, { action: 'EMPLOYÉ DU MOIS', targetUserId: winner.employeeId });
}

module.exports = { run };
