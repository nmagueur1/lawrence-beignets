'use strict';

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

function loadModulesRecursive(dir) {
  const modules = [];
  if (!fs.existsSync(dir)) return modules;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) modules.push(...loadModulesRecursive(fullPath));
    else if (entry.name.endsWith('.js')) modules.push(require(fullPath));
  }
  return modules;
}

const commands = loadModulesRecursive(path.join(__dirname, 'commands'))
  .filter((c) => c?.data?.toJSON)
  .map((c) => c.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Déploiement de ${commands.length} commande(s)...`);
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log('✅ Commandes déployées avec succès sur le serveur.');
  } catch (err) {
    console.error('❌ Échec du déploiement des commandes :', err);
    process.exit(1);
  }
})();
