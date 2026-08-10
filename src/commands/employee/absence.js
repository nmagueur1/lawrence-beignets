'use strict';

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const AbsenceService = require('../../services/AbsenceService');
const { baseEmbed } = require('../../utils/embeds');
const { ABSENCE_STATUS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

const STATUS_LABELS = { PENDING: '🕐 En attente', ACCEPTED: '✅ Acceptée', REFUSED: '❌ Refusée' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('absence')
    .setDescription('Gérer les demandes d\'absence')
    .addSubcommand((s) => s.setName('demander').setDescription('Faire une demande d\'absence'))
    .addSubcommand((s) =>
      s.setName('historique').setDescription('Consulter l\'historique des absences').addUserOption((o) => o.setName('employe').setDescription('Employé (par défaut : toi-même)').setRequired(false))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'demander') {
      const modal = new ModalBuilder().setCustomId('absence:demander').setTitle('Demande d\'absence');
      const fields = [
        ['startDate', 'Date de début (JJ/MM/AAAA)', TextInputStyle.Short],
        ['endDate', 'Date de fin (JJ/MM/AAAA)', TextInputStyle.Short],
        ['reason', 'Motif', TextInputStyle.Short],
        ['comment', 'Commentaire (optionnel)', TextInputStyle.Paragraph],
      ];
      for (const [id, label, style] of fields) {
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(style).setRequired(id !== 'comment').setMaxLength(500)
          )
        );
      }
      await interaction.showModal(modal);
      return;
    }

    // historique
    const targetUser = interaction.options.getUser('employe') || interaction.user;
    if (targetUser.id !== interaction.user.id) {
      const allowed = await PermissionService.isManagerOrAbove(interaction.member);
      if (!allowed) throw new AppError('absence: accès refusé', { userMessage: '❌ Tu ne peux consulter que tes propres absences.' });
    }

    const history = await AbsenceService.getHistory(targetUser.id);
    const embed = baseEmbed()
      .setTitle(`📅 Absences — ${targetUser.username}`)
      .setDescription(
        history.length
          ? history.map((a) => `${STATUS_LABELS[a.status]} — ${a.startDate} → ${a.endDate} — ${a.reason}`).join('\n')
          : 'Aucune demande d\'absence.'
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
