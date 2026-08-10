'use strict';

const logRepo = require('../database/repositories/logRepo');
const ConfigService = require('./ConfigService');
const { BRAND } = require('../config/constants');
const { EmbedBuilder } = require('discord.js');

/**
 * Toute action sensible (recrutement, promotion, sanction, vente, paiement, points,
 * configuration, ticket...) doit passer par ici : persistance Firestore + envoi
 * dans le salon de logs si configuré.
 */
async function log(client, entry) {
  const saved = await logRepo.create(entry);

  try {
    const channels = await ConfigService.getChannels();
    if (!channels.logs) return saved;
    const channel = await client.channels.fetch(channels.logs).catch(() => null);
    if (!channel) return saved;

    const embed = new EmbedBuilder()
      .setColor(BRAND.COLOR)
      .setTitle(`📜 ${entry.action}`)
      .setTimestamp()
      .setFooter({ text: BRAND.FOOTER });

    if (entry.actorId) embed.addFields({ name: 'Responsable', value: `<@${entry.actorId}>`, inline: true });
    if (entry.targetUserId) embed.addFields({ name: 'Concerné', value: `<@${entry.targetUserId}>`, inline: true });
    if (entry.transactionId) embed.addFields({ name: 'ID', value: `\`${entry.transactionId}\``, inline: true });

    const detailsEntries = Object.entries(entry.details || {});
    if (detailsEntries.length) {
      const value = detailsEntries.map(([k, v]) => `**${k}** : ${v}`).join('\n').slice(0, 1024);
      embed.addFields({ name: 'Détails', value });
    }

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[LogService] échec envoi log Discord :', err);
  }

  return saved;
}

module.exports = { log };
