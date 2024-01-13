const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  setup: (client, log) => {
    // Setup logic, if needed
    // You can use the log function here if necessary
  },
  data: {
    name: 'hello',
    description: 'Receive a friendly greeting.',
  },
  execute: async (interaction, log) => {
    try {
      const message = 'Hello!';
      const userTag = interaction.user.tag;

      // Log using the shared log function
      log(`Command "/hello" used by ${userTag}. Response: ${message}`);
      
      // Log to file
      logToFile(`Command "/hello" used by ${userTag}. Response: ${message}`);

      await interaction.reply(message);
    } catch (error) {
      const errorMessage = `Error executing "/hello" command: ${error}`;
      // Log error using the shared log function
      log(errorMessage);
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
