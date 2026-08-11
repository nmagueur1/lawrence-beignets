'use strict';

const express = require('express');
const { resolvePlayer } = require('../middleware/auth');
const PayrollService = require('../../services/PayrollService');

const router = express.Router();

function toIso(date) {
  if (!date) return null;
  const d = date.toDate ? date.toDate() : date instanceof Date ? date : null;
  return d ? d.toISOString() : null;
}

function serializeEntry(entry) {
  if (entry.kind === 'SALE') {
    return { kind: 'SALE', saleId: entry.saleId, quantity: entry.quantity, amount: entry.amount, date: toIso(entry.date) };
  }
  return { kind: 'PAYMENT', amount: entry.amount, comment: entry.comment || null, date: toIso(entry.date) };
}

router.get('/:identifier/salaire', resolvePlayer, async (req, res) => {
  try {
    const history = await PayrollService.getHistory(req.discordId);
    res.json({
      balance: req.employee.balance || 0,
      totalEarned: req.employee.totalEarned || 0,
      totalPaid: req.employee.totalPaid || 0,
      history: history.slice(0, 20).map(serializeEntry),
    });
  } catch (err) {
    console.error('[tablet-api][salaire]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
