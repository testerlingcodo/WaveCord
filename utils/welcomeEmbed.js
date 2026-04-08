// utils/welcomeEmbed.js
// Builds the rich welcome embed and delivers it via a Discord webhook.

import {
  EmbedBuilder,
  WebhookClient,
  time,
  TimestampStyles,
} from 'discord.js';

/**
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<import('discord.js').User>}
 */
async function fetchFullUser(member) {
  return member.user.fetch(true);
}

/**
 * @param {import('discord.js').GuildMember} member
 * @returns {string}
 */
function resolveDisplayName(member) {
  return member.nickname ?? member.user.displayName ?? member.user.username;
}

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').User} fullUser
 * @returns {EmbedBuilder}
 */
function buildWelcomeEmbed(member, fullUser) {
  const displayName = resolveDisplayName(member);
  const avatarUrl = member.user.displayAvatarURL({ size: 256, extension: 'png' });
  const bannerUrl = fullUser.bannerURL({ size: 1024, extension: 'png' }) ?? null;
  const createdAt = member.user.createdAt;

  const embed = new EmbedBuilder()
    .setTitle('🎉 New Member Joined')
    .setColor(0x5865f2)
    .setThumbnail(avatarUrl)
    .setDescription(
      `Welcome to **${member.guild.name}**, ${member.user}! 👋\n` +
      "We're glad to have you here. Make yourself at home!",
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

  if (bannerUrl) {
    embed.setImage(bannerUrl);
  }

  return embed;
}

/**
 * @param {string} webhookUrl
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<void>}
 */
export async function sendWelcomeMessage(webhookUrl, member) {
  const fullUser = await fetchFullUser(member);
  const embed = buildWelcomeEmbed(member, fullUser);

  const webhook = new WebhookClient({ url: webhookUrl });

  try {
    await webhook.send({
      username: `${member.guild.name} | WaveCord`,
      avatarURL: member.guild.iconURL({ size: 128 }) ?? undefined,
      embeds: [embed],
    });
  } finally {
    webhook.destroy();
  }
}
