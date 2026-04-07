// deploy-commands.js
// Run this script ONCE (or whenever you add/change slash commands) to
// register them with Discord's API.
//
//   node deploy-commands.js
//
// Set GUILD_ID in .env to deploy to a single guild instantly (great for
// development). Leave it blank to deploy globally (takes ~1 hour).

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('❌  DISCORD_TOKEN and CLIENT_ID must be set in your .env file.');
  process.exit(1);
}

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

// Collect all command definitions
const commands = [];
for (const file of commandFiles) {
  const filePath = pathToFileURL(path.join(commandsPath, file)).href;
  const { data } = await import(filePath);
  if (data) {
    commands.push(data.toJSON());
    console.log(`  ✔  Queued: /${data.name}`);
  }
}

const rest  = new REST().setToken(DISCORD_TOKEN);
const route = GUILD_ID
  ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) // instant (dev)
  : Routes.applicationCommands(CLIENT_ID);               // global (~1 hr)

try {
  console.log(`\n📤  Deploying ${commands.length} command(s) ${GUILD_ID ? `to guild ${GUILD_ID}` : 'globally'}…`);
  const data = await rest.put(route, { body: commands });
  console.log(`✅  Successfully registered ${data.length} command(s).\n`);
} catch (error) {
  console.error('❌  Failed to deploy commands:', error);
  process.exit(1);
}
