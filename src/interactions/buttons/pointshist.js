'use strict';

const PointService = require('../../services/PointService');
const PermissionService = require('../../services/PermissionService');
const { baseEmbed } = require('../../utils/embeds');
const { paginate, buildPaginationRow } = require('../../utils/pagination');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'pointshist',

  async execute(interaction) {
    const [, targetId, pageStr] = interaction.customId.split(':');

    if (targetId !== interaction.user.id) {
      const allowed = await PermissionService.isManagerOrAbove(interaction.member);
      if (!allowed) throw new AppError('pointshist: accès refusé', { userMessage: '❌ Accès refusé.' });
    }

    const history = await PointService.getHistory(targetId);
    const { slice, page, totalPages } = paginate(history, parseInt(pageStr, 10) || 0);
    const targetUser = await interaction.client.users.fetch(targetId).catch(() => null);

    const embed = baseEmbed()
      .setTitle(`🏆 Historique des points — ${targetUser?.username || targetId}`)
      .setDescription(slice.map((e) => PointService.buildPointHistoryLine(e)).join('\n') || 'Aucun mouvement.')
      .setFooter({ text: `Page ${page + 1}/${totalPages}` });

    await interaction.update({ embeds: [embed], components: [buildPaginationRow('pointshist', targetId, page, totalPages)] });
  },
};
