'use strict';

const { requireAuth } = require('./_lib/auth');
const { getSalesHistory, getPaymentsHistory } = require('./_lib/data');

function toIso(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
  return d ? d.toISOString() : null;
}

module.exports = async (req, res) => {
  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const [sales, payments] = await Promise.all([getSalesHistory(auth.discordId), getPaymentsHistory(auth.discordId)]);

    const history = [
      ...sales.map((s) => ({ kind: 'SALE', saleId: s.saleId, quantity: s.quantity, amount: s.amount, date: toIso(s.validatedAt) })),
      ...payments.map((p) => ({ kind: 'PAYMENT', amount: p.amount, comment: p.comment || null, date: toIso(p.paidAt) })),
    ]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 20);

    res.json({
      balance: auth.employee.balance || 0,
      totalEarned: auth.employee.totalEarned || 0,
      totalPaid: auth.employee.totalPaid || 0,
      history,
    });
  } catch (err) {
    console.error('[lawrence-web][salaire]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
