// utils/welcomeEmbed.js
// Builds the rich welcome embed and delivers it via a Discord webhook.

import {
  EmbedBuilder,
  WebhookClient,
  time,
  TimestampStyles,
} from 'discord.js';

/**
 * Fetch the full Discord user object (with banner data) for a GuildMember.
 * The member's partial User object may not include banner info, so we call
 * the REST API directly to retrieve the complete profile.
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<import('discord.js').User>}
 */
async function fetchFullUser(member) {
  // Force-fetch so Discord.js populates banner and accent colour fields
  return member.user.fetch(true);
}

/**
 * Resolve the best display name for a member:
 *   1. Server nickname
 *   2. Global display name
 *   3. Username (always present)
 *
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function resolveDisplayName(member) {
  return member.nickname ?? member.user.displayName ?? member.user.username;
}

/**
 * Build the welcome EmbedBuilder for a new member.
 *
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').User} fullUser - User fetched with banner data
 * @returns {EmbedBuilder}
 */
function buildWelcomeEmbed(member, fullUser) {
  const displayName = resolveDisplayName(member);
  const avatarUrl   = member.user.displayAvatarURL({ size: 256, extension: 'png' });
  const bannerUrl   = fullUser.bannerURL({ size: 1024, extension: 'png' }) ?? null;
  const createdAt   = member.user.createdAt;

  const embed = new EmbedBuilder()
    .setTitle('🎉 New Member Joined')
    .setColor(0x5865f2) // Blurple — consistent with Discord branding
    .setThumbnail(avatarUrl)
    .setDescription(
      `Welcome to **${member.guild.name}**, ${member.user}! 👋\n` +
      `We're glad to have you here. Make yourself at home!`
    )
    .addFields(
      {
        name: '👤 Username',
        value: `\`${member.user.username}\``,
        inline: true,
      },
      {
        name: '🏷️ Display Name',
        value: displayName !== member.user.username
          ? `\`${displayName}\``
          : '*Same as username*',
        inline: true,
      },
      {
        name: '🎂 Account Created',
        // Use Discord's built-in relative timestamp so it adapts to every timezone
        value: `${time(createdAt, TimestampStyles.LongDate)} (${time(createdAt, TimestampStyles.RelativeTime)})`,
        inline: false,
      },
      {
        name: '🔢 Member Count',
        value: `You are member **#${member.guild.memberCount}**`,
        inline: true,
      },
    )
    .setFooter({ text: `ID: ${member.user.id}` })
    .setTimestamp();

  // Attach profile banner as the large embed image when available
  if (bannerUrl) {
    embed.setImage(bannerUrl);
  }

  return embed;
}

/**
 * Send a welcome embed to a channel via its stored webhook URL.
 *
 * @param {string}                            webhookUrl
 * @param {import('discord.js').GuildMember}  member
 * @returns {Promise<void>}
 */
export async function sendWelcomeMessage(webhookUrl, member) {
  const fullUser = await fetchFullUser(member);
  const embed    = buildWelcomeEmbed(member, fullUser);

  // WebhookClient is lightweight — no gateway connection needed
  const webhook = new WebhookClient({ url: webhookUrl });

  try {
    await webhook.send({
      username:  `${member.guild.name} | Welcome Bot`,
      avatarURL: member.guild.iconURL({ size: 128 }) ?? undefined,
      embeds:    [embed],
    });
  } finally {
    // Always destroy the client to free the underlying HTTP agent
    webhook.destroy();
  }
}
