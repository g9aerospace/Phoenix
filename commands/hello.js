const fs = require('fs');
const path = require('path');
const { log } = require('../index');

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

      // Log to file
      logToFile(`Command "/hello" used by ${userTag}. Response: ${message}`);

      await interaction.reply(message);
    } catch (error) {
      const errorMessage = `Error executing "/hello" command: ${error}`;

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
