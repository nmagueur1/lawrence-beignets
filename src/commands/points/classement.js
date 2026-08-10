'use strict';

const { SlashCommandBuilder } = require('discord.js');
const employeeRepo = require('../../database/repositories/employeeRepo');
const { baseEmbed } = require('../../utils/embeds');
const { formatMoney, formatNumber } = require('../../utils/format');
const { BRAND } = require('../../config/constants');

const MEDALS = ['🥇', '🥈', '🥉'];

function medal(index) {
  return MEDALS[index] || `${index + 1}.`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('classement')
    .setDescription('Afficher un classement Lawrence Doughnuts')
    .addSubcommand((s) => s.setName('points').setDescription('Top points'))
    .addSubcommand((s) => s.setName('ventes').setDescription('Top beignets vendus'))
    .addSubcommand((s) => s.setName('gains').setDescription('Top gains générés')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const employees = await employeeRepo.listAllActive();

    let field, title, emoji, formatter;
    if (sub === 'points') {
      field = 'points'; title = 'Top points'; emoji = '🏆'; formatter = formatNumber;
    } else if (sub === 'ventes') {
      field = 'totalBeignets'; title = 'Top beignets vendus'; emoji = '🍩'; formatter = formatNumber;
    } else {
      field = 'totalEarned'; title = 'Top gains'; emoji = '💰'; formatter = formatMoney;
    }

    const sorted = [...employees].sort((a, b) => (b[field] || 0) - (a[field] || 0)).slice(0, 10);

    const embed = baseEmbed()
      .setTitle(`${emoji} ${BRAND.NAME} — ${title}`)
      .setDescription(
        sorted.length
          ? sorted.map((e, i) => `${medal(i)} <@${e.discordId}> — **${formatter(e[field] || 0)}**`).join('\n')
          : 'Aucune donnée disponible.'
      );

    await interaction.reply({ embeds: [embed] });
  },
};
