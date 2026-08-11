'use strict';

const express = require('express');
const { resolvePlayer } = require('../middleware/auth');
const AbsenceService = require('../../services/AbsenceService');
const { notifyDiscord } = require('../discordWebhook');

const router = express.Router();

/**
 * Réutilise AbsenceService.requestAbsence directement : la demande atterrit
 * dans la même collection `absences` que /absence demander sur Discord, donc
 * /absence historique et la validation staff fonctionnent sans changement.
 */
router.post('/:identifier/absence', resolvePlayer, async (req, res) => {
  try {
    const { startDate, endDate, reason, comment } = req.body || {};
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'startDate, endDate et reason sont requis.' });
    }

    const absence = await AbsenceService.requestAbsence({
      employeeId: req.discordId,
      startDate,
      endDate,
      reason,
      comment: comment || null,
    });

    await notifyDiscord({
      title: "📅 Nouvelle demande d'absence (tablette)",
      description: `<@${req.discordId}> — ${startDate} → ${endDate}\nMotif : ${reason}`,
    });

    res.json({ ok: true, absence });
  } catch (err) {
    console.error('[tablet-api][absence]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
