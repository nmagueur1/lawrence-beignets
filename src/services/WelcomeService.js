'use strict';

// Auto-suppression du message d'accueil après ce délai (2 minutes).
const WELCOME_DELETE_DELAY_MS = 2 * 60 * 1000;

// Plusieurs variantes pour ne pas répéter le même message à chaque arrivée.
// Une est tirée au hasard à chaque `guildMemberAdd`.
const WELCOME_MESSAGES = [
  (id) => `🍩 Un nouveau visage pousse la porte de **Lawrence Beignets**... Bienvenue à toi, <@${id}> !`,
  (id) => `🚪 *Ding !* La sonnette de la boutique retentit — <@${id}> vient d'arriver. Bienvenue chez Lawrence Beignets !`,
  (id) => `🍩 Lawrence Beignets accueille un•e nouveau•elle client•e : <@${id}> ! Installe-toi, ça sent bon le beignet frais.`,
  (id) => `👋 Bienvenue chez Lawrence Beignets, <@${id}> ! Une question ? Le salon contact est fait pour ça.`,
  (id) => `🍩 Une odeur de sucre glace flotte dans l'air... <@${id}> vient de rejoindre la boutique. Bienvenue !`,
  (id) => `🎉 Nouveau client repéré : <@${id}> ! Bienvenue chez Lawrence Beignets.`,
];

function pickWelcomeMessage(discordId) {
  const build = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
  return build(discordId);
}

/**
 * Poste un message d'accueil aléatoire (parmi WELCOME_MESSAGES) dans le salon
 * donné, puis le supprime automatiquement après WELCOME_DELETE_DELAY_MS.
 * N'interfère jamais avec le panel d'accueil permanent (`accueilPanelId`,
 * géré par PanelService) : c'est un message à part, temporaire.
 */
async function postWelcomeMessage(client, channelId, member) {
  if (!channelId) return null;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return null;

  const sent = await channel.send(pickWelcomeMessage(member.id)).catch((err) => {
    console.error(`[WelcomeService] échec envoi message d'accueil pour ${member.id}`, err);
    return null;
  });
  if (!sent) return null;

  setTimeout(() => {
    sent.delete().catch(() => null); // déjà supprimé manuellement, ou salon/message introuvable : sans conséquence
  }, WELCOME_DELETE_DELAY_MS);

  return sent;
}

module.exports = { postWelcomeMessage, WELCOME_DELETE_DELAY_MS };
