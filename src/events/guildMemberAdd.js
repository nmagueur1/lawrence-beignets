'use strict';

const ConfigService = require('../services/ConfigService');
const WelcomeService = require('../services/WelcomeService');
const LogService = require('../services/LogService');

module.exports = {
  name: 'guildMemberAdd',

  /**
   * À l'arrivée de tout nouveau membre : attribution automatique du rôle
   * Visiteur (config/roles.visiteur) et message d'accueil aléatoire posté dans
   * #accueil (config/channels.accueil), auto-supprimé après 2 minutes.
   * Les deux passent par ConfigService (jamais d'ID en dur ici), donc
   * dépendent de rôles/salons déjà détectés par `/setup`.
   */
  async execute(member, client) {
    const roles = await ConfigService.getRoles();
    if (roles.visiteur) {
      await member.roles.add(roles.visiteur).catch((err) => {
        console.error(`[guildMemberAdd] échec ajout du rôle Visiteur à ${member.id}`, err);
      });
    } else {
      console.error('[guildMemberAdd] rôle Visiteur non configuré (config/roles.visiteur) — relance /setup si le rôle existe.');
    }

    const channels = await ConfigService.getChannels();
    await WelcomeService.postWelcomeMessage(client, channels.accueil, member);

    await LogService.log(client, {
      action: 'NOUVEAU MEMBRE',
      targetUserId: member.id,
    });
  },
};
