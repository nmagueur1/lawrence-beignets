'use strict';

const PermissionService = require('../../services/PermissionService');
const AbsenceService = require('../../services/AbsenceService');
const { successEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'absence',

  async execute(interaction) {
    const [, action, absenceId] = interaction.customId.split(':');

    const canManage = await PermissionService.isManagerOrAbove(interaction.member);
    if (!canManage) {
      throw new AppError('absence: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent traiter les absences.' });
    }

    const updated = await AbsenceService.reviewAbsence(interaction.client, absenceId, interaction.user.id, action);

    await interaction.update({
      embeds: [
        successEmbed(
          updated.status === 'ACCEPTED' ? '✅ Absence acceptée' : '❌ Absence refusée',
          `<@${updated.employeeId}> — ${updated.startDate} → ${updated.endDate}`
        ),
      ],
      components: [],
    });
  },
};
