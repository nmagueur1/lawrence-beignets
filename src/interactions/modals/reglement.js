'use strict';

const ConfigService = require('../../services/ConfigService');
const PanelService = require('../../services/PanelService');
const LogService = require('../../services/LogService');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
  customId: 'reglement:modifier',

  async execute(interaction) {
    const content = interaction.fields.getTextInputValue('content');
    await ConfigService.set('reglement', { content, updatedBy: interaction.user.id, updatedAt: new Date().toISOString() });

    const channels = await ConfigService.getChannels();
    await PanelService.postOrUpdate(
      interaction.client,
      channels.reglement,
      'reglementMessageId',
      PanelService.buildReglementEmbed(content)
    );

    await LogService.log(interaction.client, {
      action: 'RÈGLEMENT MODIFIÉ',
      actorId: interaction.user.id,
    });

    await interaction.reply({
      embeds: [successEmbed('✅ Règlement mis à jour', 'Le salon #règlement a été actualisé.')],
      ephemeral: true,
    });
  },
};
