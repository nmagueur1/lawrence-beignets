'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const EmployeeService = require('../../services/EmployeeService');
const BadgeService = require('../../services/BadgeService');
const { baseEmbed } = require('../../utils/embeds');
const { BRAND } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

async function assertAccess(interaction, targetId) {
  if (targetId === interaction.user.id) return;
  const allowed = await PermissionService.isManagerOrAbove(interaction.member);
  if (!allowed) {
    throw new AppError('badges: accès refusé', { userMessage: '❌ Tu ne peux consulter que tes propres badges.' });
  }
}

async function buildBadgesEmbed(employee, user) {
  const { sections, ownedCount, totalCount } = await BadgeService.getCatalogProgress(employee);

  const embed = baseEmbed()
    .setTitle(`🎖️ ${BRAND.NAME} — Catalogue de badges`)
    .setThumbnail(user.displayAvatarURL())
    .setDescription(`<@${employee.discordId}> — **${ownedCount}/${totalCount}** badges obtenus ${BadgeService.buildProgressBar(ownedCount, totalCount)}`);

  for (const section of sections) {
    embed.addFields({ name: section.label, value: section.lines.join('\n') || '—' });
  }

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('badges')
    .setDescription('Afficher le catalogue de badges et sa progression')
    .addUserOption((o) => o.setName('employe').setDescription('Employé (par défaut : toi-même)').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('employe') || interaction.user;
    await assertAccess(interaction, targetUser.id);

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Beignets enregistré." });

    const embed = await buildBadgesEmbed(employee, targetUser);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  buildBadgesEmbed,
  assertAccess,
};
