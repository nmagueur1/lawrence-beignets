'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const LogService = require('../../services/LogService');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');
const { ensureCategory } = require('../../utils/guildStructure');
const { CV_CATEGORY_NAME } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cv-categorie')
    .setDescription('Crée (si besoin) la catégorie Discord dédiée à l\'archivage des CV mis en attente')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const isStaff = await PermissionService.isManagerOrAbove(interaction.member);
    if (!isStaff) {
      throw new AppError('cv-categorie: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent utiliser cette commande.' });
    }

    await interaction.deferReply({ ephemeral: true });

    const existed = interaction.guild.channels.cache.some(
      (c) => c.type === ChannelType.GuildCategory && c.name === CV_CATEGORY_NAME
    );

    const category = await ensureCategory(interaction.guild, CV_CATEGORY_NAME);

    await LogService.log(interaction.client, {
      action: 'CATÉGORIE CV CONFIGURÉE',
      actorId: interaction.user.id,
      details: { Catégorie: category.name, Statut: existed ? 'Déjà existante' : 'Créée' },
    });

    await interaction.editReply({
      embeds: [
        successEmbed(
          existed ? '✅ Catégorie CV déjà en place' : '✅ Catégorie CV créée',
          `${existed ? 'La catégorie' : 'La catégorie a été créée'} **${category.name}** ${existed ? 'existe déjà et' : ''} sera utilisée automatiquement pour archiver les CV des candidatures mises en attente (bouton « Mettre en attente »).`
        ),
      ],
    });
  },
};
