'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { baseEmbed } = require('../utils/embeds');
const { BRAND } = require('../config/constants');
const ConfigService = require('./ConfigService');

/**
 * Poste un message (embed[+composants]) dans un salon de façon idempotente :
 * si un message a déjà été posté (son ID est stocké dans config/messages sous
 * `messageKey`), on l'édite ; sinon on en poste un nouveau et on mémorise son ID.
 * Garantit qu'un /setup relancé plusieurs fois ne duplique jamais les panels.
 */
async function postOrUpdate(client, channelId, messageKey, payload) {
  if (!channelId) return null;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return null;

  const messages = await ConfigService.getMessages();
  const existingId = messages[messageKey];

  if (existingId) {
    const existing = await channel.messages.fetch(existingId).catch(() => null);
    if (existing) {
      await existing.edit(payload);
      return existing;
    }
  }

  const sent = await channel.send(payload);
  await ConfigService.set('messages', { [messageKey]: sent.id });
  return sent;
}

function channelUrl(guildId, channelId) {
  return `https://discord.com/channels/${guildId}/${channelId}`;
}

function buildAccueilPanel(guild, channels) {
  const embed = baseEmbed()
    .setTitle(`${BRAND.EMOJI} LAWRENCE DOUGHNUTS`)
    .setDescription(
      "Bienvenue chez **Lawrence Doughnuts** !\n\nEntreprise spécialisée dans le farm et la vente de beignets sur le serveur GTA RP.\n\nUtilise les boutons ci-dessous pour en savoir plus."
    )
    .setThumbnail(guild.iconURL({ size: 256 }) || null);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('Règlement').setEmoji('📜').setStyle(ButtonStyle.Link).setURL(channelUrl(guild.id, channels.reglement)),
    new ButtonBuilder().setLabel('Informations').setEmoji('ℹ️').setStyle(ButtonStyle.Link).setURL(channelUrl(guild.id, channels.informations)),
    new ButtonBuilder().setLabel('Recrutement').setEmoji('📝').setStyle(ButtonStyle.Link).setURL(channelUrl(guild.id, channels.recrutementOn)),
    new ButtonBuilder().setLabel('Localisation').setEmoji('📍').setStyle(ButtonStyle.Link).setURL(channelUrl(guild.id, channels.localisation)),
    new ButtonBuilder().setLabel('Contact').setEmoji('📩').setStyle(ButtonStyle.Link).setURL(channelUrl(guild.id, channels.contact))
  );

  return { embeds: [embed], components: [row] };
}

function buildInformationsEmbed() {
  const embed = baseEmbed()
    .setTitle(`${BRAND.EMOJI} LAWRENCE DOUGHNUTS`)
    .setDescription("Présentation officielle de l'entreprise.")
    .addFields(
      { name: '🏢 Activité', value: 'Farm et vente de beignets sur le serveur GTA RP.' },
      {
        name: '⚙️ Fonctionnement',
        value:
          "Les employés récupèrent (farm) des beignets, puis effectuent une vente sur l'unique point de vente prévu par l'entreprise. Il n'y a pas de vente directe avec d'autres joueurs, pas de commandes clients.",
      },
      {
        name: '🎭 Grades',
        value: '👑 PATRON · ✨ CO-PATRON · 🧠 MANAGER · 👥 PRO · 👤 NOVICE',
      },
      {
        name: '💰 Ventes & primes',
        value:
          "Chaque vente validée par un Manager ou la Direction déclenche automatiquement le calcul de la prime, selon le tarif du grade de l'employé.",
      },
      {
        name: '📝 Recrutement',
        value: 'Candidature via le panel du salon recrutement. Réponse par le staff sous forme d\'acceptation, refus ou mise en attente.',
      }
    );

  return { embeds: [embed] };
}

function buildReglementEmbed(content) {
  const embed = baseEmbed()
    .setTitle(`📜 RÈGLEMENT — ${BRAND.NAME}`)
    .setDescription(content || 'Le règlement sera bientôt disponible.');
  return { embeds: [embed] };
}

function buildContactPanel() {
  const embed = baseEmbed()
    .setTitle(`📩 ${BRAND.NAME}`)
    .setDescription(
      [
        'Une question, un signalement, ou besoin de joindre le management ?',
        '',
        'Clique sur le bouton ci-dessous et choisis une catégorie pour ouvrir un ticket privé avec le staff.',
      ].join('\n')
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('contact:ouvrir').setLabel('Nous contacter').setEmoji('📩').setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

function buildLocalisationEmbed() {
  const embed = baseEmbed()
    .setTitle(`🍩 TOURNÉE ${BRAND.NAME.toUpperCase()}`)
    .setDescription(
      [
        '📍 **Point de farm**',
        'Localisation à préciser par la Direction.',
        '',
        '🍩 **Point de vente**',
        'Localisation à préciser par la Direction.',
        '',
        '🚗 **Itinéraire**',
        '📍 Point de farm → 🍩 Production → 💰 Point de vente → 🏁 Fin de tournée',
        '',
        '⚠️ **Consignes**',
        "Une seule tournée existe chez Lawrence Doughnuts : pas de vente directe, pas de commande client.",
      ].join('\n')
    );
  return { embeds: [embed] };
}

module.exports = {
  postOrUpdate,
  buildAccueilPanel,
  buildInformationsEmbed,
  buildReglementEmbed,
  buildContactPanel,
  buildLocalisationEmbed,
  channelUrl,
};
