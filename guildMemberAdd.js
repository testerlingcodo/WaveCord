// events/guildMemberAdd.js
// Fires whenever a new member joins a guild the bot is in.
// Looks up the stored welcome settings and sends a webhook embed.

import { Events } from 'discord.js';
import db from '../config/database.js';
import { sendWelcomeMessage } from '../utils/welcomeEmbed.js';

export const name    = Events.GuildMemberAdd; // 'guildMemberAdd'
export const once   = false;                  // listen every time, not just once

/**
 * @param {import('discord.js').GuildMember} member
 */
export async function execute(member) {
  // Ignore bot accounts joining the server
  if (member.user.bot) return;

  const settings = db.getWelcomeSettings(member.guild.id);

  // No welcome channel configured → silently do nothing
  if (!settings) return;

  try {
    await sendWelcomeMessage(settings.webhook_url, member);
    console.log(`[guildMemberAdd] Welcomed ${member.user.tag} in ${member.guild.name}`);
  } catch (error) {
    // Log but do not crash the process — a broken webhook should not
    // take down the rest of the bot.
    console.error(
      `[guildMemberAdd] Failed to send welcome message for ${member.user.tag}:`,
      error.message,
    );

    // If the webhook is gone (code 10015), notify guild owner if possible
    if (error.code === 10015) {
      console.warn(
        `[guildMemberAdd] Webhook for guild ${member.guild.id} is invalid. ` +
        `An admin should run /setwelcomechannel again.`
      );
    }
  }
}
