'use strict';

const { SlashCommandBuilder } = require('discord.js');
const HelpService = require('../../services/HelpService');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Afficher la liste des commandes Lawrence Doughnuts'),

  async execute(interaction) {
    await interaction.reply({
      embeds: [HelpService.buildOverviewEmbed()],
      components: [HelpService.buildSelectRow()],
      ephemeral: true,
    });
  },
};
