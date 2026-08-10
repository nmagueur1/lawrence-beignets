'use strict';

const { safeReply } = require('../utils/errors');
const ConfigService = require('../services/ConfigService');
const PermissionService = require('../services/PermissionService');
const { warningEmbed } = require('../utils/embeds');

async function isBlockedByMaintenance(interaction) {
  const maintenance = await ConfigService.get('maintenance');
  if (!maintenance?.enabled) return false;
  const isDirection = await PermissionService.isDirection(interaction.member);
  return !isDirection;
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        if (await isBlockedByMaintenance(interaction)) {
          await interaction.reply({
            embeds: [warningEmbed('🔧 Maintenance', 'Le bot est actuellement en maintenance.')],
            ephemeral: true,
          });
          return;
        }

        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        const key = interaction.customId.split(':')[0];
        const handler = interaction.client.buttons.get(key) || interaction.client.buttons.get(interaction.customId);
        if (handler) await handler.execute(interaction);
        return;
      }

      if (interaction.isModalSubmit()) {
        const key = interaction.customId.split(':')[0];
        const handler = interaction.client.modals.get(interaction.customId) || interaction.client.modals.get(key);
        if (handler) await handler.execute(interaction);
        return;
      }

      if (interaction.isStringSelectMenu() || interaction.isUserSelectMenu()) {
        const key = interaction.customId.split(':')[0];
        const handler = interaction.client.selects.get(interaction.customId) || interaction.client.selects.get(key);
        if (handler) await handler.execute(interaction);
        return;
      }
    } catch (err) {
      await safeReply(interaction, err, `interaction:${interaction.type}`);
    }
  },
};
