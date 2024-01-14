const fs = require('fs');
const path = require('path');
const { log } = require('../index');

module.exports = {
  setup: (client, sharedLog) => {
    // Any setup logic can go here if needed
  },
  data: {
    name: 'userinfo',
    description: 'Retrieve information about a user.',
    options: [
      {
        name: 'target',
        type: 6, // 6 corresponds to USER type
        description: 'The user you want to get information about.',
        required: true,
      },
    ],
  },

  execute: async (interaction, sharedLog) => {
    try {
      const targetUser = interaction.options.getMember('target');

      if (!targetUser) {
        return interaction.reply('User not found. Please mention a valid user.');
      }

      const userId = targetUser.id;
      const userFilePath = path.join('./users', `${userId}.json`);

      if (!fs.existsSync(userFilePath)) {
        return interaction.reply('No information found for the specified user.');
      }

      const userData = JSON.parse(fs.readFileSync(userFilePath, 'utf-8'));

      // Respond with user information
      interaction.reply({
        content: `**User Information for ${targetUser.user.tag}**\n\n` +
                 `User ID: ${userData.userId}\n` +
                 `Username: ${userData.username}\n` +
                 `Short Message: ${userData.shortMessage || 'Not provided'}\n` +
                 `Role List: ${userData.roleList || 'Not provided'}`,
      });

      // Log using the shared log function
      sharedLog(`User information retrieved for ${targetUser.user.tag}.`);
    } catch (error) {
      const errorMessage = `Error executing "/userinfo" command: ${error}`;

      // Log using the shared log function
      sharedLog(errorMessage);

      // Log error to the newest log file
      logToFile(errorMessage);

      // Log error to webhook
      await sharedLogToWebhook(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
    }
  },
};
