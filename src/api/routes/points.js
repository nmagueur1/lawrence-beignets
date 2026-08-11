'use strict';

const express = require('express');
const { resolvePlayer } = require('../middleware/auth');
const PointService = require('../../services/PointService');

const router = express.Router();

router.get('/:identifier/points', resolvePlayer, async (req, res) => {
  try {
    const history = await PointService.getHistory(req.discordId);
    res.json({
      points: req.employee.points || 0,
      history: history.slice(0, 20).map((h) => ({
        amount: h.amount,
        reason: h.reason || h.type,
        date: h.createdAt?.toDate ? h.createdAt.toDate().toISOString() : null,
      })),
    });
  } catch (err) {
    console.error('[tablet-api][points]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
