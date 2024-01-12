const fs = require('fs');
const path = require('path');
const { log } = require('../index');
const axios = require('axios'); // Import Axios library
require('dotenv').config();

module.exports = {
  setup: (client) => {
    // Setup logic, if needed
    // Ensure the client object is accessible within the command
    module.exports.client = client;
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

      // Calculate bot uptime
      const uptime = calculateUptime(client.uptime);

      // Get bot ping
      const ping = client.ws.ping !== -1 ? `${client.ws.ping}ms` : 'Calculating...';

      // Log to console
      console.log(`Command "/ping" used by ${userTag}. Bot Uptime: ${uptime}. Bot Ping: ${ping}`);

      // Log to file
      logToFile(`Command "/ping" used by ${userTag}. Bot Uptime: ${uptime}. Bot Ping: ${ping}`);

      // Log to webhook
      logToWebhook(`Command "/ping" used by ${userTag}. Bot Uptime: ${uptime}. Bot Ping: ${ping}`);

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

      // Log to console
      console.error(errorMessage);

      // Log to file
      logToFile(errorMessage);

      // Log error to webhook
      logToWebhook(errorMessage);

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

// Function to append messages to the newest file in the "logs" folder
function logToFile(message) {
  const logsFolder = './logs';

  const logFiles = fs.readdirSync(logsFolder).filter(file => file.endsWith('.log'));
  logFiles.sort((a, b) => fs.statSync(path.join(logsFolder, b)).mtime.getTime() - fs.statSync(path.join(logsFolder, a)).mtime.getTime());

  const newestLogFile = logFiles.length > 0 ? logFiles[0] : new Date().toISOString().replace(/:/g, '-') + '.log';
  const logFilePath = path.join(logsFolder, newestLogFile);

  fs.appendFileSync(logFilePath, `${message}\n`);
}

// Function to log messages to the specified webhook using Axios
function logToWebhook(message) {
  const webhookURL = process.env.PING_WEBHOOK_URL;

  if (webhookURL) {
    axios.post(webhookURL, { content: message })
      .then(response => {
        console.log(`Logged to webhook successfully: ${message}`);
      })
      .catch(error => {
        console.error(`Error logging to webhook: ${error}`);
      });
  } else {
    console.warn('Webhook URL not provided in the environment variables.');
  }
}
