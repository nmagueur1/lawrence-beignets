'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const SanctionService = require('../../services/SanctionService');
const { baseEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sanctions')
    .setDescription("Consulter l'historique des sanctions d'un employé")
    .addUserOption((o) => o.setName('employe').setDescription('Employé (par défaut : toi-même)').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('employe') || interaction.user;

    if (targetUser.id !== interaction.user.id) {
      const allowed = await PermissionService.isManagerOrAbove(interaction.member);
      if (!allowed) throw new AppError('sanctions: accès refusé', { userMessage: '❌ Tu ne peux consulter que tes propres sanctions.' });
    }

    const history = await SanctionService.getHistory(targetUser.id);
    const embed = baseEmbed()
      .setTitle(`⚠️ Sanctions — ${targetUser.username}`)
      .setDescription(history.length ? history.map((s) => SanctionService.buildSanctionLine(s)).join('\n') : 'Aucune sanction.');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
