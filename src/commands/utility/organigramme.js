'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const OrgService = require('../../services/OrgService');
const ConfigService = require('../../services/ConfigService');
const PanelService = require('../../services/PanelService');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder().setName('organigramme').setDescription('Actualiser l\'organigramme Lawrence Beignets'),

  async execute(interaction) {
    const allowed = await PermissionService.isManagerOrAbove(interaction.member);
    if (!allowed) throw new AppError('organigramme: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent actualiser l\'organigramme.' });

    await interaction.deferReply({ ephemeral: true });

    const embed = await OrgService.buildOrganigrammeEmbed(interaction.guild);
    const channels = await ConfigService.getChannels();
    await PanelService.postOrUpdate(interaction.client, channels.organigramme, 'organigrammeMessageId', { embeds: [embed] });

    await interaction.editReply({ content: '✅ Organigramme actualisé.' });
  },
};
