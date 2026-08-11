'use strict';

const { requireAuth } = require('./_lib/auth');
const { getPointsHistory } = require('./_lib/data');

module.exports = async (req, res) => {
  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const history = await getPointsHistory(auth.discordId);
    res.json({
      points: auth.employee.points || 0,
      history: history.map((h) => ({
        amount: h.amount,
        reason: h.reason || h.type,
        date: h.createdAt?.toDate ? h.createdAt.toDate().toISOString() : null,
      })),
    });
  } catch (err) {
    console.error('[lawrence-web][points]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
