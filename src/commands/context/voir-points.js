'use strict';

const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const PointService = require('../../services/PointService');
const EmployeeService = require('../../services/EmployeeService');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('🏆 Voir points').setType(ApplicationCommandType.User),

  async execute(interaction) {
    const targetUser = interaction.targetUser;
    if (targetUser.id !== interaction.user.id) {
      const allowed = await PermissionService.isManagerOrAbove(interaction.member);
      if (!allowed) throw new AppError('points: accès refusé', { userMessage: '❌ Tu ne peux consulter que tes propres points.' });
    }

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Beignets enregistré." });

    await interaction.reply({ embeds: [PointService.buildPointsEmbed(employee, targetUser)], ephemeral: true });
  },
};
