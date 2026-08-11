'use strict';

const { resolveSession } = require('./session');
const { getEmployee } = require('./data');

/**
 * Vérifie la session (cookie httpOnly) et charge l'employé correspondant.
 * Écrit directement la réponse d'erreur (401/403) et renvoie null si la
 * requête doit s'arrêter là — évite de dupliquer ce bloc dans chaque route.
 */
async function requireAuth(req, res) {
  const session = await resolveSession(req);
  if (!session) {
    res.status(401).json({ error: 'Non connecté.', linked: false });
    return null;
  }

  const employee = await getEmployee(session.discordId);
  if (!employee) {
    res.status(403).json({ error: "Ce compte n'est plus employé de Lawrence Beignets." });
    return null;
  }

  return { discordId: session.discordId, employee };
}

module.exports = { requireAuth };
