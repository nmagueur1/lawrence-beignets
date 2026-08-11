'use strict';

const { destroySession, clearSessionCookie } = require('./_lib/session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });
  try {
    await destroySession(req);
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    console.error('[lawrence-web][logout]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
