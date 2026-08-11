'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const EmployeeService = require('../../services/EmployeeService');
const { successEmbed } = require('../../utils/embeds');
const { GRADES, GRADE_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('employe')
    .setDescription('Gérer les employés Lawrence Beignets')
    .addSubcommand((s) =>
      s
        .setName('ajouter')
        .setDescription("Enregistrer manuellement un employé déjà présent sur le serveur (sans passer par une candidature)")
        .addUserOption((o) => o.setName('membre').setDescription('Membre à enregistrer').setRequired(true))
        .addStringOption((o) =>
          o
            .setName('grade')
            .setDescription('Grade (par défaut : NOVICE)')
            .setRequired(false)
            .addChoices(...Object.entries(GRADE_LABELS).map(([value, name]) => ({ name, value })))
        )
        .addStringOption((o) => o.setName('prenom_rp').setDescription('Prénom RP (optionnel)').setRequired(false))
        .addStringOption((o) => o.setName('nom_rp').setDescription('Nom RP (optionnel)').setRequired(false))
        .addStringOption((o) => o.setName('id_rp').setDescription('ID RP (optionnel)').setRequired(false))
    ),

  async execute(interaction) {
    const canManage = await PermissionService.isManagerOrAbove(interaction.member);
    if (!canManage) {
      throw new AppError('employe ajouter: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent enregistrer un employé.' });
    }

    const targetUser = interaction.options.getUser('membre');
    const grade = interaction.options.getString('grade') || GRADES.NOVICE;
    const prenomRp = interaction.options.getString('prenom_rp');
    const nomRp = interaction.options.getString('nom_rp');
    const idRp = interaction.options.getString('id_rp');

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      throw new AppError('membre introuvable', { userMessage: "❌ Ce membre n'est plus sur le serveur." });
    }

    const alreadyRegistered = await EmployeeService.isEmployeeRegistered(targetUser.id);
    if (alreadyRegistered) {
      throw new AppError('déjà employé', {
        userMessage: `⚠️ <@${targetUser.id}> est déjà enregistré comme employé. Utilise \`/promotion\` ou \`/retrogradation\` pour changer son grade.`,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const employee = await EmployeeService.manualRegisterEmployee(
      interaction.client,
      interaction.guild,
      targetMember,
      { grade, prenomRp, nomRp, idRp },
      interaction.user.id
    );

    await interaction.editReply({
      embeds: [
        successEmbed('✅ Employé enregistré', null).addFields(
          { name: 'Membre', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Grade', value: GRADE_LABELS[grade], inline: true },
          { name: 'Salon de paie', value: employee.payChannelId ? `<#${employee.payChannelId}>` : '—', inline: true }
        ),
      ],
    });
  },
};
