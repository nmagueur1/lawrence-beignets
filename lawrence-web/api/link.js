'use strict';

const { consumeCode } = require('./_lib/tabletLink');
const { createSession, setSessionCookie } = require('./_lib/session');
const { getEmployee } = require('./_lib/data');
const { GRADE_LABELS } = require('./_lib/constants');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code requis.' });

    const link = await consumeCode(code);
    if (!link) {
      return res.status(404).json({ error: 'Code invalide ou expiré. Régénère-en un avec /tablette lier sur Discord.' });
    }

    const token = await createSession(link.discordId);
    setSessionCookie(res, token);

    const employee = await getEmployee(link.discordId);
    res.json({
      ok: true,
      rpName: employee?.rpName || null,
      gradeLabel: employee ? GRADE_LABELS[employee.grade] || employee.grade : null,
    });
  } catch (err) {
    console.error('[lawrence-web][link]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
