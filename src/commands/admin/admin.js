'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const ConfigService = require('../../services/ConfigService');
const LogService = require('../../services/LogService');
const { successEmbed, baseEmbed } = require('../../utils/embeds');
const { formatMoney } = require('../../utils/format');
const { GRADES, GRADE_LABELS } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Administration Lawrence Beignets (Direction)')
    .addSubcommandGroup((g) =>
      g
        .setName('config')
        .setDescription('Configuration générale')
        .addSubcommand((s) => s.setName('voir').setDescription('Afficher la configuration actuelle'))
        .addSubcommand((s) =>
          s
            .setName('tarif')
            .setDescription('Modifier le tarif d\'un grade')
            .addStringOption((o) => o.setName('grade').setDescription('Grade').setRequired(true).addChoices(...Object.entries(GRADE_LABELS).map(([value, name]) => ({ name, value }))))
            .addIntegerOption((o) => o.setName('montant').setDescription('Nouveau tarif ($/beignet)').setRequired(true).setMinValue(1))
        )
        .addSubcommand((s) =>
          s
            .setName('paiement-manager')
            .setDescription('Autoriser/interdire les Managers à utiliser /payer')
            .addBooleanOption((o) => o.setName('actif').setDescription('Activer ?').setRequired(true))
        )
    ),

  async execute(interaction) {
    const isDirection = await PermissionService.isDirection(interaction.member);
    if (!isDirection) throw new AppError('admin: accès refusé', { userMessage: '❌ /admin est réservé à la Direction.' });

    const sub = interaction.options.getSubcommand();

    if (sub === 'voir') {
      const [roles, channels, rates, permissions] = await Promise.all([
        ConfigService.getRoles(),
        ConfigService.getChannels(),
        ConfigService.getRates(),
        ConfigService.getPermissions(),
      ]);

      const embed = baseEmbed()
        .setTitle('⚙️ Configuration Lawrence Beignets')
        .addFields(
          { name: '🎭 Rôles configurés', value: String(Object.values(roles).filter(Boolean).length) + ' / ' + Object.keys(roles).length, inline: true },
          { name: '📁 Salons configurés', value: String(Object.values(channels).filter(Boolean).length), inline: true },
          { name: '💰 Tarifs', value: Object.entries(rates).map(([g, r]) => `${GRADE_LABELS[g] || g} : ${formatMoney(r)}`).join('\n') },
          { name: '🔧 Managers peuvent payer', value: permissions.managerCanPay ? '✅ Oui' : '❌ Non' }
        );
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'tarif') {
      const grade = interaction.options.getString('grade');
      const montant = interaction.options.getInteger('montant');
      await ConfigService.set('rates', { [grade]: montant });
      await LogService.log(interaction.client, { action: 'TARIF MODIFIÉ', actorId: interaction.user.id, details: { Grade: GRADE_LABELS[grade], Tarif: formatMoney(montant) } });
      await interaction.reply({ embeds: [successEmbed('✅ Tarif mis à jour', `${GRADE_LABELS[grade]} → ${formatMoney(montant)} / beignet`)], ephemeral: true });
      return;
    }

    if (sub === 'paiement-manager') {
      const actif = interaction.options.getBoolean('actif');
      await ConfigService.set('permissions', { managerCanPay: actif });
      await LogService.log(interaction.client, { action: 'PERMISSION MODIFIÉE', actorId: interaction.user.id, details: { 'Managers peuvent payer': actif ? 'Oui' : 'Non' } });
      await interaction.reply({ embeds: [successEmbed('✅ Permission mise à jour', actif ? 'Les Managers peuvent désormais utiliser /payer.' : 'Les Managers ne peuvent plus utiliser /payer.')], ephemeral: true });
    }
  },
};
