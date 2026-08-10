'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, UserSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const ticketRepo = require('../../database/repositories/ticketRepo');
const TicketService = require('../../services/TicketService');
const PermissionService = require('../../services/PermissionService');
const { successEmbed, warningEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

async function getTicketOrThrow(channelId) {
  const ticket = await ticketRepo.getByChannel(channelId);
  if (!ticket) {
    throw new AppError('ticket introuvable', { userMessage: '❌ Ce salon ne correspond à aucun ticket enregistré.' });
  }
  return ticket;
}

module.exports = {
  customId: 'ticket',

  async execute(interaction) {
    const parts = interaction.customId.split(':');
    const action = parts[1];

    const canManage = await PermissionService.canManageTickets(interaction.member);
    if (!canManage) {
      throw new AppError('ticket: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent gérer les tickets.' });
    }

    if (action === 'claim') {
      const ticket = await getTicketOrThrow(interaction.channelId);
      await TicketService.claimTicket(interaction.client, interaction.channel, ticket, interaction.user);
      await interaction.reply({ embeds: [successEmbed('👤 Ticket pris en charge', `Pris en charge par <@${interaction.user.id}>.`)] });
      return;
    }

    if (action === 'priority') {
      const ticket = await getTicketOrThrow(interaction.channelId);
      const updated = await TicketService.togglePriority(interaction.client, interaction.channel, ticket, interaction.user);
      await interaction.reply({
        embeds: [successEmbed('📌 Priorité mise à jour', updated.priority ? 'Ce ticket est désormais **prioritaire**.' : 'Ce ticket n\'est plus prioritaire.')],
      });
      return;
    }

    if (action === 'transfer') {
      const select = new UserSelectMenuBuilder().setCustomId('ticket:transfer:select').setPlaceholder('Choisis le nouveau responsable').setMinValues(1).setMaxValues(1);
      await interaction.reply({
        embeds: [warningEmbed('🔄 Transférer le ticket', 'Sélectionne le Manager ou membre de la Direction à qui transférer ce ticket.')],
        components: [new ActionRowBuilder().addComponents(select)],
        ephemeral: true,
      });
      return;
    }

    if (action === 'close') {
      if (parts[2] === 'confirm') {
        const ticket = await getTicketOrThrow(interaction.channelId);
        await interaction.update({ embeds: [successEmbed('🔒 Fermeture en cours...', 'Le transcript est en cours de génération.')], components: [] });
        await TicketService.closeTicket(interaction.client, interaction.channel, ticket, interaction.user, 'Fermé via le bouton');
        return;
      }
      if (parts[2] === 'cancel') {
        await interaction.update({ embeds: [successEmbed('❌ Fermeture annulée', 'Le ticket reste ouvert.')], components: [] });
        return;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket:close:confirm').setLabel('Confirmer la fermeture').setEmoji('✅').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket:close:cancel').setLabel('Annuler').setEmoji('❌').setStyle(ButtonStyle.Secondary)
      );
      await interaction.reply({
        embeds: [warningEmbed('⚠️ Confirmation', 'Fermer ce ticket ? Un transcript sera généré et le salon supprimé.')],
        components: [row],
        ephemeral: true,
      });
    }
  },
};
