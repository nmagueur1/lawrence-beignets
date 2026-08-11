'use strict';

const express = require('express');
const { resolvePlayer } = require('../middleware/auth');
const saleRequestRepo = require('../../database/repositories/saleRequestRepo');
const { notifyDiscord } = require('../discordWebhook');

const router = express.Router();

/**
 * Déclaration de vente depuis la tablette. Ne modifie jamais le solde/points :
 * crée seulement une demande (`saleRequests`, status PENDING) et notifie le
 * staff. La validation reste entièrement entre les mains d'un Manager via
 * /valider-vente, exactement comme aujourd'hui — la tablette remplace juste
 * le ticket manuel par une remontée instantanée.
 */
router.post('/:identifier/vente', resolvePlayer, async (req, res) => {
  try {
    const quantity = Number(req.body?.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'quantity doit être un entier positif.' });
    }

    const request = await saleRequestRepo.create({ employeeId: req.discordId, quantity, source: 'TABLET' });

    await notifyDiscord({
      title: '🍩 Nouvelle déclaration de vente (tablette)',
      description: `<@${req.discordId}> déclare **${quantity} beignets** vendus (\`${request.requestId}\`).\nÀ valider avec \`/valider-vente\`.`,
    });

    res.json({ ok: true, requestId: request.requestId });
  } catch (err) {
    console.error('[tablet-api][vente]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
