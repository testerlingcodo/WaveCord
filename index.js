// index.js
// Entry point — bootstraps the Discord client, loads all commands and
// events from their respective directories, then logs in.

import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

// ── Validate required environment variables ──────────────────────────────────
const { DISCORD_TOKEN } = process.env;
if (!DISCORD_TOKEN) {
  console.error('❌  DISCORD_TOKEN is missing from your .env file.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Create the client ────────────────────────────────────────────────────────
// GuildMembers intent is required to receive guildMemberAdd events.
// GuildWebhooks is required to manage webhooks in channels.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildWebhooks,
  ],
});

// Attach a Map to hold slash command handlers, keyed by command name
client.commands = new Collection();

// ── Load commands ────────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = pathToFileURL(path.join(commandsPath, file)).href;
  const command  = await import(filePath);

  if (!command.data || !command.execute) {
    console.warn(`⚠️  Skipping ${file} — missing data or execute export.`);
    continue;
  }

  client.commands.set(command.data.name, command);
  console.log(`  📦  Loaded command: /${command.data.name}`);
}

// ── Load events ──────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = pathToFileURL(path.join(eventsPath, file)).href;
  const event    = await import(filePath);

  const handler = (...args) => event.execute(...args);

  if (event.once) {
    client.once(event.name, handler);
  } else {
    client.on(event.name, handler);
  }

  console.log(`  📡  Registered event: ${event.name}`);
}

// ── Global error handlers ────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error);
  // Restart logic (e.g. PM2) can pick this up; exit so the process is fresh
  process.exit(1);
});

// ── Log in ───────────────────────────────────────────────────────────────────
console.log('\n🚀  Starting Discord Welcome Bot…');
await client.login(DISCORD_TOKEN);
