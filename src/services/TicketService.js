'use strict';

const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const ticketRepo = require('../database/repositories/ticketRepo');
const ConfigService = require('./ConfigService');
const LogService = require('./LogService');
const { baseEmbed } = require('../utils/embeds');
const { discordTimestamp } = require('../utils/format');
const { ensureCategory } = require('../utils/guildStructure');
const { TICKET_CATEGORY_LABELS, TICKET_CATEGORY_NAME, BRAND } = require('../config/constants');

function buildTicketEmbed(ticket) {
  const meta = TICKET_CATEGORY_LABELS[ticket.category];
  const embed = baseEmbed()
    .setTitle(`📩 ${BRAND.NAME}`)
    .addFields(
      { name: 'Type', value: `${meta.emoji} ${meta.label}`, inline: true },
      { name: 'Utilisateur', value: `<@${ticket.userId}>`, inline: true },
      { name: 'Statut', value: statusLabel(ticket.status), inline: true },
      { name: 'Responsable', value: ticket.assignedTo ? `<@${ticket.assignedTo}>` : 'Non attribué', inline: true },
      { name: 'Priorité', value: ticket.priority ? '📌 Oui' : 'Non', inline: true },
      { name: 'Date', value: discordTimestamp(ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date()), inline: true }
    );
  return embed;
}

function statusLabel(status) {
  return { OPEN: '🟢 Ouvert', CLAIMED: '🟡 Pris en charge', CLOSED: '🔴 Fermé' }[status] || status;
}

function buildTicketButtons(ticket) {
  const closed = ticket.status === 'CLOSED';
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:claim').setLabel('Prendre en charge').setEmoji('👤').setStyle(ButtonStyle.Primary).setDisabled(closed),
    new ButtonBuilder().setCustomId('ticket:transfer').setLabel('Transférer').setEmoji('🔄').setStyle(ButtonStyle.Secondary).setDisabled(closed),
    new ButtonBuilder().setCustomId('ticket:priority').setLabel('Prioritaire').setEmoji('📌').setStyle(ButtonStyle.Secondary).setDisabled(closed),
    new ButtonBuilder().setCustomId('ticket:close').setLabel('Fermer').setEmoji('🔒').setStyle(ButtonStyle.Danger).setDisabled(closed)
  );
}

/**
 * Crée un ticket privé. Nom du salon : emoji de la catégorie + pseudo Discord
 * de l'utilisateur (ex: ❓ Question -> ❓nathan). L'emoji reste aussi visible
 * dans l'embed et le topic du salon.
 *
 * Options :
 * - parentCategoryName : catégorie Discord d'accueil du salon (par défaut TICKET_CATEGORY_NAME).
 * - extraEmbed : EmbedBuilder additionnel figé à la création (ex: résumé de candidature),
 *   ré-affiché au-dessus de l'embed de ticket à chaque rafraîchissement (claim/transfert/priorité).
 * - includeUser : si false, l'utilisateur concerné n'a pas accès au salon (archive interne
 *   réservée au staff), et n'est pas mentionné à la création.
 */
async function createTicket(guild, user, category, options = {}) {
  const { parentCategoryName = TICKET_CATEGORY_NAME, extraEmbed = null, includeUser = true } = options;
  const meta = TICKET_CATEGORY_LABELS[category];
  const roles = await ConfigService.getRoles();
  const ticketCategory = await ensureCategory(guild, parentCategoryName);

  const overwrites = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }];
  if (includeUser) {
    overwrites.push({ id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] });
  }
  if (roles.manager) overwrites.push({ id: roles.manager, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  if (roles.patron) overwrites.push({ id: roles.patron, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  if (roles.coPatron) overwrites.push({ id: roles.coPatron, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });

  const channel = await guild.channels.create({
    name: `${meta.emoji}${user.username}`,
    type: ChannelType.GuildText,
    parent: ticketCategory.id,
    permissionOverwrites: overwrites,
    topic: `${meta.emoji} ${meta.label} — ${user.tag}`,
  });

  const ticket = await ticketRepo.create({
    channelId: channel.id,
    userId: user.id,
    category,
    extraEmbed: extraEmbed ? extraEmbed.toJSON() : null,
  });

  const sent = await channel.send({
    content: includeUser ? `<@${user.id}>` : undefined,
    embeds: extraEmbed ? [extraEmbed, buildTicketEmbed(ticket)] : [buildTicketEmbed(ticket)],
    components: [buildTicketButtons(ticket)],
  });
  await sent.pin().catch(() => null);

  return { channel, ticket };
}

async function refreshTicketMessage(channel, ticket) {
  const pinned = await channel.messages.fetchPinned().catch(() => null);
  const message = pinned?.first();
  if (!message) return;
  const embeds = ticket.extraEmbed ? [EmbedBuilder.from(ticket.extraEmbed), buildTicketEmbed(ticket)] : [buildTicketEmbed(ticket)];
  await message.edit({ embeds, components: [buildTicketButtons(ticket)] }).catch(() => null);
}

async function claimTicket(client, channel, ticket, manager) {
  const updated = { ...ticket, status: 'CLAIMED', assignedTo: manager.id };
  await ticketRepo.update(ticket.ticketId, { status: 'CLAIMED', assignedTo: manager.id });
  await refreshTicketMessage(channel, updated);
  await LogService.log(client, { action: 'TICKET PRIS EN CHARGE', actorId: manager.id, targetUserId: ticket.userId, transactionId: ticket.ticketId });
  return updated;
}

async function transferTicket(client, channel, ticket, newManager) {
  const updated = { ...ticket, status: 'CLAIMED', assignedTo: newManager.id };
  await ticketRepo.update(ticket.ticketId, { status: 'CLAIMED', assignedTo: newManager.id });
  await refreshTicketMessage(channel, updated);
  await LogService.log(client, { action: 'TICKET TRANSFÉRÉ', actorId: newManager.id, targetUserId: ticket.userId, transactionId: ticket.ticketId });
  return updated;
}

async function togglePriority(client, channel, ticket, actor) {
  const updated = { ...ticket, priority: !ticket.priority };
  await ticketRepo.update(ticket.ticketId, { priority: updated.priority });
  await refreshTicketMessage(channel, updated);
  await LogService.log(client, {
    action: updated.priority ? 'TICKET MARQUÉ PRIORITAIRE' : 'TICKET RETIRÉ DES PRIORITAIRES',
    actorId: actor.id,
    targetUserId: ticket.userId,
    transactionId: ticket.ticketId,
  });
  return updated;
}

async function generateTranscript(channel) {
  const messages = [];
  let lastId;
  for (let i = 0; i < 10; i++) {
    const batch = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!batch || !batch.size) break;
    messages.push(...batch.values());
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }
  messages.reverse();

  const lines = messages.map((m) => {
    const time = m.createdAt.toISOString();
    const content = m.content || '[embed/pièce jointe]';
    const attachments = m.attachments.size ? ` (${[...m.attachments.values()].map((a) => a.url).join(', ')})` : '';
    return `[${time}] ${m.author.tag}: ${content}${attachments}`;
  });

  return lines.join('\n') || '(aucun message)';
}

async function closeTicket(client, channel, ticket, actor, reason) {
  const transcript = await generateTranscript(channel);
  const buffer = Buffer.from(transcript, 'utf-8');
  const attachment = new AttachmentBuilder(buffer, { name: `transcript-${ticket.ticketId}.txt` });

  await ticketRepo.update(ticket.ticketId, {
    status: 'CLOSED',
    closedAt: new Date().toISOString(),
    closedBy: actor.id,
    closeReason: reason || 'Non précisé',
  });

  const channels = await ConfigService.getChannels();
  const logChannel = channels.logs ? await client.channels.fetch(channels.logs).catch(() => null) : null;
  if (logChannel) {
    const meta = TICKET_CATEGORY_LABELS[ticket.category];
    await logChannel
      .send({
        embeds: [
          baseEmbed()
            .setTitle('🔒 Ticket fermé')
            .addFields(
              { name: 'Type', value: `${meta.emoji} ${meta.label}`, inline: true },
              { name: 'Utilisateur', value: `<@${ticket.userId}>`, inline: true },
              { name: 'Fermé par', value: `<@${actor.id}>`, inline: true },
              { name: 'Raison', value: reason || 'Non précisé' }
            ),
        ],
        files: [attachment],
      })
      .catch(() => null);
  }

  await LogService.log(client, {
    action: 'TICKET FERMÉ',
    actorId: actor.id,
    targetUserId: ticket.userId,
    transactionId: ticket.ticketId,
    details: { Raison: reason || 'Non précisé' },
  });

  await channel.delete().catch(() => null);
}

module.exports = {
  buildTicketEmbed,
  buildTicketButtons,
  statusLabel,
  createTicket,
  claimTicket,
  transferTicket,
  togglePriority,
  closeTicket,
  refreshTicketMessage,
};
