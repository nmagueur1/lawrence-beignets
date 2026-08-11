'use strict';

const playerLinkRepo = require('../../database/repositories/playerLinkRepo');
const EmployeeService = require('../../services/EmployeeService');

/**
 * Toute requête doit porter le header X-Api-Key (secret partagé). Ce secret
 * n'est connu QUE du serveur FiveM (côté server-side lua) : jamais transmis au
 * client NUI, donc jamais visible par le joueur.
 */
function requireApiKey(req, res, next) {
  if (!process.env.TABLET_API_KEY) {
    return res.status(500).json({ error: 'TABLET_API_KEY non configurée côté serveur.' });
  }
  const key = req.header('X-Api-Key');
  if (!key || key !== process.env.TABLET_API_KEY) {
    return res.status(401).json({ error: 'Clé API invalide.' });
  }
  next();
}

/**
 * Résout req.params.identifier (identifiant FiveM, ex: "license:abcd1234")
 * vers un employé Lawrence Beignets. Attache req.discordId et req.employee.
 */
async function resolvePlayer(req, res, next) {
  try {
    const identifier = req.params.identifier;
    if (!identifier) return res.status(400).json({ error: 'identifiant manquant' });

    const link = await playerLinkRepo.getByIdentifier(identifier);
    if (!link) {
      return res.status(404).json({
        error: "Identifiant non lié. Sur Discord, lance /tablette lier puis entre le code en jeu.",
        linked: false,
      });
    }

    const employee = await EmployeeService.getEmployee(link.discordId);
    if (!employee) {
      return res.status(403).json({ error: "Ce compte n'est plus employé de Lawrence Beignets." });
    }

    req.discordId = link.discordId;
    req.employee = employee;
    next();
  } catch (err) {
    console.error('[tablet-api][resolvePlayer]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = { requireApiKey, resolvePlayer };
