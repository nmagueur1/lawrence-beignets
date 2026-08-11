'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const SanctionService = require('../../services/SanctionService');
const EmployeeService = require('../../services/EmployeeService');
const { successEmbed } = require('../../utils/embeds');
const { SANCTION_TYPE, SANCTION_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sanction')
    .setDescription('Émettre une sanction envers un employé')
    .addUserOption((o) => o.setName('employe').setDescription('Employé concerné').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('type')
        .setDescription('Type de sanction')
        .setRequired(true)
        .addChoices(...Object.entries(SANCTION_LABELS).map(([value, label]) => ({ name: label, value })))
    )
    .addStringOption((o) => o.setName('motif').setDescription('Motif de la sanction').setRequired(true))
    .addStringOption((o) => o.setName('note').setDescription('Note complémentaire (optionnel)').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('employe');
    const type = interaction.options.getString('type');
    const reason = interaction.options.getString('motif');
    const note = interaction.options.getString('note');

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const canSanction = await PermissionService.canSanction(interaction.member, type);
    const canAct = targetMember ? await PermissionService.canActOn(interaction.member, targetMember) : true;

    if (!canSanction || !canAct) {
      throw new AppError('sanction: accès refusé', { userMessage: '❌ Tu n\'es pas autorisé à émettre ce type de sanction sur cet employé.' });
    }

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) {
      throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Beignets enregistré." });
    }

    const sanction = await SanctionService.issueSanction(interaction.client, {
      employeeId: targetUser.id,
      issuedBy: interaction.user.id,
      type,
      reason,
      note,
    });

    await interaction.reply({
      embeds: [
        successEmbed('⚠️ Sanction émise', null).addFields(
          { name: 'Employé', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Type', value: SANCTION_LABELS[type], inline: true },
          { name: 'Motif', value: reason },
          { name: 'ID', value: `\`${sanction.sanctionId}\``, inline: true }
        ),
      ],
      ephemeral: true,
    });
  },
};
