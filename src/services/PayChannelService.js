'use strict';

const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { baseEmbed } = require('../utils/embeds');
const { formatMoney } = require('../utils/format');
const { GRADE_LABELS, BRAND } = require('../config/constants');
const { sanitizeChannelName } = require('../utils/guildStructure');
const ConfigService = require('./ConfigService');
const employeeRepo = require('../database/repositories/employeeRepo');

function buildFicheEmbed(employee) {
  const embed = baseEmbed()
    .setTitle(`${BRAND.EMOJI} LAWRENCE DOUGHNUTS`)
    .setDescription(
      [
        '📄 **FICHE DE PAYE**',
        '',
        'Bienvenue dans ton espace personnel.',
        '',
        'Pour chaque vente :',
        '1️⃣ Envoie une photo de ton stock **AVANT** la vente.',
        '2️⃣ Effectue ta vente.',
        '3️⃣ Envoie une photo **APRÈS** la vente.',
        '4️⃣ Un Manager ou membre de la direction vérifiera les preuves.',
        '5️⃣ La vente sera validée avec `/valider-vente`.',
        '━━━━━━━━━━━━━━━━━━',
      ].join('\n')
    )
    .addFields(
      { name: '💰 Total généré', value: formatMoney(employee.totalEarned || 0), inline: true },
      { name: '💸 Total payé', value: formatMoney(employee.totalPaid || 0), inline: true },
      { name: '🧾 Reste à payer', value: formatMoney(employee.balance || 0), inline: true }
    )
    .setFooter({ text: `${BRAND.FOOTER} — Grade actuel : ${GRADE_LABELS[employee.grade] || employee.grade}` });

  return { embeds: [embed] };
}

/**
 * Crée (si besoin) le salon de paie individuel d'un employé, visible uniquement par
 * lui-même, les MANAGERS, le PATRON et le CO-PATRON (mêmes droits pour les deux).
 * Idempotent : si l'employé a déjà un payChannelId valide, on le réutilise.
 */
async function ensurePayChannel(guild, member, employee) {
  if (employee.payChannelId) {
    const existing = await guild.channels.fetch(employee.payChannelId).catch(() => null);
    if (existing) return existing;
  }

  const channels = await ConfigService.getChannels();
  const roles = await ConfigService.getRoles();

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: member.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
  ];
  if (roles.manager) overwrites.push({ id: roles.manager, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  if (roles.patron) overwrites.push({ id: roles.patron, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
  if (roles.coPatron) overwrites.push({ id: roles.coPatron, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });

  const channel = await guild.channels.create({
    name: `📄・${sanitizeChannelName(member.user.username)}`,
    type: ChannelType.GuildText,
    parent: channels.payCategory || null,
    permissionOverwrites: overwrites,
    topic: `Fiche de paie — ${member.user.tag} (${member.id})`,
  });

  const sent = await channel.send(buildFicheEmbed(employee));
  await sent.pin().catch(() => null);

  await employeeRepo.update(member.id, { payChannelId: channel.id, payMessageId: sent.id });

  return channel;
}

/**
 * Réactualise l'embed épinglé de la fiche de paie (appelé après chaque vente/paiement).
 */
async function refreshFiche(client, employee) {
  if (!employee.payChannelId || !employee.payMessageId) return;
  const channel = await client.channels.fetch(employee.payChannelId).catch(() => null);
  if (!channel) return;
  const message = await channel.messages.fetch(employee.payMessageId).catch(() => null);
  if (!message) return;
  await message.edit(buildFicheEmbed(employee)).catch(() => null);
}

module.exports = { ensurePayChannel, refreshFiche, buildFicheEmbed };
