'use strict';

const { baseEmbed } = require('../utils/embeds');
const ConfigService = require('./ConfigService');
const { BRAND } = require('../config/constants');

const GROUPS = [
  { label: '👑 DIRECTION (PATRON)', roleKeys: ['patron'] },
  { label: '✨ DIRECTION (CO-PATRON)', roleKeys: ['coPatron'] },
  { label: '🧠 MANAGER', roleKeys: ['manager'] },
  { label: '👥 PRO', roleKeys: ['pro'] },
  { label: '👤 NOVICE', roleKeys: ['novice'] },
];

async function buildOrganigrammeEmbed(guild) {
  await guild.members.fetch();
  const roles = await ConfigService.getRoles();

  const embed = baseEmbed().setTitle(`📋 ORGANIGRAMME — ${BRAND.NAME}`).setTimestamp();

  for (const group of GROUPS) {
    const roleId = roles[group.roleKeys[0]];
    const members = roleId ? guild.members.cache.filter((m) => m.roles.cache.has(roleId)) : new Map();
    const list = members.size ? [...members.values()].map((m) => `• <@${m.id}>`).join('\n') : '_Aucun membre_';
    embed.addFields({ name: `${group.label} (${members.size})`, value: list });
  }

  return embed;
}

module.exports = { buildOrganigrammeEmbed };
