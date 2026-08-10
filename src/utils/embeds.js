'use strict';

const { EmbedBuilder } = require('discord.js');
const { BRAND } = require('../config/constants');

function baseEmbed() {
  return new EmbedBuilder().setColor(BRAND.COLOR).setFooter({ text: BRAND.FOOTER }).setTimestamp();
}

function successEmbed(title, description) {
  return baseEmbed().setColor(BRAND.COLOR_SUCCESS).setTitle(title).setDescription(description || null);
}

function errorEmbed(title, description) {
  return baseEmbed().setColor(BRAND.COLOR_DANGER).setTitle(title).setDescription(description || null);
}

function warningEmbed(title, description) {
  return baseEmbed().setColor(BRAND.COLOR_WARNING).setTitle(title).setDescription(description || null);
}

module.exports = { baseEmbed, successEmbed, errorEmbed, warningEmbed };
