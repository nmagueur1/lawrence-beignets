'use strict';

const { errorEmbed } = require('./embeds');

class AppError extends Error {
  constructor(message, { userMessage } = {}) {
    super(message);
    this.userMessage = userMessage || 'Une erreur est survenue. Réessaie dans quelques instants.';
  }
}

/**
 * Aucune erreur technique brute ne doit jamais atteindre l'utilisateur.
 * Les détails vont dans les logs serveur, l'utilisateur reçoit un message générique.
 */
async function safeReply(interaction, err, context = '') {
  console.error(`[Erreur${context ? ' ' + context : ''}]`, err);

  const userMessage = err instanceof AppError ? err.userMessage : '❌ Une erreur est survenue. Réessaie dans quelques instants.';
  const embed = errorEmbed('❌ Erreur', userMessage);

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed], components: [] });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (replyErr) {
    console.error('[Erreur] impossible de répondre à l\'interaction :', replyErr);
  }
}

module.exports = { AppError, safeReply };
