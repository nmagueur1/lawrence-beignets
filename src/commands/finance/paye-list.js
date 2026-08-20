'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const PayrollService = require('../../services/PayrollService');
const { baseEmbed } = require('../../utils/embeds');
const { paginate, buildPaginationRow } = require('../../utils/pagination');
const { formatMoney } = require('../../utils/format');
const { AppError } = require('../../utils/errors');
const { BRAND } = require('../../config/constants');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('paye-list')
    .setDescription('Lister tous les employés ayant un reste à payer (Manager ou plus)'),

  async execute(interaction) {
    const allowed = await PermissionService.isManagerOrAbove(interaction.member);
    if (!allowed) {
      throw new AppError('paye-list: accès refusé', { userMessage: "❌ Tu n'es pas autorisé à consulter la liste des payes." });
    }

    const pending = await PayrollService.getPendingPayments();

    if (!pending.length) {
      await interaction.reply({
        embeds: [baseEmbed().setTitle(`${BRAND.EMOJI} Payes à faire`).setDescription('✅ Aucun paiement en attente pour le moment.')],
        ephemeral: true,
      });
      return;
    }

    const total = pending.reduce((sum, e) => sum + (e.balance || 0), 0);
    const { slice, page, totalPages } = paginate(pending, 0);

    const embed = baseEmbed()
      .setTitle(`${BRAND.EMOJI} Payes à faire (${pending.length})`)
      .setDescription(slice.map((e) => PayrollService.buildPayeListLine(e)).join('\n'))
      .addFields({ name: 'Total à payer', value: formatMoney(total) })
      .setFooter({ text: `Page ${page + 1}/${totalPages}` });

    const components = totalPages > 1 ? [buildPaginationRow('payeliste', 'all', page, totalPages)] : [];
    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  },
};
