'use strict';

const ticketRepo = require('../../database/repositories/ticketRepo');
const TicketService = require('../../services/TicketService');
const PermissionService = require('../../services/PermissionService');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'ticket:transfer:select',

  async execute(interaction) {
    const targetId = interaction.values[0];
    const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);

    if (!targetMember || !(await PermissionService.isManagerOrAbove(targetMember))) {
      throw new AppError('cible transfert invalide', { userMessage: '❌ Le membre choisi doit être Manager ou faire partie de la Direction.' });
    }

    const ticket = await ticketRepo.getByChannel(interaction.channelId);
    if (!ticket) {
      throw new AppError('ticket introuvable', { userMessage: '❌ Ticket introuvable.' });
    }

    await TicketService.transferTicket(interaction.client, interaction.channel, ticket, targetMember.user);

    await interaction.update({
      embeds: [successEmbed('🔄 Ticket transféré', `Ce ticket est désormais géré par <@${targetMember.id}>.`)],
      components: [],
    });
  },
};
