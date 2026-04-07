// config/database.js
// Initialises a SQLite database that persists welcome-channel settings
// across bot restarts. Each guild gets its own row keyed by guild ID.

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'bot.db');

// Ensure the data directory exists before opening the database
import fs from 'fs';
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Create the settings table if it does not already exist
db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id    TEXT PRIMARY KEY,
    channel_id  TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    created_at  INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at  INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

// ── Prepared statements ──────────────────────────────────────────────────────

/** Upsert a guild's welcome channel and webhook URL. */
const upsertSettings = db.prepare(`
  INSERT INTO guild_settings (guild_id, channel_id, webhook_url, updated_at)
  VALUES (@guildId, @channelId, @webhookUrl, strftime('%s', 'now'))
  ON CONFLICT(guild_id) DO UPDATE SET
    channel_id  = excluded.channel_id,
    webhook_url = excluded.webhook_url,
    updated_at  = strftime('%s', 'now')
`);

/** Retrieve settings for a guild. Returns undefined when not configured. */
const getSettings = db.prepare(`
  SELECT * FROM guild_settings WHERE guild_id = ?
`);

/** Remove a guild's settings (e.g. when resetting the welcome channel). */
const deleteSettings = db.prepare(`
  DELETE FROM guild_settings WHERE guild_id = ?
`);

export default {
  /** Save or update the welcome channel & webhook for a guild. */
  setWelcomeChannel(guildId, channelId, webhookUrl) {
    upsertSettings.run({ guildId, channelId, webhookUrl });
  },

  /** Get the stored settings for a guild, or null if not set. */
  getWelcomeSettings(guildId) {
    return getSettings.get(guildId) ?? null;
  },

  /** Remove all welcome settings for a guild. */
  resetWelcomeChannel(guildId) {
    deleteSettings.run(guildId);
  },
};
