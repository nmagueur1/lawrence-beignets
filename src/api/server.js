'use strict';

require('dotenv').config();
const express = require('express');
const { requireApiKey } = require('./middleware/auth');
const linkRoute = require('./routes/link');
const profileRoute = require('./routes/profile');
const salaireRoute = require('./routes/salaire');
const pointsRoute = require('./routes/points');
const classementRoute = require('./routes/classement');
const venteRoute = require('./routes/vente');
const absenceRoute = require('./routes/absence');
const companyRoute = require('./routes/company');
const organigrammeRoute = require('./routes/organigramme');

/**
 * Process Node séparé du bot Discord (aucun `require` de src/index.js, aucune
 * connexion gateway ici). Sert de pont HTTP entre la ressource FiveM (tablette
 * NUI) et le même Firestore que le bot, en réutilisant ses services existants.
 * Démarrage : `npm run start:tablet-api` (indépendant de `npm start`).
 */
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, service: 'lawrence-beignets-tablet-api' }));

app.use(requireApiKey);

app.use('/link', linkRoute);
app.use('/player', profileRoute);
app.use('/player', salaireRoute);
app.use('/player', pointsRoute);
app.use('/player', venteRoute);
app.use('/player', absenceRoute);
app.use('/classement', classementRoute);
app.use('/company/organigramme', organigrammeRoute);
app.use('/company', companyRoute);

app.use((req, res) => res.status(404).json({ error: 'Route inconnue.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[tablet-api][unhandled]', err);
  res.status(500).json({ error: 'Erreur serveur.' });
});

const port = process.env.TABLET_API_PORT || 3939;
app.listen(port, () => {
  console.log(`[tablet-api] Lawrence Beignets — API tablette à l'écoute sur le port ${port}`);
});
