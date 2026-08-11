'use strict';

const express = require('express');
const { resolvePlayer } = require('../middleware/auth');
const { GRADE_LABELS } = require('../../config/constants');

const router = express.Router();

router.get('/:identifier/profile', resolvePlayer, async (req, res) => {
  const e = req.employee;
  res.json({
    discordId: e.discordId,
    rpName: e.rpName,
    grade: e.grade,
    gradeLabel: GRADE_LABELS[e.grade] || e.grade,
    joinedAt: e.joinedAt,
    totalBeignets: e.totalBeignets || 0,
    totalEarned: e.totalEarned || 0,
    totalPaid: e.totalPaid || 0,
    balance: e.balance || 0,
    points: e.points || 0,
    badges: e.badges || [],
  });
});

module.exports = router;
