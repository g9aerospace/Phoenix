const fs = require('fs');
const path = require('path');
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
        const helpEmbed = {
          embeds: [
            {
              title: 'Command List',
              description: 'List of available commands:',
              fields: [
                { name: '/ping', value: 'Get a pong response.' },
                { name: '/hello', value: 'Receive a friendly greeting.' },
                { name: '/help', value: 'Display this help message.' },
              ],
            },
          ],
        };

        // Log to console
        console.log(`Sending help message to ${userTag}`);

        // Log to file
        logToFile(`Command "/help" used by ${userTag}. Response: ${message}`);

        await interaction.reply(helpEmbed);
      }
    } catch (error) {
      const errorMessage = `Error executing "/help" command: ${error}`;

      // Log to console
      console.error(errorMessage);

      // Log to file
      logToFile(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
    }
  },
};

// Function to log messages to the newest file in the "logs" folder
function logToFile(message) {
  const logsFolder = './logs';
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const logFilePath = path.join(logsFolder, `${timestamp}.log`);

  // Log to file
  fs.appendFileSync(logFilePath, `${message}\n`);
}
