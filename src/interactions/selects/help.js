'use strict';

const HelpService = require('../../services/HelpService');

module.exports = {
  customId: 'help:categorie',

  async execute(interaction) {
    const key = interaction.values[0];
    await interaction.update({
      embeds: [HelpService.buildCategoryEmbed(key)],
      components: [HelpService.buildSelectRow(key)],
    });
  },
};
