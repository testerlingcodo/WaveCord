# 🤖 Discord Welcome Bot

A Discord.js v14 bot that sends rich welcome embeds via webhooks whenever a new member joins your server.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Auto-welcome** | Sends an embed on every new member join |
| **Webhook delivery** | Messages are sent through a dedicated webhook |
| **Rich embed** | Avatar, banner, username, display name, account age |
| **SQLite storage** | Settings persist across restarts |
| **/setwelcomechannel** | Admins pick the target channel |
| **/testwelcome** | Preview the message without waiting for a real join |
| **/resetwelcome** | Remove the configuration and delete the webhook |
| **/welcomestatus** | Check the current configuration |

---

## 📋 Prerequisites

- **Node.js 20, 22, or 24** (check with `node -v`)
- A Discord account and a server where you have **Manage Server** permission
- A bot application created in the [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🚀 Setup

### 1. Create a Discord Application & Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → give it a name → **Create**
3. Open the **Bot** tab → **Add Bot** → confirm
4. Under **Token** click **Reset Token** and copy it — you'll need it shortly
5. Enable these **Privileged Gateway Intents**:
   - ✅ **Server Members Intent** ← required for join events
6. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Send Messages`, `Manage Webhooks`, `Embed Links`, `View Channels`
7. Copy the generated URL, paste it in your browser, and invite the bot to your server

### 2. Clone & Install

```bash
git clone https://github.com/your-repo/discord-welcome-bot.git
cd discord-welcome-bot
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here   # found on the General Information page
GUILD_ID=your_server_id_here         # optional but recommended for testing
```

> **How to find IDs:** Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then right-click on your server/user and select **Copy Server ID** / **Copy User ID**.

### 4. Deploy Slash Commands

```bash
node deploy-commands.js
```

- With `GUILD_ID` set: commands appear **instantly** in that server (great for development)
- Without `GUILD_ID`: commands deploy **globally** and may take up to **1 hour** to propagate

### 5. Start the Bot

```bash
npm start
```

You should see output like:

```
🚀  Starting Discord Welcome Bot…
  📦  Loaded command: /setwelcomechannel
  📦  Loaded command: /testwelcome
  📦  Loaded command: /resetwelcome
  📦  Loaded command: /welcomestatus
  📡  Registered event: ready
  📡  Registered event: guildMemberAdd
  📡  Registered event: interactionCreate

✅  Logged in as WelcomeBot#1234
📡  Watching 1 guild(s)
🔧  4 slash command(s) loaded
```

---

## ⚙️ Usage

### Set the welcome channel

In your server, run:

```
/setwelcomechannel channel:#welcome
```

The bot will create a webhook in that channel and store the configuration.

### Test the welcome message

```
/testwelcome
```

or target a specific member:

```
/testwelcome member:@SomeUser
```

### Check the current configuration

```
/welcomestatus
```

### Remove the configuration

```
/resetwelcome
```

---

## 📁 Project Structure

```
discord-welcome-bot/
├── commands/
│   ├── setwelcomechannel.js   # /setwelcomechannel
│   ├── testwelcome.js         # /testwelcome
│   ├── resetwelcome.js        # /resetwelcome
│   └── welcomestatus.js       # /welcomestatus
├── events/
│   ├── ready.js               # Fires on bot login
│   ├── guildMemberAdd.js      # Fires on new member join
│   └── interactionCreate.js   # Routes slash commands
├── config/
│   └── database.js            # SQLite setup & helpers
├── utils/
│   └── welcomeEmbed.js        # Embed builder + webhook sender
├── data/                      # Auto-created — stores bot.db
├── deploy-commands.js         # One-time command registration script
├── index.js                   # Entry point
├── .env.example
├── .gitignore
└── package.json
```

---

## 🔒 Required Bot Permissions

| Permission | Why |
|---|---|
| **Send Messages** | Post the informational notice in the welcome channel |
| **Manage Webhooks** | Create and delete webhooks in the chosen channel |
| **Embed Links** | Render rich embeds in messages |
| **View Channel** | See channels to configure webhooks |

---

## 🔧 Running in Production

We recommend [PM2](https://pm2.keymetrics.io/) to keep the bot alive:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # enable auto-start on reboot
```

On Windows Server, if `pm2 startup` is not available in your environment, create a Task Scheduler task that runs on system boot and executes:

```bash
pm2 resurrect
```

### Windows Server quick setup

```bash
npm install
node deploy-commands.js
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
```

After that, test the bot in Discord with:

```text
/welcomestatus
/setwelcomechannel channel:#welcome
/testwelcome
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---|---|
| Commands not showing up | Re-run `node deploy-commands.js`; if no GUILD_ID, wait up to 1 hour |
| "Missing Permissions" error | Ensure the bot role has **Manage Webhooks** in the target channel |
| Welcome not firing | Confirm **Server Members Intent** is enabled in the Developer Portal |
| Webhook was deleted | Run `/setwelcomechannel` again to create a fresh webhook |
