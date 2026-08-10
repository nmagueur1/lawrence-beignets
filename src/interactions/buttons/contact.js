'use strict';

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const { TICKET_CATEGORY_LABELS } = require('../../config/constants');

module.exports = {
  customId: 'contact',

  async execute(interaction) {
    if (interaction.customId !== 'contact:ouvrir') return;

    const select = new StringSelectMenuBuilder()
      .setCustomId('contact:categorie')
      .setPlaceholder('Choisis une catégorie')
      .addOptions(
        Object.entries(TICKET_CATEGORY_LABELS).map(([value, meta]) => ({
          label: meta.label,
          value,
          emoji: meta.emoji,
        }))
      );

    await interaction.reply({
      embeds: [baseEmbed().setTitle('📩 Nous contacter').setDescription('Sélectionne la catégorie qui correspond à ta demande.')],
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true,
    });
  },
};
