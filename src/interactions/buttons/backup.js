'use strict';

const PermissionService = require('../../services/PermissionService');
const BackupService = require('../../services/BackupService');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'backup',

  async execute(interaction) {
    const isDirection = await PermissionService.isDirection(interaction.member);
    if (!isDirection) throw new AppError('backup: accès refusé', { userMessage: '❌ Accès refusé.' });

    const parts = interaction.customId.split(':');
    const action = parts[1];

    if (action === 'restore-cancel') {
      await interaction.update({ embeds: [successEmbed('❌ Restauration annulée', null)], components: [] });
      return;
    }

    if (action === 'restore-confirm') {
      const id = parts[2];
      await interaction.update({ embeds: [successEmbed('⏳ Restauration en cours...', 'Merci de patienter.')], components: [] });
      await BackupService.restoreBackup(interaction.client, id, interaction.user.id);
      await interaction.editReply({ embeds: [successEmbed('✅ Sauvegarde restaurée', `La sauvegarde \`${id}\` a été restaurée.`)] });
    }
  },
};
