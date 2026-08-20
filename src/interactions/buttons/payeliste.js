'use strict';

const PermissionService = require('../../services/PermissionService');
const PayrollService = require('../../services/PayrollService');
const { baseEmbed } = require('../../utils/embeds');
const { paginate, buildPaginationRow } = require('../../utils/pagination');
const { formatMoney } = require('../../utils/format');
const { AppError } = require('../../utils/errors');
const { BRAND } = require('../../config/constants');

module.exports = {
  customId: 'payeliste',

  async execute(interaction) {
    const [, , pageStr] = interaction.customId.split(':');

    const allowed = await PermissionService.isManagerOrAbove(interaction.member);
    if (!allowed) {
      throw new AppError('payeliste: accès refusé', { userMessage: '❌ Accès refusé.' });
    }

    const pending = await PayrollService.getPendingPayments();
    const { slice, page, totalPages } = paginate(pending, parseInt(pageStr, 10) || 0);
    const total = pending.reduce((sum, e) => sum + (e.balance || 0), 0);

    const embed = baseEmbed()
      .setTitle(`${BRAND.EMOJI} Payes à faire (${pending.length})`)
      .setDescription(slice.map((e) => PayrollService.buildPayeListLine(e)).join('\n') || 'Aucun paiement en attente.')
      .addFields({ name: 'Total à payer', value: formatMoney(total) })
      .setFooter({ text: `Page ${page + 1}/${totalPages}` });

    await interaction.update({ embeds: [embed], components: [buildPaginationRow('payeliste', 'all', page, totalPages)] });
  },
};
