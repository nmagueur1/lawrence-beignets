'use strict';

const TicketService = require('../../services/TicketService');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
  customId: 'contact:categorie',

  async execute(interaction) {
    const category = interaction.values[0];

    await interaction.deferUpdate();

    const { channel } = await TicketService.createTicket(interaction.guild, interaction.user, category);

    await interaction.editReply({
      embeds: [successEmbed('✅ Ticket créé', `Ton ticket a été créé : ${channel}`)],
      components: [],
    });
  },
};
