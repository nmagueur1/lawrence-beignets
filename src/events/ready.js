'use strict';

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[Lawrence Beignets] Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: '🍩 Lawrence Beignets' }],
      status: 'online',
    });
  },
};
