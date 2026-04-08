module.exports = {
  apps: [
    {
      name: 'discord-welcome-bot',
      script: './index.js',
      interpreter: 'node',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
