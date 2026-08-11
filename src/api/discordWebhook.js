'use strict';

/**
 * Notification best-effort vers un salon Discord via webhook. Le process API
 * n'ouvre jamais de connexion gateway (pas de dépendance au client du bot) :
 * un webhook suffit pour pousser un message, et si TABLET_NOTIFY_WEBHOOK_URL
 * n'est pas configurée la notification est simplement ignorée (les données
 * sont de toute façon déjà écrites en Firestore).
 */
async function notifyDiscord({ title, description }) {
  const url = process.env.TABLET_NOTIFY_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{ title, description, color: 0xe8a33d }],
      }),
    });
  } catch (err) {
    console.error('[tablet-api][discordWebhook]', err);
  }
}

module.exports = { notifyDiscord };
