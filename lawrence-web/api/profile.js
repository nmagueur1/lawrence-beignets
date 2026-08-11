'use strict';

const { requireAuth } = require('./_lib/auth');
const { GRADE_LABELS } = require('./_lib/constants');

module.exports = async (req, res) => {
  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const e = auth.employee;
    res.json({
      discordId: e.discordId,
      rpName: e.rpName,
      grade: e.grade,
      gradeLabel: GRADE_LABELS[e.grade] || e.grade,
      totalBeignets: e.totalBeignets || 0,
      totalEarned: e.totalEarned || 0,
      totalPaid: e.totalPaid || 0,
      balance: e.balance || 0,
      points: e.points || 0,
      badges: e.badges || [],
    });
  } catch (err) {
    console.error('[lawrence-web][profile]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
