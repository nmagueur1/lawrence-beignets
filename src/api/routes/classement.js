'use strict';

const express = require('express');
const employeeRepo = require('../../database/repositories/employeeRepo');
const { GRADE_LABELS } = require('../../config/constants');

const router = express.Router();

const FIELD_BY_TYPE = { points: 'points', ventes: 'totalBeignets', gains: 'totalEarned' };

router.get('/', async (req, res) => {
  try {
    const type = String(req.query.type || 'points');
    const field = FIELD_BY_TYPE[type];
    if (!field) return res.status(400).json({ error: 'type invalide (points|ventes|gains)' });

    const employees = await employeeRepo.listAllActive();
    const sorted = [...employees].sort((a, b) => (b[field] || 0) - (a[field] || 0)).slice(0, 10);

    res.json({
      type,
      ranking: sorted.map((e, i) => ({
        rank: i + 1,
        rpName: e.rpName || e.username || 'Employé',
        grade: e.grade,
        gradeLabel: GRADE_LABELS[e.grade] || e.grade,
        value: e[field] || 0,
      })),
    });
  } catch (err) {
    console.error('[tablet-api][classement]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
