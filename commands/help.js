const fs = require('fs');
const path = require('path');
const { log } = require('../index');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  setup: (client, sharedLog) => {
    // Setup logic, if needed
    // You can use the sharedLog function here if necessary
  },
  data: {
    name: 'help',
    description: 'Display this help message.',
  },
  execute: async (interaction, sharedLog) => {
    try {
      const message = 'Help message sent.';
      const userTag = interaction.user.tag;

      // Log using the shared log function
      sharedLog(`Command "/help" used by ${userTag}. Response: ${message}`);

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

        // Log using the shared log function
        sharedLog(`Sending help message to ${userTag}`);

        // Log to webhook
        await sharedLogToWebhook(`Command "/help" used by ${userTag}. Response: ${message}`);

        await interaction.reply(helpEmbed);
      }
    } catch (error) {
      const errorMessage = `Error executing "/help" command: ${error}`;

      // Log using the shared log function
      sharedLog(errorMessage);

      // Log error to webhook
      await sharedLogToWebhook(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
    }
  },
};

// Function to log messages to the specified webhook using Axios
async function sharedLogToWebhook(message) {
  const webhookURL = process.env.WEBHOOK_URL;

  if (webhookURL) {
    try {
      await axios.post(webhookURL, { content: message });
      console.log('Logged to webhook successfully.');
    } catch (webhookError) {
      console.error(`Error logging to webhook: ${webhookError.message}`);
    }
  } else {
    console.warn('Webhook URL not provided in the environment variables.');
  }
}
