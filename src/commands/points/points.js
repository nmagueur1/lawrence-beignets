'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const PointService = require('../../services/PointService');
const EmployeeService = require('../../services/EmployeeService');
const { baseEmbed } = require('../../utils/embeds');
const { paginate, buildPaginationRow } = require('../../utils/pagination');
const { AppError } = require('../../utils/errors');

async function assertAccess(interaction, targetId) {
  if (targetId === interaction.user.id) return;
  const allowed = await PermissionService.isManagerOrAbove(interaction.member);
  if (!allowed) {
    throw new AppError('points: accès refusé', { userMessage: '❌ Tu ne peux consulter que tes propres points.' });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('points')
    .setDescription('Consulter les points')
    .addSubcommand((s) =>
      s.setName('voir').setDescription('Afficher le total de points').addUserOption((o) => o.setName('employe').setDescription('Employé (par défaut : toi-même)').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('historique')
        .setDescription("Afficher l'historique des points")
        .addUserOption((o) => o.setName('employe').setDescription('Employé (par défaut : toi-même)').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('employe') || interaction.user;
    await assertAccess(interaction, targetUser.id);

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) {
      throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Beignets enregistré." });
    }

    if (sub === 'voir') {
      await interaction.reply({ embeds: [PointService.buildPointsEmbed(employee, targetUser)], ephemeral: true });
      return;
    }

    const history = await PointService.getHistory(targetUser.id);
    if (!history.length) {
      await interaction.reply({ embeds: [baseEmbed().setTitle('🏆 Historique des points').setDescription('Aucun mouvement pour le moment.')], ephemeral: true });
      return;
    }

    const { slice, page, totalPages } = paginate(history, 0);
    const embed = baseEmbed()
      .setTitle(`🏆 Historique des points — ${targetUser.username}`)
      .setDescription(slice.map((e) => PointService.buildPointHistoryLine(e)).join('\n'))
      .setFooter({ text: `Page ${page + 1}/${totalPages}` });

    const components = totalPages > 1 ? [buildPaginationRow('pointshist', targetUser.id, page, totalPages)] : [];
    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  },
};
