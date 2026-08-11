'use strict';

const crypto = require('node:crypto');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const PayrollService = require('../../services/PayrollService');
const EmployeeService = require('../../services/EmployeeService');
const tempCache = require('../../utils/tempCache');
const { warningEmbed } = require('../../utils/embeds');
const { formatMoney } = require('../../utils/format');
const { GRADE_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('valider-vente')
    .setDescription('Valider une vente de beignets (Manager / Direction)')
    .addUserOption((o) => o.setName('employe').setDescription("L'employé concerné").setRequired(true))
    .addIntegerOption((o) => o.setName('quantite').setDescription('Quantité de beignets vendus').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const canValidate = await PermissionService.canValidateSale(interaction.member);
    if (!canValidate) {
      throw new AppError('valider-vente: accès refusé', { userMessage: '❌ Seuls les Managers et la Direction peuvent valider une vente.' });
    }

    const targetUser = interaction.options.getUser('employe');
    const quantity = interaction.options.getInteger('quantite');

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) {
      throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Beignets enregistré." });
    }

    const rate = await PayrollService.getRateForGrade(employee.grade);
    if (!rate) {
      throw new AppError('tarif introuvable', { userMessage: `❌ Aucun tarif configuré pour le grade ${employee.grade}.` });
    }

    const amount = PayrollService.calculateSaleAmount(quantity, rate);
    const token = crypto.randomUUID();

    tempCache.set(`vente:${token}`, {
      employeeId: targetUser.id,
      quantity,
      grade: employee.grade,
      rate,
      amount,
      validatorId: interaction.user.id,
      evidenceChannelId: employee.payChannelId,
    });

    const embed = warningEmbed('⚠️ CONFIRMATION', null).addFields(
      { name: 'Employé', value: `<@${targetUser.id}>`, inline: true },
      { name: 'Grade', value: GRADE_LABELS[employee.grade] || employee.grade, inline: true },
      { name: 'Quantité', value: `${quantity} beignets`, inline: true },
      { name: 'Tarif', value: `${formatMoney(rate)} / beignet`, inline: true },
      { name: 'Prime', value: formatMoney(amount), inline: true },
      { name: 'Validée par', value: `<@${interaction.user.id}>`, inline: true }
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`vente:confirm:${token}`).setLabel('VALIDER').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`vente:cancel:${token}`).setLabel('ANNULER').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
