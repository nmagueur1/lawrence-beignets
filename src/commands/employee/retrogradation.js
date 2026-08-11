'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const EmployeeService = require('../../services/EmployeeService');
const { successEmbed } = require('../../utils/embeds');
const { GRADE_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retrogradation')
    .setDescription('Rétrograder un employé (Direction uniquement)')
    .addUserOption((o) => o.setName('employe').setDescription('Employé concerné').setRequired(true))
    .addStringOption((o) =>
      o
        .setName('grade')
        .setDescription('Nouveau grade')
        .setRequired(true)
        .addChoices(...Object.entries(GRADE_LABELS).map(([value, name]) => ({ name, value })))
    ),

  async execute(interaction) {
    const canDemote = await PermissionService.canDemote(interaction.member);
    if (!canDemote) {
      throw new AppError('retrogradation: accès refusé', { userMessage: '❌ Seule la Direction peut rétrograder un employé.' });
    }

    const targetUser = interaction.options.getUser('employe');
    const newGrade = interaction.options.getString('grade');

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) throw new AppError('membre introuvable', { userMessage: "❌ Ce membre n'est plus sur le serveur." });

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Beignets enregistré." });

    await EmployeeService.changeGrade(interaction.client, targetMember, newGrade, interaction.user.id);

    await interaction.reply({
      embeds: [successEmbed('📉 Rétrogradation effectuée', `<@${targetUser.id}> est désormais **${GRADE_LABELS[newGrade]}**.`)],
    });
  },
};
