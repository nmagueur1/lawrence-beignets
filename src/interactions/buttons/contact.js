'use strict';

const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const { TICKET_CATEGORY, TICKET_CATEGORY_LABELS } = require('../../config/constants');

module.exports = {
  customId: 'contact',

  async execute(interaction) {
    if (interaction.customId !== 'contact:ouvrir') return;

    // CANDIDATURE_ATTENTE est une catégorie interne (créée automatiquement via le
    // bouton "Mettre en attente" d'une candidature) : elle ne doit jamais apparaître
    // dans le panel public de contact.
    const select = new StringSelectMenuBuilder()
      .setCustomId('contact:categorie')
      .setPlaceholder('Choisis une catégorie')
      .addOptions(
        Object.entries(TICKET_CATEGORY_LABELS)
          .filter(([value]) => value !== TICKET_CATEGORY.CANDIDATURE_ATTENTE)
          .map(([value, meta]) => ({
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
