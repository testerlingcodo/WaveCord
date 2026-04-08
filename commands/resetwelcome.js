// commands/resetwelcome.js
// Slash command: /resetwelcome
// Removes the stored welcome channel configuration for this guild and
// deletes the associated webhook. Admins can then run /setwelcomechannel
// again to pick a new channel.

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import db from '../config/database.js';

export const data = new SlashCommandBuilder()
  .setName('resetwelcome')
  .setDescription('Remove the welcome channel configuration and delete its webhook.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const settings = db.getWelcomeSettings(interaction.guildId);

  if (!settings) {
    return interaction.editReply({
      content: 'ℹ️ No welcome channel is currently configured for this server.',
    });
  }

  // Attempt to delete the webhook from Discord
  try {
    // Extract webhook ID from the stored URL: https://discord.com/api/webhooks/{id}/{token}
    const urlParts = settings.webhook_url.split('/');
    const webhookId = urlParts[6];
    const webhookToken = urlParts[7];

    const webhookClient = new (await import('discord.js')).WebhookClient({
      id: webhookId,
      token: webhookToken,
    });

    await webhookClient.delete(`Welcome channel reset by ${interaction.user.tag}`)
      .catch(() => null);
    webhookClient.destroy();
  } catch {
    // Continue even if we couldn't delete the webhook
  }

  // Remove from the database
  db.resetWelcomeChannel(interaction.guildId);

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Welcome Channel Reset')
    .setColor(0xed4245)
    .setDescription(
      'The welcome channel configuration has been removed.\n' +
      'Run `/setwelcomechannel` to set up a new one.',
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
