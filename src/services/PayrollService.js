'use strict';

const { db, FieldValue } = require('../database/firebase');
const ConfigService = require('./ConfigService');
const PointService = require('./PointService');
const employeeRepo = require('../database/repositories/employeeRepo');
const saleRepo = require('../database/repositories/saleRepo');
const paymentRepo = require('../database/repositories/paymentRepo');
const { generateSaleId } = require('../utils/ids');
const { AppError } = require('../utils/errors');
const { baseEmbed } = require('../utils/embeds');
const { formatMoney, formatNumber, discordTimestamp } = require('../utils/format');
const { GRADE_LABELS, BRAND } = require('../config/constants');

async function getRateForGrade(grade) {
  const rates = await ConfigService.getRates();
  return rates[grade];
}

/**
 * Fonction pure : PRIME = QUANTITÉ × TARIF DU GRADE.
 */
function calculateSaleAmount(quantity, rate) {
  return Math.round(quantity * rate);
}

/**
 * Enregistre une vente validée de façon atomique (vente + solde employé + points
 * dans une seule transaction Firestore). Le tarif est figé au moment de la vente :
 * un changement de grade ultérieur ne modifie jamais les ventes passées.
 */
async function recordValidatedSale({ employeeId, quantity, grade, rate, validatedBy, evidenceChannelId }) {
  const amount = calculateSaleAmount(quantity, rate);
  const rule = await PointService.getApplicableRule(quantity);
  const saleId = await generateSaleId();

  const result = await db.runTransaction(async (tx) => {
    const employeeRef = db.collection('employees').doc(employeeId);
    const employeeSnap = await tx.get(employeeRef);
    if (!employeeSnap.exists) {
      throw new AppError('employé introuvable au moment de la validation', { userMessage: "❌ Cet employé n'existe plus." });
    }

    const saleRef = db.collection('sales').doc(saleId);
    const pointRef = rule ? db.collection('points').doc() : null;

    const salePayload = {
      saleId,
      employeeId,
      quantity,
      grade,
      rate,
      amount,
      validatedBy,
      validatedAt: FieldValue.serverTimestamp(),
      status: 'VALIDATED',
      evidenceChannelId: evidenceChannelId || null,
      pointsAwarded: rule?.points || 0,
      pointTransactionId: pointRef?.id || null,
    };
    tx.set(saleRef, salePayload);

    tx.update(employeeRef, {
      totalBeignets: FieldValue.increment(quantity),
      totalEarned: FieldValue.increment(amount),
      balance: FieldValue.increment(amount),
      points: FieldValue.increment(rule?.points || 0),
      lastSaleAt: FieldValue.serverTimestamp(),
    });

    if (rule && pointRef) {
      tx.set(pointRef, {
        employeeId,
        amount: rule.points,
        type: 'SALE',
        reason: rule.name,
        sourceId: saleId,
        ruleId: rule.id,
        createdBy: validatedBy,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return { ...salePayload, validatedAt: new Date() };
  });

  const employee = await employeeRepo.get(employeeId);
  return { sale: result, employee, rule };
}

/**
 * Enregistre un paiement. Bloque si le montant dépasse le reste à payer actuel,
 * pour éviter les erreurs de saisie (solde négatif).
 */
async function recordPayment({ employeeId, amount, paidBy, comment }) {
  if (amount <= 0) {
    throw new AppError('montant de paiement invalide', { userMessage: '❌ Le montant doit être supérieur à 0.' });
  }

  const paymentRef = db.collection('payments').doc();

  const result = await db.runTransaction(async (tx) => {
    const employeeRef = db.collection('employees').doc(employeeId);
    const employeeSnap = await tx.get(employeeRef);
    if (!employeeSnap.exists) {
      throw new AppError('employé introuvable', { userMessage: "❌ Cet employé n'existe plus." });
    }

    const employee = employeeSnap.data();
    const balanceBefore = employee.balance || 0;

    if (amount > balanceBefore) {
      throw new AppError('paiement supérieur au solde', {
        userMessage: `❌ Le montant (${amount} $) dépasse le reste à payer actuel (${balanceBefore} $).`,
      });
    }

    const balanceAfter = balanceBefore - amount;

    tx.set(paymentRef, {
      paymentId: paymentRef.id,
      employeeId,
      amount,
      paidBy,
      paidAt: FieldValue.serverTimestamp(),
      comment: comment || null,
      reference: paymentRef.id,
      balanceBefore,
      balanceAfter,
    });

    tx.update(employeeRef, {
      totalPaid: FieldValue.increment(amount),
      balance: FieldValue.increment(-amount),
    });

    return { balanceBefore, balanceAfter };
  });

  const employee = await employeeRepo.get(employeeId);
  return { ...result, employee, paymentId: paymentRef.id };
}

async function getHistory(employeeId) {
  const [sales, payments] = await Promise.all([saleRepo.listByEmployee(employeeId), paymentRepo.listByEmployee(employeeId)]);
  const merged = [
    ...sales.map((s) => ({ kind: 'SALE', date: s.validatedAt, ...s })),
    ...payments.map((p) => ({ kind: 'PAYMENT', date: p.paidAt, ...p })),
  ];
  merged.sort((a, b) => toMillis(b.date) - toMillis(a.date));
  return merged;
}

function toMillis(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return 0;
}

async function buildSalaireEmbed(employee, user) {
  const salesCount = await saleRepo.countByEmployee(employee.discordId);
  const embed = baseEmbed()
    .setTitle(`${BRAND.EMOJI} LAWRENCE BEIGNETS`)
    .setDescription('💰 **SITUATION DE PAIE**')
    .setThumbnail(user?.displayAvatarURL ? user.displayAvatarURL() : null)
    .addFields(
      { name: '👤 Employé', value: `<@${employee.discordId}>`, inline: true },
      { name: '🎭 Grade', value: GRADE_LABELS[employee.grade] || employee.grade, inline: true },
      { name: '​', value: '​', inline: true },
      { name: '🍩 Beignets vendus', value: formatNumber(employee.totalBeignets || 0), inline: true },
      { name: '💰 Total généré', value: formatMoney(employee.totalEarned || 0), inline: true },
      { name: '💸 Total payé', value: formatMoney(employee.totalPaid || 0), inline: true },
      { name: '🧾 RESTE À PAYER', value: formatMoney(employee.balance || 0), inline: true },
      { name: '📊 Nombre de ventes', value: formatNumber(salesCount), inline: true },
      {
        name: '📅 Dernière vente',
        value: employee.lastSaleAt ? discordTimestamp(employee.lastSaleAt.toDate ? employee.lastSaleAt.toDate() : employee.lastSaleAt) : 'Aucune',
        inline: true,
      }
    );
  return embed;
}

function buildHistoryLine(entry) {
  const date = discordTimestamp(entry.date?.toDate ? entry.date.toDate() : entry.date, 'd');
  if (entry.kind === 'SALE') {
    return `🍩 **${entry.saleId}** — ${entry.quantity} beignets → +${formatMoney(entry.amount)} · ${date}`;
  }
  return `💸 **Paiement** — ${formatMoney(entry.amount)} · ${date}${entry.comment ? ` · _${entry.comment}_` : ''}`;
}

module.exports = {
  getRateForGrade,
  calculateSaleAmount,
  recordValidatedSale,
  recordPayment,
  getHistory,
  buildSalaireEmbed,
  buildHistoryLine,
};
