'use strict';

const express = require('express');
const tabletLinkRepo = require('../../database/repositories/tabletLinkRepo');
const playerLinkRepo = require('../../database/repositories/playerLinkRepo');
const EmployeeService = require('../../services/EmployeeService');
const { GRADE_LABELS } = require('../../config/constants');

const router = express.Router();

/**
 * Consomme un code généré par /tablette lier (Discord) pour associer
 * l'identifiant FiveM du joueur à son discordId. Un code n'est utilisable
 * qu'une seule fois et expire après 5 minutes (voir tabletLinkRepo).
 */
router.post('/', async (req, res) => {
  try {
    const { code, identifier, playerName } = req.body || {};
    if (!code || !identifier) {
      return res.status(400).json({ error: 'code et identifier sont requis.' });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const link = await tabletLinkRepo.get(normalizedCode);
    if (!link) {
      return res.status(404).json({ error: 'Code invalide ou déjà utilisé.' });
    }
    if (link.expiresAt < Date.now()) {
      await tabletLinkRepo.remove(normalizedCode);
      return res.status(410).json({ error: 'Code expiré. Régénère-en un avec /tablette lier sur Discord.' });
    }

    await playerLinkRepo.link(String(identifier), link.discordId, { playerName: playerName || null });
    await tabletLinkRepo.remove(normalizedCode);

    const employee = await EmployeeService.getEmployee(link.discordId);
    res.json({
      ok: true,
      discordId: link.discordId,
      grade: employee?.grade || null,
      gradeLabel: employee ? GRADE_LABELS[employee.grade] || employee.grade : null,
      rpName: employee?.rpName || null,
    });
  } catch (err) {
    console.error('[tablet-api][link]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
