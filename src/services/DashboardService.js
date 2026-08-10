'use strict';

const employeeRepo = require('../database/repositories/employeeRepo');
const { baseEmbed } = require('../utils/embeds');
const { formatMoney, formatNumber } = require('../utils/format');
const { GRADE_LABELS, BRAND } = require('../config/constants');

async function getAggregates() {
  const employees = await employeeRepo.listAllActive();
  return employees.reduce(
    (acc, e) => {
      acc.count += 1;
      acc.totalBeignets += e.totalBeignets || 0;
      acc.totalEarned += e.totalEarned || 0;
      acc.totalPaid += e.totalPaid || 0;
      acc.balance += e.balance || 0;
      acc.points += e.points || 0;
      return acc;
    },
    { count: 0, totalBeignets: 0, totalEarned: 0, totalPaid: 0, balance: 0, points: 0 }
  );
}

async function buildMainEmbed() {
  const agg = await getAggregates();
  return baseEmbed()
    .setTitle(`${BRAND.EMOJI} LAWRENCE DOUGHNUTS`)
    .setDescription('Tableau de bord')
    .addFields(
      { name: '👥 Employés', value: formatNumber(agg.count), inline: true },
      { name: '🟢 Actifs', value: formatNumber(agg.count), inline: true },
      { name: '​', value: '​', inline: true },
      { name: '🍩 Beignets vendus', value: formatNumber(agg.totalBeignets), inline: true },
      { name: '💰 Total généré', value: formatMoney(agg.totalEarned), inline: true },
      { name: '💸 Total payé', value: formatMoney(agg.totalPaid), inline: true },
      { name: '🧾 Reste à payer', value: formatMoney(agg.balance), inline: true },
      { name: '🏆 Points', value: formatNumber(agg.points), inline: true }
    );
}

async function buildEmployeesEmbed() {
  const employees = await employeeRepo.listAllActive();
  const list = employees
    .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
    .map((e) => `<@${e.discordId}> — ${GRADE_LABELS[e.grade] || e.grade}`)
    .join('\n');
  return baseEmbed().setTitle('👥 Employés').setDescription(list || 'Aucun employé.');
}

async function buildVentesEmbed() {
  const agg = await getAggregates();
  return baseEmbed()
    .setTitle('🍩 Ventes')
    .addFields(
      { name: 'Beignets vendus (total)', value: formatNumber(agg.totalBeignets) },
      { name: 'Montant généré (total)', value: formatMoney(agg.totalEarned) }
    );
}

async function buildPaiesEmbed() {
  const employees = await employeeRepo.listAllActive();
  const unpaid = employees
    .filter((e) => (e.balance || 0) > 0)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 10)
    .map((e) => `<@${e.discordId}> — ${formatMoney(e.balance)}`)
    .join('\n');
  return baseEmbed().setTitle('💰 Paies — Restes à payer').setDescription(unpaid || 'Aucun reste à payer 🎉');
}

async function buildPointsEmbed() {
  const employees = await employeeRepo.listAllActive();
  const top = employees
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 10)
    .map((e, i) => `${i + 1}. <@${e.discordId}> — ${formatNumber(e.points || 0)} pts`)
    .join('\n');
  return baseEmbed().setTitle('🏆 Points — Top 10').setDescription(top || 'Aucune donnée.');
}

module.exports = { getAggregates, buildMainEmbed, buildEmployeesEmbed, buildVentesEmbed, buildPaiesEmbed, buildPointsEmbed };
