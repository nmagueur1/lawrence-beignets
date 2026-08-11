'use strict';

const tempCache = require('../../utils/tempCache');
const PayrollService = require('../../services/PayrollService');
const PayChannelService = require('../../services/PayChannelService');
const BadgeService = require('../../services/BadgeService');
const LogService = require('../../services/LogService');
const { successEmbed } = require('../../utils/embeds');
const { formatMoney } = require('../../utils/format');
const { GRADE_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

module.exports = {
  customId: 'vente',

  async execute(interaction) {
    const [, action, token] = interaction.customId.split(':');
    const cacheKey = `vente:${token}`;

    const pending = tempCache.get(cacheKey);
    tempCache.del(cacheKey); // consommé immédiatement : bloque tout second clic (double validation)

    if (!pending) {
      throw new AppError('vente: session expirée ou déjà traitée', {
        userMessage: '⚠️ Cette confirmation a expiré ou a déjà été traitée. Relance `/valider-vente` si nécessaire.',
      });
    }

    if (action === 'cancel') {
      await interaction.update({ embeds: [successEmbed('❌ Vente annulée', 'Aucune donnée n\'a été enregistrée.')], components: [] });
      return;
    }

    if (action !== 'confirm') return;

    await interaction.update({ embeds: [successEmbed('⏳ Validation en cours...', null)], components: [] });

    const { sale, employee, rule } = await PayrollService.recordValidatedSale({
      employeeId: pending.employeeId,
      quantity: pending.quantity,
      grade: pending.grade,
      rate: pending.rate,
      validatedBy: pending.validatorId,
      evidenceChannelId: pending.evidenceChannelId,
    });

    await PayChannelService.refreshFiche(interaction.client, employee);

    const resultEmbed = successEmbed('🍩 VENTE VALIDÉE', null).addFields(
      { name: 'Employé', value: `<@${pending.employeeId}>`, inline: true },
      { name: 'Grade', value: GRADE_LABELS[pending.grade] || pending.grade, inline: true },
      { name: 'Quantité', value: `${pending.quantity} beignets`, inline: true },
      { name: 'Tarif', value: `${formatMoney(pending.rate)} / beignet`, inline: true },
      { name: 'Prime', value: `+${formatMoney(pending.amount)}`, inline: true },
      { name: 'Validée par', value: `<@${pending.validatorId}>`, inline: true },
      { name: 'ID', value: `\`${sale.saleId}\``, inline: true }
    );
    if (rule) resultEmbed.addFields({ name: '🏆 Points attribués', value: `+${rule.points}`, inline: true });

    await interaction.editReply({ embeds: [resultEmbed], components: [] });

    if (employee.payChannelId) {
      const payChannel = await interaction.client.channels.fetch(employee.payChannelId).catch((err) => {
        console.error(`[vente] salon de paie ${employee.payChannelId} introuvable pour ${employee.discordId}`, err);
        return null;
      });
      if (payChannel) {
        await payChannel.send({ embeds: [resultEmbed] }).catch((err) => {
          console.error(`[vente] échec envoi embed dans le salon de paie de ${employee.discordId}`, err);
        });
      }
    } else {
      console.error(`[vente] employee.payChannelId manquant pour ${employee.discordId}`);
    }

    await LogService.log(interaction.client, {
      action: 'VENTE VALIDÉE',
      actorId: pending.validatorId,
      targetUserId: pending.employeeId,
      transactionId: sale.saleId,
      details: { Quantité: pending.quantity, Prime: formatMoney(pending.amount), Points: rule ? `+${rule.points}` : '0' },
    });

    await BadgeService.checkAndAwardBadges(interaction.client, employee).catch((err) => console.error('[BadgeService]', err));
  },
};
