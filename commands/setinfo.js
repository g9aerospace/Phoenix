const fs = require('fs');
const path = require('path');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { log, processBotLogQueue } = require('../index'); // Include processBotLogQueue for shared queued logging
require('dotenv').config();

// Function to read user data from a JSON file
function readUserData(userId) {
  const usersFolder = './users';
  const userFilePath = path.join(usersFolder, `${userId}.json`);

  if (fs.existsSync(userFilePath)) {
    const userData = fs.readFileSync(userFilePath, 'utf-8');
    return JSON.parse(userData);
  }

  return null;
}

// Function to write user data to a JSON file
function writeUserData(userData) {
  const usersFolder = './users';
  const userFilePath = path.join(usersFolder, `${userData.userId}.json`);

  fs.writeFileSync(userFilePath, JSON.stringify(userData, null, 2));
}

module.exports = {
  setup: (client, sharedLog) => {
    // Any setup logic can go here if needed
  },
  data: {
    name: 'setinfo',
    description: 'Set user information including short message, game, and role.',
  },
  execute: async (interaction, sharedLog) => {
    try {
      const userTag = interaction.user.tag;

      // Ignore messages from the bot itself
      if (interaction.user.bot) {
        return;
      }

      // Prompt user for short message
      await interaction.reply('Please enter a short message:');
      const filter = (msg) => msg.author.id === interaction.user.id;
      const collectedShortMessage = await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000, // 1 minute
      });

      if (!collectedShortMessage || collectedShortMessage.size === 0) {
        return interaction.followUp('No valid short message received within the time limit. The command has been canceled.');
      }

      const shortMessage = collectedShortMessage.first().content;

      // Ask the user to specify the game using the first dropdown
      const gameData = require('../assets/questions.json');
      const games = gameData.games.map(game => game.name);
      const gameOptions = games.map(game => ({ label: game, value: game }));

      // Send initial message
      await interaction.followUp({
        content: 'Please specify the game you are interested in:',
        components: [
          {
            type: 1, // Action row
            components: [
              {
                type: 3, // Select menu
                custom_id: 'gameDropdown',
                placeholder: 'Select a game',
                options: gameOptions,
              },
            ],
          },
        ],
      });

      // Collect the user's selection for the first dropdown
      const gameSelection = await getDropdownSelection(interaction, 'gameDropdown', games);
      if (!gameSelection) return; // Exit if no valid selection

      const selectedGame = gameSelection;

      // Get questions for the selected game
      const selectedGameQuestions = gameData.games.find(game => game.name === selectedGame)?.questions;
      const roleOptions = selectedGameQuestions.map(question => ({ label: question, value: question }));

      // Ask the user to specify a role for the selected game using the second dropdown
      await interaction.followUp({
        content: `Great! Now, please specify the role you are interested in for the game "${selectedGame}":`,
        components: [
          {
            type: 1, // Action row
            components: [
              {
                type: 3, // Select menu
                custom_id: 'roleDropdown',
                placeholder: 'Select a role',
                options: roleOptions,
              },
            ],
          },
        ],
      });

      // Collect the user's selection for the second dropdown
      const roleSelection = await getDropdownSelection(interaction, 'roleDropdown', selectedGameQuestions);
      if (!roleSelection) return; // Exit if no valid selection

      const selectedRole = roleSelection;

      // Save user information
      const userData = {
        userId: interaction.user.id,
        username: interaction.user.username,
        shortMessage,
        roleList: `${selectedGame}: ${selectedRole}`,
      };

      writeUserData(userData);

      // Notify the user about the successful update
      const successMessage = `User information updated successfully!`;
      interaction.followUp(successMessage);

      // Log success message using the shared log function
      sharedLog(successMessage);

    } catch (error) {
      const errorMessage = `Error executing "/setinfo" command: ${error}`;

      // Log error message using the shared log function
      sharedLog(errorMessage);

      // Log error message to the console
      console.error(errorMessage);

      await interaction.followUp('An error occurred while processing the command.');
    }
  },
};

// Helper function to get the user's selection from a dropdown
async function getDropdownSelection(interaction, customId, validOptions) {
  const filter = (interaction) =>
    interaction.customId === customId &&
    interaction.user.id === interaction.user.id &&
    validOptions.includes(interaction.values[0]);

  const collector = interaction.channel.createMessageComponentCollector({
    filter,
    time: 60000, // 1 minute
  });

  try {
    const collected = await collector.next;
    if (!collected) {
      interaction.followUp('No valid response received within the time limit. The command has been canceled.');
      return null;
    }

    return collected.values[0];
  } finally {
    collector.stop();
  }
}
