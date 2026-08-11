'use strict';

const sanctionRepo = require('../database/repositories/sanctionRepo');
const LogService = require('./LogService');
const { baseEmbed } = require('../utils/embeds');
const { discordTimestamp } = require('../utils/format');
const { SANCTION_LABELS } = require('../config/constants');

async function issueSanction(client, { employeeId, issuedBy, type, reason, note, evidenceUrl, expiresAt }) {
  const sanction = await sanctionRepo.create({ employeeId, issuedBy, type, reason, note, evidenceUrl, expiresAt });

  await LogService.log(client, {
    action: 'SANCTION ÉMISE',
    actorId: issuedBy,
    targetUserId: employeeId,
    transactionId: sanction.sanctionId,
    details: { Type: SANCTION_LABELS[type] || type, Motif: reason },
  });

  const user = await client.users.fetch(employeeId).catch(() => null);
  if (user) {
    await user
      .send({
        embeds: [
          baseEmbed()
            .setTitle('🍩 Lawrence Beignets — Sanction')
            .addFields({ name: 'Type', value: SANCTION_LABELS[type] || type }, { name: 'Motif', value: reason }),
        ],
      })
      .catch(() => null);
  }

  return sanction;
}

async function getHistory(employeeId) {
  return sanctionRepo.listByEmployee(employeeId);
}

function buildSanctionLine(s) {
  const date = discordTimestamp(s.date?.toDate ? s.date.toDate() : s.date, 'd');
  return `${SANCTION_LABELS[s.type] || s.type} — ${s.reason} · par <@${s.issuedBy}> · ${date}`;
}

module.exports = { issueSanction, getHistory, buildSanctionLine };
