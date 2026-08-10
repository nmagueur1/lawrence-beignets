'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const tempCache = require('../../utils/tempCache');
const { baseEmbed } = require('../../utils/embeds');

module.exports = {
  customId: 'candidature:step1',

  async execute(interaction) {
    const data = {
      prenomRp: interaction.fields.getTextInputValue('prenomRp'),
      nomRp: interaction.fields.getTextInputValue('nomRp'),
      idRp: interaction.fields.getTextInputValue('idRp'),
      ageRp: interaction.fields.getTextInputValue('ageRp'),
      experience: interaction.fields.getTextInputValue('experience'),
    };

    tempCache.set(`candidature:${interaction.user.id}`, data);

    // Discord ne permet pas d'ouvrir un modal directement en réponse au submit
    // d'un autre modal : on passe par un bouton intermédiaire (étape 2/2).
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('candidature:continue').setLabel('Continuer (étape 2/2)').setEmoji('➡️').setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [baseEmbed().setTitle('✅ Étape 1/2 enregistrée').setDescription('Clique sur le bouton ci-dessous pour terminer ta candidature.')],
      components: [row],
      ephemeral: true,
    });
  },
};
