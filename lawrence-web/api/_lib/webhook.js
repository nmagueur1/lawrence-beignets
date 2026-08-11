'use strict';

/**
 * Même principe que src/api/discordWebhook.js côté tablette : notification
 * best-effort, ignorée silencieusement si TABLET_NOTIFY_WEBHOOK_URL n'est
 * pas configurée.
 */
async function notifyDiscord({ title, description }) {
  const url = process.env.TABLET_NOTIFY_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [{ title, description, color: 0xe8a33d }] }),
    });
  } catch (err) {
    console.error('[lawrence-web][webhook]', err);
  }
}

module.exports = { notifyDiscord };
