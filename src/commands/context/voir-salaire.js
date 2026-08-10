'use strict';

const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const PayrollService = require('../../services/PayrollService');
const EmployeeService = require('../../services/EmployeeService');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new ContextMenuCommandBuilder().setName('💰 Voir salaire').setType(ApplicationCommandType.User),

  async execute(interaction) {
    const targetUser = interaction.targetUser;
    if (targetUser.id !== interaction.user.id) {
      const allowed = await PermissionService.isManagerOrAbove(interaction.member);
      if (!allowed) throw new AppError('salaire: accès refusé', { userMessage: '❌ Tu ne peux consulter que ta propre situation de paie.' });
    }

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Doughnuts enregistré." });

    const embed = await PayrollService.buildSalaireEmbed(employee, targetUser);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
