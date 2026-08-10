'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PermissionService = require('../../services/PermissionService');
const EmployeeService = require('../../services/EmployeeService');
const BadgeService = require('../../services/BadgeService');
const sanctionRepo = require('../../database/repositories/sanctionRepo');
const absenceRepo = require('../../database/repositories/absenceRepo');
const { baseEmbed } = require('../../utils/embeds');
const { formatMoney, formatNumber, discordTimestamp } = require('../../utils/format');
const { GRADE_LABELS, BRAND } = require('../../config/constants');
const { AppError } = require('../../utils/errors');

async function assertAccess(interaction, targetId) {
  if (targetId === interaction.user.id) return;
  const allowed = await PermissionService.isManagerOrAbove(interaction.member);
  if (!allowed) throw new AppError('profil: accès refusé', { userMessage: '❌ Tu ne peux consulter que ton propre profil.' });
}

async function buildProfilEmbed(employee, user) {
  const [sanctionsCount, absencesCount, catalog] = await Promise.all([
    sanctionRepo.countByEmployee(employee.discordId),
    absenceRepo.countByEmployee(employee.discordId),
    BadgeService.getCatalog(),
  ]);

  return baseEmbed()
    .setTitle(`${BRAND.EMOJI} PROFIL EMPLOYÉ`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: '👤 Utilisateur', value: `<@${employee.discordId}>`, inline: true },
      { name: '🎭 Grade', value: GRADE_LABELS[employee.grade] || employee.grade, inline: true },
      { name: '📅 Recruté le', value: employee.joinedAt ? discordTimestamp(new Date(employee.joinedAt), 'd') : '—', inline: true },
      { name: '🍩 Beignets vendus', value: formatNumber(employee.totalBeignets || 0), inline: true },
      { name: '💰 Total généré', value: formatMoney(employee.totalEarned || 0), inline: true },
      { name: '💸 Total payé', value: formatMoney(employee.totalPaid || 0), inline: true },
      { name: '🧾 Reste à payer', value: formatMoney(employee.balance || 0), inline: true },
      { name: '🏆 Points', value: formatNumber(employee.points || 0), inline: true },
      { name: '⚠️ Sanctions', value: formatNumber(sanctionsCount), inline: true },
      { name: '📅 Absences', value: formatNumber(absencesCount), inline: true },
      { name: '🎖️ Badges', value: BadgeService.formatBadgeList(employee.badges, catalog) }
    );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profil')
    .setDescription('Afficher le profil complet d\'un employé')
    .addUserOption((o) => o.setName('employe').setDescription('Employé (par défaut : toi-même)').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('employe') || interaction.user;
    await assertAccess(interaction, targetUser.id);

    const employee = await EmployeeService.getEmployee(targetUser.id);
    if (!employee) throw new AppError('cible non employé', { userMessage: "❌ Cet utilisateur n'est pas un employé Lawrence Doughnuts enregistré." });

    const embed = await buildProfilEmbed(employee, targetUser);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  buildProfilEmbed,
  assertAccess,
};
