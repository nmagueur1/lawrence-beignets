'use strict';

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const PAGE_SIZE = 8;

function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const slice = items.slice(safePage * pageSize, safePage * pageSize + pageSize);
  return { slice, page: safePage, totalPages };
}

function buildPaginationRow(prefix, targetId, page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}:${targetId}:${page - 1}`)
      .setLabel('◀ Précédent')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`${prefix}:${targetId}:${page + 1}`)
      .setLabel('Suivant ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1)
  );
}

module.exports = { paginate, buildPaginationRow, PAGE_SIZE };
