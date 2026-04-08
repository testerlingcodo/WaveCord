// commands/testwelcome.js
// Slash command: /testwelcome
// Simulates the guildMemberAdd event using the invoking user (or a target
// member) so admins can preview the welcome message without waiting for
// a real join. Requires the welcome channel to be configured first.

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import db from '../config/database.js';
import { sendWelcomeMessage } from '../utils/welcomeEmbed.js';

export const data = new SlashCommandBuilder()
  .setName('testwelcome')
  .setDescription("Preview the welcome message using your own (or another member's) profile.")
  .addUserOption((opt) =>
    opt
      .setName('member')
      .setDescription('Member to simulate a join for (defaults to you).')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  // Check that the welcome channel has been configured
  const settings = db.getWelcomeSettings(interaction.guildId);
  if (!settings) {
    return interaction.editReply({
      content:
        '⚠️ No welcome channel is configured yet.\n' +
        'Run `/setwelcomechannel` first, then try again.',
    });
  }

  // Resolve the target member
  const targetUser = interaction.options.getUser('member') ?? interaction.user;

  let member;
  try {
    member = await interaction.guild.members.fetch(targetUser.id);
  } catch {
    return interaction.editReply({
      content: '❌ Could not find that member in this server.',
    });
  }

  // Send the welcome message via the stored webhook
  try {
    await sendWelcomeMessage(settings.webhook_url, member);

    await interaction.editReply({
      content:
        `✅ Test welcome message sent to <#${settings.channel_id}> for **${member.user.tag}**.`,
    });
  } catch (error) {
    console.error('[testwelcome] Error sending test message:', error);

    // Common cause: the webhook was deleted manually in Discord
    const isWebhookGone = error.code === 10015;
    await interaction.editReply({
      content: isWebhookGone
        ? '❌ The stored webhook no longer exists. Please run `/setwelcomechannel` again to create a new one.'
        : `❌ Failed to send the test message: \`${error.message}\``,
    });
  }
}
