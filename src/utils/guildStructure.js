'use strict';

const { ChannelType } = require('discord.js');

/**
 * Trouve une catégorie par nom exact, la crée si elle n'existe pas.
 * Réutilisé par /setup et par le système de tickets.
 */
async function ensureCategory(guild, name) {
  let category = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === name);
  if (!category) {
    category = await guild.channels.create({ name, type: ChannelType.GuildCategory });
  }
  return category;
}

function sanitizeChannelName(input) {
  return String(input)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'salon';
}

module.exports = { ensureCategory, sanitizeChannelName };
