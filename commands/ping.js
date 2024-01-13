const fs = require('fs');
const path = require('path');
const { log } = require('../index');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  setup: (client, sharedLog) => {
    module.exports.client = client;
    module.exports.sharedLog = sharedLog;
  },
  data: {
    name: 'ping',
    description: 'Get the bot\'s uptime and ping.',
  },
  execute: async (interaction) => {
    try {
      const userTag = interaction.user.tag;

      // Ensure the client object is accessible within the execute function
      const client = module.exports.client;
      const sharedLog = module.exports.sharedLog;

      // Calculate bot uptime
      const uptime = calculateUptime(client.uptime);

      // Get bot ping
      const ping = client.ws.ping !== -1 ? `${client.ws.ping}ms` : 'Calculating...';

      // Log using the shared log function
      sharedLog(`Command "/ping" used by ${userTag}. Bot Uptime: ${uptime}. Bot Ping: ${ping}`);

      // Reply with bot uptime and ping as an embed
      const embed = {
        title: 'Bot Uptime and Ping',
        fields: [
          { name: 'Uptime', value: uptime },
          { name: 'Ping', value: ping },
        ],
        color: 0x0099ff,
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorMessage = `Error executing "/ping" command: ${error}`;

      // Log error using the shared log function
      sharedLog(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
    }
  },
};

// Function to calculate bot uptime
function calculateUptime(uptime) {
  const seconds = Math.floor((uptime / 1000) % 60);
  const minutes = Math.floor((uptime / (1000 * 60)) % 60);
  const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
