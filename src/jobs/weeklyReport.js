'use strict';

const StatsService = require('../services/StatsService');
const ConfigService = require('../services/ConfigService');
const { baseEmbed } = require('../utils/embeds');
const { formatMoney, formatNumber } = require('../utils/format');
const { BRAND } = require('../config/constants');

async function run(client) {
  const reportsConfig = await ConfigService.get('reports');
  if (reportsConfig.weeklyEnabled === false) return;

  const { sales, byEmployee } = await StatsService.getWeeklyStats();
  if (!sales.length) return; // rien à rapporter cette semaine

  const totalBeignets = sales.reduce((s, x) => s + x.quantity, 0);
  const totalEarned = sales.reduce((s, x) => s + x.amount, 0);
  const totalPoints = byEmployee.reduce((s, x) => s + x.points, 0);

  const employeeOfWeek = [...byEmployee].sort((a, b) => b.points - a.points)[0];

  const embed = baseEmbed()
    .setTitle(`${BRAND.EMOJI} ${BRAND.NAME}`)
    .setDescription('📊 **RAPPORT HEBDOMADAIRE**')
    .addFields(
      { name: '🍩 Beignets vendus', value: formatNumber(totalBeignets), inline: true },
      { name: '💰 Total généré', value: formatMoney(totalEarned), inline: true },
      { name: '🏆 Points distribués', value: formatNumber(totalPoints), inline: true }
    );

  if (employeeOfWeek) {
    embed.addFields({
      name: '🥇 EMPLOYÉ DE LA SEMAINE',
      value: `<@${employeeOfWeek.employeeId}>\n🍩 ${formatNumber(employeeOfWeek.beignets)} beignets\n🏆 ${formatNumber(employeeOfWeek.points)} points`,
    });
  }

  const channels = await ConfigService.getChannels();
  const channel = channels.annonces ? await client.channels.fetch(channels.annonces).catch(() => null) : null;
  if (channel) await channel.send({ embeds: [embed] }).catch(() => null);
}

module.exports = { run };
