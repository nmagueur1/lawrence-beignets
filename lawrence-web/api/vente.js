'use strict';

const { requireAuth } = require('./_lib/auth');
const { createSaleRequest } = require('./_lib/data');
const { notifyDiscord } = require('./_lib/webhook');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const quantity = Number(req.body?.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'quantity doit être un entier positif.' });
    }

    const request = await createSaleRequest({ employeeId: auth.discordId, quantity, source: 'WEB' });

    await notifyDiscord({
      title: '🍩 Nouvelle déclaration de vente (site web)',
      description: `<@${auth.discordId}> déclare **${quantity} beignets** vendus (\`${request.requestId}\`).\nÀ valider avec \`/valider-vente\`.`,
    });

    res.json({ ok: true, requestId: request.requestId });
  } catch (err) {
    console.error('[lawrence-web][vente]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
