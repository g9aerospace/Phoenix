const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  setup: (client) => {
    // Setup logic, if needed
  },
  data: {
    name: 'hello',
    description: 'Receive a friendly greeting.',
  },
  execute: async (interaction) => {
    try {
      const message = 'Hello!';
      const userTag = interaction.user.tag;

      // Log to console
      console.log(`Command "/hello" used by ${userTag}. Response: ${message}`);

      // Log to file (optional, you can remove this line)
      logToFile(`Command "/hello" used by ${userTag}. Response: ${message}`);

      // Log to webhook
      await sendToWebhook(`Command "/hello" used by ${userTag}. Response: ${message}`);

      await interaction.reply(message);
    } catch (error) {
      const errorMessage = `Error executing "/hello" command: ${error}`;

      // Log to console
      console.error(errorMessage);

      // Log to file (optional, you can remove this line)
      logToFile(errorMessage);

      // Log error to webhook
      await sendToWebhook(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
    }
  },
};

// Function to append messages to the newest file in the "logs" folder (optional, you can remove this function)
function logToFile(message) {
  const logsFolder = './logs';

  const logFiles = fs.readdirSync(logsFolder).filter(file => file.endsWith('.log'));
  logFiles.sort((a, b) => fs.statSync(path.join(logsFolder, b)).mtime.getTime() - fs.statSync(path.join(logsFolder, a)).mtime.getTime());

  const newestLogFile = logFiles.length > 0 ? logFiles[0] : new Date().toISOString().replace(/:/g, '-') + '.log';
  const logFilePath = path.join(logsFolder, newestLogFile);

  fs.appendFileSync(logFilePath, `${message}\n`);
}

// Function to send logs to a webhook
async function sendToWebhook(message) {
  const webhookUrl = process.env.HELLO_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, { content: message });
    } catch (error) {
      console.error(`Error sending log to webhook: ${error.message}`);
    }
  } else {
    console.error('HELLO_WEBHOOK_URL is not defined in the environment variables.');
  }
}
