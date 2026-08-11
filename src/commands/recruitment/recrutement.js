'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const RecruitmentService = require('../../services/RecruitmentService');
const ConfigService = require('../../services/ConfigService');
const PanelService = require('../../services/PanelService');
const LogService = require('../../services/LogService');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

async function refreshPanel(client) {
  const channels = await ConfigService.getChannels();
  const open = await RecruitmentService.getStatus();
  await PanelService.postOrUpdate(client, channels.recrutementOn, 'recrutementPanelId', RecruitmentService.buildRecruitmentPanel(open));
  return open;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recrutement')
    .setDescription('Gérer le statut du recrutement Lawrence Beignets')
    .addSubcommand((s) => s.setName('ouvrir').setDescription('Ouvrir le recrutement'))
    .addSubcommand((s) => s.setName('fermer').setDescription('Fermer le recrutement'))
    .addSubcommand((s) => s.setName('statut').setDescription('Afficher le statut du recrutement')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'statut') {
      const open = await RecruitmentService.getStatus();
      await interaction.reply({
        embeds: [successEmbed('📋 Statut du recrutement', open ? '🟢 Recrutement **ouvert**' : '🔴 Recrutement **fermé**')],
        ephemeral: true,
      });
      return;
    }

    const isDirection = await PermissionService.isDirection(interaction.member);
    if (!isDirection) {
      throw new AppError('recrutement: accès refusé', { userMessage: '❌ Seule la Direction peut modifier le statut du recrutement.' });
    }

    await interaction.deferReply({ ephemeral: true });

    if (sub === 'ouvrir') await RecruitmentService.setStatus(true);
    if (sub === 'fermer') await RecruitmentService.setStatus(false);

    const open = await refreshPanel(interaction.client);

    await LogService.log(interaction.client, {
      action: sub === 'ouvrir' ? 'RECRUTEMENT OUVERT' : 'RECRUTEMENT FERMÉ',
      actorId: interaction.user.id,
    });

    await interaction.editReply({
      embeds: [successEmbed('✅ Statut mis à jour', open ? '🟢 Le recrutement est désormais **ouvert**.' : '🔴 Le recrutement est désormais **fermé**.')],
    });
  },
};
