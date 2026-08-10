'use strict';

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const cron = require('node-cron');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const weeklyReportJob = require('./jobs/weeklyReport');
const employeeOfMonthJob = require('./jobs/employeeOfMonth');

function loadModulesRecursive(dir) {
  const modules = [];
  if (!fs.existsSync(dir)) return modules;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      modules.push(...loadModulesRecursive(fullPath));
    } else if (entry.name.endsWith('.js')) {
      modules.push(require(fullPath));
    }
  }
  return modules;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Commandes slash / context menu
client.commands = new Collection();
for (const command of loadModulesRecursive(path.join(__dirname, 'commands'))) {
  if (command?.data?.name) client.commands.set(command.data.name, command);
}

// Boutons / modals / selects (customId ou préfixe avant ":")
client.buttons = new Collection();
for (const button of loadModulesRecursive(path.join(__dirname, 'interactions', 'buttons'))) {
  if (button?.customId) client.buttons.set(button.customId, button);
}

client.modals = new Collection();
for (const modal of loadModulesRecursive(path.join(__dirname, 'interactions', 'modals'))) {
  if (modal?.customId) client.modals.set(modal.customId, modal);
}

client.selects = new Collection();
for (const select of loadModulesRecursive(path.join(__dirname, 'interactions', 'selects'))) {
  if (select?.customId) client.selects.set(select.customId, select);
}

// Events
for (const event of loadModulesRecursive(path.join(__dirname, 'events'))) {
  if (!event?.name) continue;
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

// Tâches planifiées : rapport hebdomadaire (chaque lundi 9h) et employé du mois (1er du mois, 9h).
client.once('ready', () => {
  cron.schedule('0 9 * * 1', () => weeklyReportJob.run(client).catch((err) => console.error('[weeklyReport]', err)));
  cron.schedule('0 9 1 * *', () => employeeOfMonthJob.run(client).catch((err) => console.error('[employeeOfMonth]', err)));
});

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

client.login(process.env.DISCORD_TOKEN);
