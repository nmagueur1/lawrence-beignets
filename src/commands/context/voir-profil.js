'use strict';

const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const EmployeeService = require('../../services/EmployeeService');
const profilCommand = require('../employee/profil');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('🍩 Voir profil Lawrence').setType(ApplicationCommandType.User),

  async execute(interaction) {
    const targetUser = interaction.targetUser;
    await profilCommand.assertAccess(interaction, targetUser.id);

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Doughnuts enregistré." });

    const embed = await profilCommand.buildProfilEmbed(employee, targetUser);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
