'use strict';

function formatMoney(amount) {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('fr-FR')} $`;
}

function formatNumber(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString('fr-FR');
}

function discordTimestamp(date, style = 'f') {
  const d = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor(d.getTime() / 1000);
  return `<t:${seconds}:${style}>`;
}

module.exports = { formatMoney, formatNumber, discordTimestamp };
