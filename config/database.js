// config/database.js
// Initialises a SQLite database that persists welcome-channel settings
// across bot restarts. Each guild gets its own row keyed by guild ID.

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(dataDir, 'bot.db');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id    TEXT PRIMARY KEY,
    channel_id  TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    created_at  INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at  INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

const upsertSettings = db.prepare(`
  INSERT INTO guild_settings (guild_id, channel_id, webhook_url, updated_at)
  VALUES (@guildId, @channelId, @webhookUrl, strftime('%s', 'now'))
  ON CONFLICT(guild_id) DO UPDATE SET
    channel_id  = excluded.channel_id,
    webhook_url = excluded.webhook_url,
    updated_at  = strftime('%s', 'now')
`);

const getSettings = db.prepare(`
  SELECT * FROM guild_settings WHERE guild_id = ?
`);

const deleteSettings = db.prepare(`
  DELETE FROM guild_settings WHERE guild_id = ?
`);

export default {
  setWelcomeChannel(guildId, channelId, webhookUrl) {
    upsertSettings.run({ guildId, channelId, webhookUrl });
  },

  getWelcomeSettings(guildId) {
    return getSettings.get(guildId) ?? null;
  },

  resetWelcomeChannel(guildId) {
    deleteSettings.run(guildId);
  },
};
