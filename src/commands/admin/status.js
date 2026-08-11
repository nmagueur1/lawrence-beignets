'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../../database/firebase');
const { baseEmbed } = require('../../utils/embeds');

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}j ${h}h ${m}m`;
}

module.exports = {
  data: new SlashCommandBuilder().setName('status').setDescription('Afficher l\'état du bot Lawrence Beignets'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    let firebaseOk = true;
    try {
      await db.collection('config').limit(1).get();
    } catch {
      firebaseOk = false;
    }

    const memory = process.memoryUsage().rss / 1024 / 1024;

    const embed = baseEmbed()
      .setTitle('🟢 Statut Lawrence Beignets')
      .addFields(
        { name: 'Bot', value: '🟢 En ligne', inline: true },
        { name: 'Discord', value: `🟢 ${interaction.client.ws.ping}ms`, inline: true },
        { name: 'Firebase', value: firebaseOk ? '🟢 Connecté' : '🔴 Indisponible', inline: true },
        { name: 'Mémoire', value: `${memory.toFixed(1)} Mo`, inline: true },
        { name: 'Uptime', value: formatUptime(process.uptime()), inline: true }
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
