// events/ready.js
// Fires once when the bot has successfully logged in and cached initial data.

import { Events, ActivityType } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;

/**
 * @param {import('discord.js').Client} client
 */
export async function execute(client) {
  console.log(`\n✅  Logged in as ${client.user.tag}`);
  console.log(`📡  Watching ${client.guilds.cache.size} guild(s)`);
  console.log(`🔧  ${client.commands.size} slash command(s) loaded\n`);

  client.user.setPresence({
    activities: [
      {
        name: 'for new members 👋',
        type: ActivityType.Watching,
      },
    ],
    status: 'online',
  });
}
