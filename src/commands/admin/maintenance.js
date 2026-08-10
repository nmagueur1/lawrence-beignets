'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const ConfigService = require('../../services/ConfigService');
const LogService = require('../../services/LogService');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('Activer/désactiver le mode maintenance (Direction)')
    .addSubcommand((s) => s.setName('on').setDescription('Activer la maintenance'))
    .addSubcommand((s) => s.setName('off').setDescription('Désactiver la maintenance')),

  async execute(interaction) {
    const isDirection = await PermissionService.isDirection(interaction.member);
    if (!isDirection) throw new AppError('maintenance: accès refusé', { userMessage: '❌ Seule la Direction peut gérer le mode maintenance.' });

    const sub = interaction.options.getSubcommand();
    const enabled = sub === 'on';
    await ConfigService.set('maintenance', { enabled });

    await LogService.log(interaction.client, { action: enabled ? 'MAINTENANCE ACTIVÉE' : 'MAINTENANCE DÉSACTIVÉE', actorId: interaction.user.id });

    await interaction.reply({
      embeds: [successEmbed(enabled ? '🔧 Maintenance activée' : '✅ Maintenance désactivée', enabled ? 'Seule la Direction peut désormais utiliser le bot.' : 'Le bot est de nouveau accessible à tous.')],
      ephemeral: true,
    });
  },
};
