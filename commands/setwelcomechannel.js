// commands/setwelcomechannel.js
// Slash command: /setwelcomechannel
// Allows server administrators to choose which channel receives webhook
// welcome messages. Creates a new webhook in that channel and stores it.

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import db from '../config/database.js';

export const data = new SlashCommandBuilder()
  .setName('setwelcomechannel')
  .setDescription('Set the channel where new-member welcome messages are sent.')
  .addChannelOption((opt) =>
    opt
      .setName('channel')
      .setDescription('The text channel to send welcome messages in.')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true)
  )
  // Only members who can manage the guild may run this command
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setDMPermission(false);

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function execute(interaction) {
  // Defer the reply so we have time to create the webhook
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const channel = interaction.options.getChannel('channel');

  // Permission checks
  const botMember = interaction.guild.members.me;

  if (!channel.permissionsFor(botMember).has('ManageWebhooks')) {
    return interaction.editReply({
      content:
        `❌ I need the **Manage Webhooks** permission in ${channel} to set up the welcome system.\n` +
        'Please grant that permission and try again.',
    });
  }

  if (!channel.permissionsFor(botMember).has('SendMessages')) {
    return interaction.editReply({
      content: `❌ I cannot send messages in ${channel}. Please check my permissions.`,
    });
  }

  try {
    // Clean up any existing bot webhook in that guild
    const existingSettings = db.getWelcomeSettings(interaction.guildId);
    if (existingSettings) {
      try {
        // Attempt to delete the old webhook so we don't accumulate orphans
        const oldWebhook = await interaction.client.fetchWebhook(
          existingSettings.webhook_url.split('/')[6],
        ).catch(() => null);
        if (oldWebhook) await oldWebhook.delete('Welcome channel changed').catch(() => null);
      } catch {
        // Non-fatal: old webhook may already be deleted
      }
    }

    // Create a new webhook in the selected channel
    const webhook = await channel.createWebhook({
      name: 'Welcome Bot',
      avatar: interaction.client.user.displayAvatarURL(),
      reason: `Welcome channel set by ${interaction.user.tag}`,
    });

    // Persist the settings
    db.setWelcomeChannel(interaction.guildId, channel.id, webhook.url);

    // Confirm to the admin
    const embed = new EmbedBuilder()
      .setTitle('✅ Welcome Channel Configured')
      .setColor(0x57f287)
      .setDescription(`New member welcome messages will now be sent to ${channel}.`)
      .addFields(
        { name: 'Channel', value: `${channel}`, inline: true },
        { name: 'Webhook', value: `\`${webhook.name}\``, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Post an informational notice in the configured channel itself
    await channel.send({
      content: '👋 This channel has been set as the **welcome channel**. New member notifications will appear here.',
    }).catch(() => null);
  } catch (error) {
    console.error('[setwelcomechannel] Error:', error);
    await interaction.editReply({
      content:
        '❌ Something went wrong while setting up the welcome channel.\n' +
        `\`${error.message}\``,
    });
  }
}
