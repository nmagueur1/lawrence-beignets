'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const ConfigService = require('../../services/ConfigService');
const LogService = require('../../services/LogService');
const { baseEmbed, successEmbed } = require('../../utils/embeds');
const { BRAND } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

const CATEGORIES = {
  INFO: '📢 Information',
  ENTREPRISE: '🍩 Entreprise',
  RESULTAT: '🏆 Résultat',
  IMPORTANT: '⚠️ Important',
  EVENEMENT: '📅 Événement',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('annonce')
    .setDescription('Publier une annonce officielle Lawrence Doughnuts')
    .addStringOption((o) => o.setName('titre').setDescription('Titre de l\'annonce').setRequired(true))
    .addStringOption((o) => o.setName('description').setDescription('Contenu de l\'annonce').setRequired(true))
    .addStringOption((o) =>
      o.setName('categorie').setDescription('Catégorie').setRequired(true).addChoices(...Object.entries(CATEGORIES).map(([value, name]) => ({ name, value })))
    )
    .addStringOption((o) => o.setName('image').setDescription('URL d\'une image (optionnel)').setRequired(false))
    .addStringOption((o) =>
      o
        .setName('mention')
        .setDescription('Mention (optionnel)')
        .setRequired(false)
        .addChoices({ name: '@everyone', value: 'everyone' }, { name: '@here', value: 'here' })
    ),

  async execute(interaction) {
    const allowed = await PermissionService.isManagerOrAbove(interaction.member);
    if (!allowed) throw new AppError('annonce: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent publier une annonce.' });

    const title = interaction.options.getString('titre');
    const description = interaction.options.getString('description');
    const category = interaction.options.getString('categorie');
    const image = interaction.options.getString('image');
    const mention = interaction.options.getString('mention');

    const channels = await ConfigService.getChannels();
    const channel = channels.annonces ? await interaction.client.channels.fetch(channels.annonces).catch(() => null) : null;
    if (!channel) throw new AppError('salon annonces introuvable', { userMessage: '❌ Le salon #annonces n\'est pas configuré. Lance /setup.' });

    const embed = baseEmbed()
      .setTitle(`${CATEGORIES[category]} — ${title}`)
      .setDescription(description)
      .setAuthor({ name: BRAND.NAME });
    if (image) embed.setImage(image);

    const content = mention === 'everyone' ? '@everyone' : mention === 'here' ? '@here' : undefined;

    await channel.send({ content, embeds: [embed] });

    await LogService.log(interaction.client, {
      action: 'ANNONCE PUBLIÉE',
      actorId: interaction.user.id,
      details: { Titre: title, Catégorie: CATEGORIES[category] },
    });

    await interaction.reply({ embeds: [successEmbed('✅ Annonce publiée', `Publiée dans ${channel}.`)], ephemeral: true });
  },
};
