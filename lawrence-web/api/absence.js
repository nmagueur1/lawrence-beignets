'use strict';

const { requireAuth } = require('./_lib/auth');
const { createAbsenceRequest } = require('./_lib/data');
const { notifyDiscord } = require('./_lib/webhook');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;

    const { startDate, endDate, reason, comment } = req.body || {};
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'startDate, endDate et reason sont requis.' });
    }

    const absence = await createAbsenceRequest({ employeeId: auth.discordId, startDate, endDate, reason, comment });

    await notifyDiscord({
      title: "📅 Nouvelle demande d'absence (site web)",
      description: `<@${auth.discordId}> — ${startDate} → ${endDate}\nMotif : ${reason}`,
    });

    res.json({ ok: true, absence });
  } catch (err) {
    console.error('[lawrence-web][absence]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
