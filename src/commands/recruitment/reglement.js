'use strict';

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const ConfigService = require('../../services/ConfigService');
const PanelService = require('../../services/PanelService');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reglement')
    .setDescription('Gérer le règlement de Lawrence Doughnuts')
    .addSubcommand((sub) => sub.setName('voir').setDescription('Afficher le règlement actuel'))
    .addSubcommand((sub) => sub.setName('modifier').setDescription('Modifier le règlement (Direction uniquement)')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'voir') {
      const reglementConfig = await ConfigService.get('reglement');
      await interaction.reply({
        ...PanelService.buildReglementEmbed(reglementConfig?.content),
        ephemeral: true,
      });
      return;
    }

    if (sub === 'modifier') {
      const isDirection = await PermissionService.isDirection(interaction.member);
      if (!isDirection) {
        throw new AppError('reglement modifier: accès refusé', {
          userMessage: '❌ Seule la Direction peut modifier le règlement.',
        });
      }

      const reglementConfig = await ConfigService.get('reglement');

      const modal = new ModalBuilder().setCustomId('reglement:modifier').setTitle('Modifier le règlement');
      const input = new TextInputBuilder()
        .setCustomId('content')
        .setLabel('Contenu du règlement')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(4000)
        .setValue(reglementConfig?.content || '');

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
    }
  },
};
