'use strict';

const DashboardService = require('../../services/DashboardService');
const PermissionService = require('../../services/PermissionService');
const { buildRow } = require('../../commands/utility/dashboard');
const { AppError } = require('../../utils/errors');

const BUILDERS = {
  employes: DashboardService.buildEmployeesEmbed,
  ventes: DashboardService.buildVentesEmbed,
  paies: DashboardService.buildPaiesEmbed,
  points: DashboardService.buildPointsEmbed,
};

module.exports = {
  customId: 'dashboard',

  async execute(interaction) {
    const [, action] = interaction.customId.split(':');

    const allowed = await PermissionService.isManagerOrAbove(interaction.member);
    if (!allowed) throw new AppError('dashboard: accès refusé', { userMessage: '❌ Accès refusé.' });

    const builder = BUILDERS[action];
    if (!builder) return;

    const embed = await builder();
    await interaction.update({ embeds: [embed], components: [buildRow()] });
  },
};
