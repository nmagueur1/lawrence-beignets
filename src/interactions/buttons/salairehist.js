'use strict';

const PayrollService = require('../../services/PayrollService');
const PermissionService = require('../../services/PermissionService');
const { baseEmbed } = require('../../utils/embeds');
const { paginate, buildPaginationRow } = require('../../utils/pagination');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'salairehist',

  async execute(interaction) {
    const [, targetId, pageStr] = interaction.customId.split(':');

    if (targetId !== interaction.user.id) {
      const allowed = await PermissionService.isManagerOrAbove(interaction.member);
      if (!allowed) {
        throw new AppError('salairehist: accès refusé', { userMessage: '❌ Accès refusé.' });
      }
    }

    const history = await PayrollService.getHistory(targetId);
    const { slice, page, totalPages } = paginate(history, parseInt(pageStr, 10) || 0);

    const targetUser = await interaction.client.users.fetch(targetId).catch(() => null);
    const embed = baseEmbed()
      .setTitle(`📜 Historique — ${targetUser?.username || targetId}`)
      .setDescription(slice.map((entry) => PayrollService.buildHistoryLine(entry)).join('\n') || 'Aucune transaction.')
      .setFooter({ text: `Page ${page + 1}/${totalPages}` });

    await interaction.update({ embeds: [embed], components: [buildPaginationRow('salairehist', targetId, page, totalPages)] });
  },
};
