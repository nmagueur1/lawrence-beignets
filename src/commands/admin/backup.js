'use strict';

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const BackupService = require('../../services/BackupService');
const { successEmbed, baseEmbed, warningEmbed } = require('../../utils/embeds');
const { discordTimestamp } = require('../../utils/format');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Sauvegardes Firestore (Direction)')
    .addSubcommand((s) => s.setName('create').setDescription('Créer une sauvegarde'))
    .addSubcommand((s) => s.setName('list').setDescription('Lister les sauvegardes récentes'))
    .addSubcommand((s) => s.setName('restore').setDescription('Restaurer une sauvegarde').addStringOption((o) => o.setName('id').setDescription('ID de la sauvegarde').setRequired(true))),

  async execute(interaction) {
    const isDirection = await PermissionService.isDirection(interaction.member);
    if (!isDirection) throw new AppError('backup: accès refusé', { userMessage: '❌ /backup est réservé à la Direction.' });

    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });
      const meta = await BackupService.createBackup(interaction.client, interaction.user.id);
      await interaction.editReply({ embeds: [successEmbed('✅ Sauvegarde créée', `ID : \`${meta.backupId}\`\nCollections : ${meta.collections.join(', ')}`)] });
      return;
    }

    if (sub === 'list') {
      const backups = await BackupService.listBackups();
      const embed = baseEmbed()
        .setTitle('💾 Sauvegardes récentes')
        .setDescription(
          backups.length
            ? backups.map((b) => `\`${b.backupId}\` — par <@${b.createdBy}> — ${discordTimestamp(b.createdAt?.toDate ? b.createdAt.toDate() : new Date(), 'f')}`).join('\n')
            : 'Aucune sauvegarde pour le moment.'
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'restore') {
      const id = interaction.options.getString('id');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`backup:restore-confirm:${id}`).setLabel('Confirmer la restauration').setEmoji('⚠️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('backup:restore-cancel').setLabel('Annuler').setEmoji('❌').setStyle(ButtonStyle.Secondary)
      );
      await interaction.reply({
        embeds: [warningEmbed('⚠️ Confirmation requise', `Restaurer la sauvegarde \`${id}\` va **écraser les données actuelles**. Cette action est irréversible. Confirmer ?`)],
        components: [row],
        ephemeral: true,
      });
    }
  },
};
