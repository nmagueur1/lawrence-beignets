'use strict';

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[Lawrence Doughnuts] Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: '🍩 Lawrence Doughnuts' }],
      status: 'online',
    });
  },
};
