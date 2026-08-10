'use strict';

const absenceRepo = require('../database/repositories/absenceRepo');
const LogService = require('./LogService');
const { baseEmbed } = require('../utils/embeds');
const { AppError } = require('../utils/errors');

async function requestAbsence({ employeeId, startDate, endDate, reason, comment }) {
  return absenceRepo.create({ employeeId, startDate, endDate, reason, comment });
}

async function reviewAbsence(client, absenceId, reviewerId, decision) {
  const absence = await absenceRepo.get(absenceId);
  if (!absence) throw new AppError('absence introuvable', { userMessage: '❌ Demande d\'absence introuvable.' });
  if (absence.status !== 'PENDING') {
    throw new AppError('absence déjà traitée', { userMessage: '⚠️ Cette demande a déjà été traitée.' });
  }

  const status = decision === 'accept' ? 'ACCEPTED' : 'REFUSED';
  await absenceRepo.update(absenceId, { status, reviewedBy: reviewerId, reviewedAt: new Date().toISOString() });

  await LogService.log(client, {
    action: status === 'ACCEPTED' ? 'ABSENCE ACCEPTÉE' : 'ABSENCE REFUSÉE',
    actorId: reviewerId,
    targetUserId: absence.employeeId,
    transactionId: absenceId,
  });

  const user = await client.users.fetch(absence.employeeId).catch(() => null);
  if (user) {
    await user
      .send({
        embeds: [
          baseEmbed()
            .setTitle('🍩 Lawrence Doughnuts — Absence')
            .setDescription(status === 'ACCEPTED' ? '✅ Ta demande d\'absence a été acceptée.' : '❌ Ta demande d\'absence a été refusée.'),
        ],
      })
      .catch(() => null);
  }

  return { ...absence, status };
}

async function getHistory(employeeId) {
  return absenceRepo.listByEmployee(employeeId);
}

module.exports = { requestAbsence, reviewAbsence, getHistory };
