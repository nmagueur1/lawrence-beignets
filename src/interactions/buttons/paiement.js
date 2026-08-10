'use strict';

const tempCache = require('../../utils/tempCache');
const PayrollService = require('../../services/PayrollService');
const PayChannelService = require('../../services/PayChannelService');
const LogService = require('../../services/LogService');
const { successEmbed } = require('../../utils/embeds');
const { formatMoney } = require('../../utils/format');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'paiement',

  async execute(interaction) {
    const [, action, token] = interaction.customId.split(':');
    const cacheKey = `paiement:${token}`;

    const pending = tempCache.get(cacheKey);
    tempCache.del(cacheKey);

    if (!pending) {
      throw new AppError('paiement: session expirée', {
        userMessage: '⚠️ Cette confirmation a expiré ou a déjà été traitée. Relance `/payer` si nécessaire.',
      });
    }

    if (action === 'cancel') {
      await interaction.update({ embeds: [successEmbed('❌ Paiement annulé', null)], components: [] });
      return;
    }

    if (action !== 'confirm') return;

    await interaction.update({ embeds: [successEmbed('⏳ Paiement en cours...', null)], components: [] });

    const { balanceBefore, balanceAfter, employee, paymentId } = await PayrollService.recordPayment({
      employeeId: pending.employeeId,
      amount: pending.amount,
      paidBy: pending.payerId,
      comment: pending.comment,
    });

    await PayChannelService.refreshFiche(interaction.client, employee);

    const resultEmbed = successEmbed('💸 PAIEMENT EFFECTUÉ', null).addFields(
      { name: 'Employé', value: `<@${pending.employeeId}>`, inline: true },
      { name: 'Montant', value: formatMoney(pending.amount), inline: true },
      { name: 'Total généré', value: formatMoney(employee.totalEarned), inline: true },
      { name: 'Total payé', value: formatMoney(employee.totalPaid), inline: true },
      { name: 'RESTE À PAYER', value: formatMoney(balanceAfter), inline: true },
      { name: 'Payé par', value: `<@${pending.payerId}>`, inline: true }
    );

    await interaction.editReply({ embeds: [resultEmbed], components: [] });

    if (employee.payChannelId) {
      const payChannel = await interaction.client.channels.fetch(employee.payChannelId).catch(() => null);
      if (payChannel) await payChannel.send({ embeds: [resultEmbed] }).catch(() => null);
    }

    await LogService.log(interaction.client, {
      action: 'PAIEMENT EFFECTUÉ',
      actorId: pending.payerId,
      targetUserId: pending.employeeId,
      transactionId: paymentId,
      details: { Montant: formatMoney(pending.amount), 'Reste à payer': formatMoney(balanceAfter) },
    });
  },
};
