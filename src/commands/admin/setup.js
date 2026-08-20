'use strict';

const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const ConfigService = require('../../services/ConfigService');
const PanelService = require('../../services/PanelService');
const LogService = require('../../services/LogService');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { AppError } = require('../../utils/errors');
const RecruitmentService = require('../../services/RecruitmentService');
const PointService = require('../../services/PointService');
const BadgeService = require('../../services/BadgeService');
const pointRuleRepo = require('../../database/repositories/pointRuleRepo');
const { ROLE_BLUEPRINT, CHANNEL_STRUCTURE, PAY_CATEGORY_NAME, POINT_RULE_TYPE } = require('../../config/constants');

async function detectRoles(guild) {
  const existing = await ConfigService.getRoles();
  const roles = { ...existing };
  const missing = [];

  for (const { key, name } of ROLE_BLUEPRINT) {
    // Réutilise l'ID déjà connu s'il correspond toujours à un rôle existant.
    if (roles[key] && guild.roles.cache.has(roles[key])) continue;

    const found = guild.roles.cache.find((r) => r.name.trim() === name.trim());
    if (found) {
      roles[key] = found.id;
    } else {
      roles[key] = null;
      missing.push(name);
    }
  }

  await ConfigService.set('roles', roles);
  return { roles, missing };
}

/**
 * Détecte les salons/catégories attendus par nom exact, exactement comme
 * `detectRoles` pour les rôles : ne crée jamais rien sur le serveur, se
 * contente de retrouver ce qui existe déjà et de signaler ce qui manque.
 * Un salon manquant doit être créé manuellement puis retrouvé à la prochaine
 * relance de `/setup`.
 */
async function detectChannels(guild) {
  const existing = await ConfigService.getChannels();
  const channels = { ...existing };
  const missing = [];
  const found = [];

  for (const group of CHANNEL_STRUCTURE) {
    for (const { key, name } of group.channels) {
      // Réutilise l'ID déjà connu s'il correspond toujours à un salon existant.
      if (channels[key] && guild.channels.cache.has(channels[key])) {
        found.push(name);
        continue;
      }

      const match = guild.channels.cache.find((c) => c.name === name && c.type === ChannelType.GuildText);
      if (match) {
        channels[key] = match.id;
        found.push(name);
      } else {
        channels[key] = null;
        missing.push(name);
      }
    }
  }

  // Catégorie des fiches de paie individuelles : détectée uniquement, jamais créée.
  if (channels.payCategory && guild.channels.cache.has(channels.payCategory)) {
    found.push(PAY_CATEGORY_NAME);
  } else {
    const payCategory = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === PAY_CATEGORY_NAME);
    if (payCategory) {
      channels.payCategory = payCategory.id;
      found.push(PAY_CATEGORY_NAME);
    } else {
      channels.payCategory = null;
      missing.push(PAY_CATEGORY_NAME);
    }
  }

  await ConfigService.set('channels', channels);
  return { channels, missing, found };
}

async function initDefaultConfig() {
  // ensureDoc via ConfigService.get() crée déjà les documents avec leurs valeurs par défaut
  // s'ils n'existent pas encore : on force juste leur initialisation ici.
  await ConfigService.get('rates');
  await ConfigService.get('permissions');
  await ConfigService.get('recruitment');
  await ConfigService.get('reports');
  await ConfigService.get('badges');
  await ConfigService.get('tickets');
  await ConfigService.get('announcements');
  await ConfigService.get('counters');
  await ConfigService.get('maintenance');
}

/**
 * Sème deux règles d'exemple si le barème de points est totalement vide, pour que
 * le système fonctionne dès le premier /setup. Éditable ensuite via /points-regle.
 * N'écrase jamais des règles existantes (idempotent).
 */
async function seedDefaultPointRules() {
  const existing = await pointRuleRepo.listAll();
  if (existing.length) return false;

  await PointService.createRule({ name: 'Vente 500 beignets', type: POINT_RULE_TYPE.SALE_THRESHOLD, threshold: 500, points: 50, description: 'Exemple — modifiable via /points-regle' });
  await PointService.createRule({ name: 'Vente 1000 beignets', type: POINT_RULE_TYPE.SALE_THRESHOLD, threshold: 1000, points: 120, description: 'Exemple — modifiable via /points-regle' });
  return true;
}

async function postPanels(client, guild, channels) {
  await PanelService.postOrUpdate(client, channels.accueil, 'accueilPanelId', PanelService.buildAccueilPanel(guild, channels));
  await PanelService.postOrUpdate(client, channels.informations, 'informationsMessageId', PanelService.buildInformationsEmbed());

  const reglementConfig = await ConfigService.get('reglement');
  await PanelService.postOrUpdate(
    client,
    channels.reglement,
    'reglementMessageId',
    PanelService.buildReglementEmbed(reglementConfig?.content)
  );

  const recruitmentOpen = await RecruitmentService.getStatus();
  await PanelService.postOrUpdate(
    client,
    channels.recrutementOn,
    'recrutementPanelId',
    RecruitmentService.buildRecruitmentPanel(recruitmentOpen)
  );

  await PanelService.postOrUpdate(client, channels.contact, 'contactPanelId', PanelService.buildContactPanel());
  await PanelService.postOrUpdate(client, channels.localisation, 'localisationMessageId', PanelService.buildLocalisationEmbed());
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Détecte la config serveur (rôles, salons, panels). Ne crée jamais de salon ni de rôle.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const roles = await ConfigService.getRoles();
    const rolesNotYetConfigured = !roles.patron && !roles.coPatron;

    // Cas particulier du tout premier /setup : les rôles PATRON/CO-PATRON ne sont
    // pas encore détectés en base, donc isDirection() ne peut encore reconnaître
    // personne (même le vrai Patron). On autorise ce cas précis à quiconque a la
    // permission Administrateur Discord (déjà requise pour même voir la commande),
    // le temps que /setup détecte et enregistre les rôles.
    const isDirection = await PermissionService.isDirection(interaction.member);
    const isBootstrapAdmin = rolesNotYetConfigured && interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isDirection && !isBootstrapAdmin) {
      throw new AppError('setup: accès refusé', { userMessage: '❌ Seule la Direction (PATRON / CO-PATRON) peut utiliser /setup.' });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const { missing: missingRoles } = await detectRoles(guild);
    const { channels, missing: missingChannels, found: foundChannels } = await detectChannels(guild);
    await initDefaultConfig();
    const rulesSeeded = await seedDefaultPointRules();
    await BadgeService.seedCatalog();
    await postPanels(interaction.client, guild, channels);

    await LogService.log(interaction.client, {
      action: 'SETUP',
      actorId: interaction.user.id,
      details: {
        'Salons détectés': foundChannels.length,
        'Salons manquants': missingChannels.length ? missingChannels.join(', ') : 'aucun',
        'Rôles manquants': missingRoles.length ? missingRoles.join(', ') : 'aucun',
      },
    });

    const embed = successEmbed('✅ Setup terminé', 'La configuration a été détectée et appliquée avec succès.').addFields(
      { name: '📁 Salons détectés', value: String(foundChannels.length), inline: true },
      {
        name: '🚧 Salons manquants',
        value: missingChannels.length ? missingChannels.map((c) => `• ${c}`).join('\n') : 'Aucun — tous détectés ✅',
      },
      {
        name: '🎭 Rôles manquants',
        value: missingRoles.length ? missingRoles.map((r) => `• ${r}`).join('\n') : 'Aucun — tous détectés ✅',
      },
      {
        name: '🏆 Barème de points',
        value: rulesSeeded ? 'Règles d\'exemple créées (500→50, 1000→120), modifiables via `/points-regle`.' : 'Déjà configuré.',
      }
    );

    if (missingRoles.length || missingChannels.length) {
      embed.setDescription(
        "⚠️ Certains rôles ou salons n'ont pas été trouvés sur le serveur (nom exact requis) — `/setup` ne les crée plus automatiquement. Crée-les toi-même puis relance `/setup`."
      );
    }

    if (isBootstrapAdmin && !isDirection) {
      embed.addFields({
        name: 'ℹ️ Premier lancement',
        value: "Exécuté via ton accès Administrateur Discord (les rôles PATRON/CO-PATRON n'étaient pas encore configurés). Les prochains `/setup` seront réservés à la Direction.",
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
