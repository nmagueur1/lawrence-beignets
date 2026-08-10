'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const NoteService = require('../../services/NoteService');
const { successEmbed, baseEmbed } = require('../../utils/embeds');
const { NOTE_TYPE, NOTE_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Notes internes staff sur un employé (visibles uniquement par le staff)')
    .addSubcommand((s) =>
      s
        .setName('ajouter')
        .setDescription('Ajouter une note')
        .addUserOption((o) => o.setName('employe').setDescription('Employé concerné').setRequired(true))
        .addStringOption((o) =>
          o.setName('type').setDescription('Type de note').setRequired(true).addChoices(...Object.entries(NOTE_LABELS).map(([value, name]) => ({ name, value })))
        )
        .addStringOption((o) => o.setName('contenu').setDescription('Contenu de la note').setRequired(true))
    )
    .addSubcommand((s) => s.setName('liste').setDescription('Lister les notes d\'un employé').addUserOption((o) => o.setName('employe').setDescription('Employé concerné').setRequired(true))),

  async execute(interaction) {
    const canManage = await PermissionService.isManagerOrAbove(interaction.member);
    if (!canManage) {
      throw new AppError('note: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent gérer les notes internes.' });
    }

    const sub = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('employe');

    if (sub === 'ajouter') {
      const type = interaction.options.getString('type');
      const content = interaction.options.getString('contenu');
      await NoteService.addNote({ employeeId: targetUser.id, authorId: interaction.user.id, type, content });
      await interaction.reply({ embeds: [successEmbed('✅ Note ajoutée', `Note ${NOTE_LABELS[type]} ajoutée pour <@${targetUser.id}>.`)], ephemeral: true });
      return;
    }

    const notes = await NoteService.getNotes(targetUser.id);
    const embed = baseEmbed()
      .setTitle(`📝 Notes internes — ${targetUser.username}`)
      .setDescription(notes.length ? notes.map((n) => NoteService.buildNoteLine(n)).join('\n') : 'Aucune note.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
