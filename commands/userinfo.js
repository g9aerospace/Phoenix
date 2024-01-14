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
  
      // Create an embed with user information
      const embed = {
        title: `User Information for ${targetUser.user.tag}`,
        description: `${targetUser} (${targetUser.user.tag})`, // Mention the user in the description
        fields: [
          { name: 'User ID', value: userData.userId },
          { name: 'Username', value: userData.username },
          { name: 'Short Message', value: userData.shortMessage || 'Not provided' },
          { name: 'Role List', value: userData.roleList || 'Not provided' },
        ],
        color: 0x00ff00, // You can customize the color as needed
        footer: {
          text: `Requested by ${interaction.user.tag}`,
          icon_url: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }),
        },
        thumbnail: {
          url: targetUser.user.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 }),
        },
      };
  
      // Respond with the embed
      await interaction.reply({ embeds: [embed] });
  
      // Log using the shared log function, mentioning the looked-up user
      sharedLog(`User information retrieved for ${targetUser.user.tag} by ${interaction.user.tag}.`);
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
