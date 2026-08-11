'use strict';

const express = require('express');
const ConfigService = require('../../services/ConfigService');

const router = express.Router();

router.get('/reglement', async (req, res) => {
  try {
    const reglement = await ConfigService.get('reglement');
    res.json({ content: reglement?.content || 'Aucun règlement configuré pour le moment.' });
  } catch (err) {
    console.error('[tablet-api][company/reglement]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
