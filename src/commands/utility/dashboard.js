'use strict';

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const DashboardService = require('../../services/DashboardService');
const { AppError } = require('../../utils/errors');

function buildRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('dashboard:employes').setLabel('Employés').setEmoji('👥').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('dashboard:ventes').setLabel('Ventes').setEmoji('🍩').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('dashboard:paies').setLabel('Paies').setEmoji('💰').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('dashboard:points').setLabel('Points').setEmoji('🏆').setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  data: new SlashCommandBuilder().setName('dashboard').setDescription('Tableau de bord Lawrence Beignets (Management)'),
  buildRow,

  async execute(interaction) {
    const allowed = await PermissionService.isManagerOrAbove(interaction.member);
    if (!allowed) throw new AppError('dashboard: accès refusé', { userMessage: '❌ Le dashboard est réservé aux Managers et à la Direction.' });

    const embed = await DashboardService.buildMainEmbed();
    await interaction.reply({ embeds: [embed], components: [buildRow()], ephemeral: true });
  },
};
