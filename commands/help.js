const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env
const { log } = require('../index');

module.exports = {
  setup: (client) => {
    // Setup logic, if needed
  },
  data: {
    name: 'help',
    description: 'Display this help message.',
  },
  execute: async (interaction) => {
    try {
      const message = 'Help message sent.';
      const userTag = interaction.user.tag;

      // Log to console
      console.log(`Command "/help" used by ${userTag}. Response: ${message}`);

      if (!interaction.replied) {
        // Get the command files in the "commands" folder
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

        // Array to store command data for the embed
        const commandFields = [];

        // Read data from each command file
        for (const file of commandFiles) {
          try {
            const command = require(`./${file}`);

            // Check if the command has the required "data" property
            if (command.data && command.data.name && command.data.description) {
              commandFields.push({
                name: `/${command.data.name}`,
                value: command.data.description,
              });
            }
          } catch (error) {
            console.error(`Error reading data from ${file}: ${error}`);
          }
        }

        const helpEmbed = {
          embeds: [
            {
              title: 'Command List',
              description: 'List of available commands:',
              fields: commandFields,
            },
          ],
        };

        // Log to console
        console.log(`Sending help message to ${userTag}`);

        // Log to file
        logToFile(`Command "/help" used by ${userTag}. Response: ${message}`);

        // Log to webhook
        await logToWebhook(`Command "/help" used by ${userTag}. Response: ${message}`);

        await interaction.reply(helpEmbed);
      }
    } catch (error) {
      const errorMessage = `Error executing "/help" command: ${error}`;

      // Log to console
      console.error(errorMessage);

      // Log to file
      logToFile(errorMessage);

      // Log error to webhook
      await logToWebhook(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
    }
  },
};

// Function to append messages to the newest file in the "logs" folder
function logToFile(message) {
  const logsFolder = './logs';

  const logFiles = fs.readdirSync(logsFolder).filter(file => file.endsWith('.log'));
  logFiles.sort((a, b) => fs.statSync(path.join(logsFolder, b)).mtime.getTime() - fs.statSync(path.join(logsFolder, a)).mtime.getTime());

  const newestLogFile = logFiles.length > 0 ? logFiles[0] : new Date().toISOString().replace(/:/g, '-') + '.log';
  const logFilePath = path.join(logsFolder, newestLogFile);

  fs.appendFileSync(logFilePath, `${message}\n`);
}

// Function to log messages to the specified webhook
async function logToWebhook(message) {
  const webhookUrl = process.env.HELP_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, { content: message });
      console.log('Logged to webhook successfully.');
    } catch (webhookError) {
      console.error(`Error logging to webhook: ${webhookError.message}`);
    }
  } else {
    console.warn('Webhook URL not provided. Skipping logging to webhook.');
  }
}
