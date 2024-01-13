const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  setup: (client, log) => {
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
  const logFilePath = path.join('./logs', new Date().toISOString().replace(/:/g, '-') + '.log');
  fs.appendFileSync(logFilePath, `${message}\n`);
}