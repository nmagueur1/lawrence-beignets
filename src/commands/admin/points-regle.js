'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const PointService = require('../../services/PointService');
const LogService = require('../../services/LogService');
const { successEmbed, baseEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');
const { POINT_RULE_TYPE } = require('../../config/constants');

async function assertDirection(interaction) {
  const isDirection = await PermissionService.isDirection(interaction.member);
  if (!isDirection) {
    throw new AppError('points-regle: accès refusé', { userMessage: '❌ Seule la Direction peut gérer le barème de points.' });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('points-regle')
    .setDescription('Gérer le barème de points (Direction)')
    .addSubcommand((s) =>
      s
        .setName('ajouter')
        .setDescription('Ajouter une règle de points')
        .addStringOption((o) => o.setName('nom').setDescription('Nom de la règle').setRequired(true))
        .addIntegerOption((o) => o.setName('seuil').setDescription('Seuil de beignets vendus (par vente)').setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName('points').setDescription('Points attribués').setRequired(true).setMinValue(1))
        .addStringOption((o) => o.setName('description').setDescription('Description (optionnel)').setRequired(false))
    )
    .addSubcommand((s) =>
      s
        .setName('modifier')
        .setDescription('Modifier une règle existante')
        .addStringOption((o) => o.setName('id').setDescription('ID de la règle').setRequired(true))
        .addStringOption((o) => o.setName('nom').setDescription('Nouveau nom').setRequired(false))
        .addIntegerOption((o) => o.setName('seuil').setDescription('Nouveau seuil').setRequired(false))
        .addIntegerOption((o) => o.setName('points').setDescription('Nouveaux points').setRequired(false))
        .addBooleanOption((o) => o.setName('actif').setDescription('Activer/désactiver').setRequired(false))
    )
    .addSubcommand((s) => s.setName('supprimer').setDescription('Supprimer une règle').addStringOption((o) => o.setName('id').setDescription('ID de la règle').setRequired(true)))
    .addSubcommand((s) => s.setName('liste').setDescription('Lister les règles de points')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'liste') {
      const rules = await PointService.listRules();
      const embed = baseEmbed()
        .setTitle('🏆 Barème de points')
        .setDescription(rules.length ? rules.map((r) => PointService.buildRuleLine(r)).join('\n') : 'Aucune règle configurée.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    await assertDirection(interaction);

    if (sub === 'ajouter') {
      const rule = await PointService.createRule({
        name: interaction.options.getString('nom'),
        threshold: interaction.options.getInteger('seuil'),
        points: interaction.options.getInteger('points'),
        description: interaction.options.getString('description') || '',
        type: POINT_RULE_TYPE.SALE_THRESHOLD,
      });
      await LogService.log(interaction.client, { action: 'RÈGLE DE POINTS AJOUTÉE', actorId: interaction.user.id, details: { Règle: rule.name, ID: rule.id } });
      await interaction.reply({ embeds: [successEmbed('✅ Règle ajoutée', PointService.buildRuleLine(rule))], ephemeral: true });
      return;
    }

    if (sub === 'modifier') {
      const id = interaction.options.getString('id');
      const patch = {};
      if (interaction.options.getString('nom')) patch.name = interaction.options.getString('nom');
      if (interaction.options.getInteger('seuil') !== null) patch.threshold = interaction.options.getInteger('seuil');
      if (interaction.options.getInteger('points') !== null) patch.points = interaction.options.getInteger('points');
      if (interaction.options.getBoolean('actif') !== null) patch.enabled = interaction.options.getBoolean('actif');

      const rule = await PointService.updateRule(id, patch);
      if (!rule) throw new AppError('règle introuvable', { userMessage: '❌ Règle introuvable.' });

      await LogService.log(interaction.client, { action: 'RÈGLE DE POINTS MODIFIÉE', actorId: interaction.user.id, details: { ID: id } });
      await interaction.reply({ embeds: [successEmbed('✅ Règle modifiée', PointService.buildRuleLine(rule))], ephemeral: true });
      return;
    }

    if (sub === 'supprimer') {
      const id = interaction.options.getString('id');
      await PointService.deleteRule(id);
      await LogService.log(interaction.client, { action: 'RÈGLE DE POINTS SUPPRIMÉE', actorId: interaction.user.id, details: { ID: id } });
      await interaction.reply({ embeds: [successEmbed('✅ Règle supprimée', `ID \`${id}\``)], ephemeral: true });
    }
  },
};
