// commands/welcomestatus.js
// Slash command: /welcomestatus
// Shows the current welcome channel configuration for this guild.

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  time,
  TimestampStyles,
} from 'discord.js';
import db from '../config/database.js';

export const data = new SlashCommandBuilder()
  .setName('welcomestatus')
  .setDescription('Check the current welcome channel configuration.')
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
      content:
        `📭 **No welcome channel configured.**\n` +
        `Use \`/setwelcomechannel\` to set one up.`,
    });
  }

  const configuredAt = new Date(settings.updated_at * 1000);

  const embed = new EmbedBuilder()
    .setTitle('📋 Welcome Channel Status')
    .setColor(0x5865f2)
    .addFields(
      {
        name:   '📢 Channel',
        value:  `<#${settings.channel_id}>`,
        inline: true,
      },
      {
        name:   '🔗 Webhook',
        value:  '`Configured ✅`',
        inline: true,
      },
      {
        name:   '🕐 Last Updated',
        value:  `${time(configuredAt, TimestampStyles.LongDateTime)}`,
        inline: false,
      },
    )
    .setFooter({ text: 'Use /setwelcomechannel to change · /resetwelcome to remove' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
