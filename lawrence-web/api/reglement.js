'use strict';

const { getReglement } = require('./_lib/data');

module.exports = async (req, res) => {
  try {
    const reglement = await getReglement();
    res.json({ content: reglement?.content || 'Aucun règlement configuré pour le moment.' });
  } catch (err) {
    console.error('[lawrence-web][reglement]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
