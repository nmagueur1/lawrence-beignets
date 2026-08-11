'use strict';

const { requireAuth } = require('./_lib/auth');
const { listActiveEmployees } = require('./_lib/data');
const { GRADE_LABELS } = require('./_lib/constants');

const FIELD_BY_TYPE = { points: 'points', ventes: 'totalBeignets', gains: 'totalEarned' };

module.exports = async (req, res) => {
  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const type = String(req.query.type || 'points');
    const field = FIELD_BY_TYPE[type];
    if (!field) return res.status(400).json({ error: 'type invalide (points|ventes|gains)' });

    const employees = await listActiveEmployees();
    const sorted = [...employees].sort((a, b) => (b[field] || 0) - (a[field] || 0)).slice(0, 10);

    res.json({
      type,
      ranking: sorted.map((e, i) => ({
        rank: i + 1,
        rpName: e.rpName || e.username || 'Employé',
        gradeLabel: GRADE_LABELS[e.grade] || e.grade,
        value: e[field] || 0,
      })),
    });
  } catch (err) {
    console.error('[lawrence-web][classement]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
