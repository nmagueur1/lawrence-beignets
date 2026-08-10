'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const PayrollService = require('../../services/PayrollService');
const EmployeeService = require('../../services/EmployeeService');
const { baseEmbed } = require('../../utils/embeds');
const { paginate, buildPaginationRow } = require('../../utils/pagination');
const { AppError } = require('../../utils/errors');

async function assertAccess(interaction, targetId) {
  if (targetId === interaction.user.id) return;
  const allowed = await PermissionService.isManagerOrAbove(interaction.member);
  if (!allowed) {
    throw new AppError('salaire: accès refusé', { userMessage: '❌ Tu ne peux consulter que ta propre situation de paie.' });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('salaire')
    .setDescription('Consulter la situation de paie')
    .addSubcommand((s) =>
      s
        .setName('voir')
        .setDescription('Afficher la situation de paie actuelle')
        .addUserOption((o) => o.setName('employe').setDescription('Employé concerné (par défaut : toi-même)').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('historique')
        .setDescription("Afficher l'historique des ventes et paiements")
        .addUserOption((o) => o.setName('employe').setDescription('Employé concerné (par défaut : toi-même)').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('employe') || interaction.user;

    await assertAccess(interaction, targetUser.id);

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) {
      throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Doughnuts enregistré." });
    }

    if (sub === 'voir') {
      const embed = await PayrollService.buildSalaireEmbed(employee, targetUser);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // historique
    const history = await PayrollService.getHistory(targetUser.id);
    if (!history.length) {
      await interaction.reply({ embeds: [baseEmbed().setTitle('📜 Historique').setDescription('Aucune transaction pour le moment.')], ephemeral: true });
      return;
    }

    const { slice, page, totalPages } = paginate(history, 0);
    const embed = baseEmbed()
      .setTitle(`📜 Historique — ${targetUser.username}`)
      .setDescription(slice.map((entry) => PayrollService.buildHistoryLine(entry)).join('\n'))
      .setFooter({ text: `Page ${page + 1}/${totalPages}` });

    const components = totalPages > 1 ? [buildPaginationRow('salairehist', targetUser.id, page, totalPages)] : [];
    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  },
};
