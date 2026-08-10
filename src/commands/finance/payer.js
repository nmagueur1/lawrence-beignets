'use strict';

const crypto = require('node:crypto');
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const EmployeeService = require('../../services/EmployeeService');
const tempCache = require('../../utils/tempCache');
const { warningEmbed } = require('../../utils/embeds');
const { formatMoney } = require('../../utils/format');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('payer')
    .setDescription('Payer un employé (Direction, ou Manager selon configuration)')
    .addUserOption((o) => o.setName('employe').setDescription("L'employé à payer").setRequired(true))
    .addIntegerOption((o) => o.setName('montant').setDescription('Montant à payer ($)').setRequired(true).setMinValue(1))
    .addStringOption((o) => o.setName('commentaire').setDescription('Commentaire (optionnel)').setRequired(false)),

  async execute(interaction) {
    const canPay = await PermissionService.canPayEmployee(interaction.member);
    if (!canPay) {
      throw new AppError('payer: accès refusé', { userMessage: '❌ Tu n\'es pas autorisé à effectuer des paiements.' });
    }

    const targetUser = interaction.options.getUser('employe');
    const amount = interaction.options.getInteger('montant');
    const comment = interaction.options.getString('commentaire');

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) {
      throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Doughnuts enregistré." });
    }

    const before = employee.balance || 0;
    if (amount > before) {
      throw new AppError('paiement supérieur au solde', {
        userMessage: `❌ Le montant (${formatMoney(amount)}) dépasse le reste à payer actuel (${formatMoney(before)}).`,
      });
    }

    const token = crypto.randomUUID();
    tempCache.set(`paiement:${token}`, { employeeId: targetUser.id, amount, comment, payerId: interaction.user.id });

    const embed = warningEmbed('💸 PAIEMENT', null).addFields(
      { name: 'Employé', value: `<@${targetUser.id}>`, inline: true },
      { name: 'Montant', value: formatMoney(amount), inline: true },
      { name: 'Avant', value: formatMoney(before), inline: true },
      { name: 'Après', value: formatMoney(before - amount), inline: true },
      { name: 'Payé par', value: `<@${interaction.user.id}>`, inline: true }
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`paiement:confirm:${token}`).setLabel('CONFIRMER').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`paiement:cancel:${token}`).setLabel('ANNULER').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
