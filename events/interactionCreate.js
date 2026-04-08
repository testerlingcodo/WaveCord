// events/interactionCreate.js
// Routes every incoming interaction to the appropriate slash command handler.
// Handles errors gracefully so one bad command cannot crash the bot.

import { Events, MessageFlags } from 'discord.js';

export const name = Events.InteractionCreate;
export const once = false;

/**
 * @param {import('discord.js').Interaction} interaction
 */
export async function execute(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`[interactionCreate] Unknown command: ${interaction.commandName}`);
    return interaction.reply({
      content: `❓ Unknown command \`/${interaction.commandName}\`. It may have been removed.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[interactionCreate] Error in /${interaction.commandName}:`, error);

    const errorMsg = {
      content: `💥 An unexpected error occurred while running that command.\n\`${error.message}\``,
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMsg).catch(() => null);
    } else {
      await interaction.reply(errorMsg).catch(() => null);
    }
  }
}
