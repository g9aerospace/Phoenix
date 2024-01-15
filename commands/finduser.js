const fs = require('fs');
const path = require('path');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { log } = require('../index');
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

module.exports = {
  setup: (client, sharedLog) => {
    // Any setup logic can go here if needed
  },
  data: {
    name: 'finduser',
    description: 'Find users based on the specified game and role.',
  },
  execute: async (interaction, sharedLog) => {
    try {
      const userTag = interaction.user.tag;

      // Ignore messages from the bot itself
      if (interaction.user.bot) {
        return;
      }

      // Log using the shared log function
      sharedLog(`Command "/finduser" used by ${userTag}.`);

      if (!interaction.replied) {
        // Read the predefined games and questions from the JSON file
        const gameData = require('../assets/questions.json');
        const games = gameData.games.map(game => game.name);

        // Define the options for the first dropdown (games)
        const gameOptions = games.map(game => ({ label: game, value: game }));

        // Ask the user to specify a game using the first dropdown
        await interaction.reply({
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

        // Define the options for the second dropdown (roles)
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

        // Find users with the specified game and role
        const usersFolder = './users';
        const matchingUsers = [];

        if (fs.existsSync(usersFolder)) {
          const userFiles = fs.readdirSync(usersFolder).filter(file => file.endsWith('.json'));

          for (const userFile of userFiles) {
            const userId = userFile.replace('.json', '');
            const userData = readUserData(userId);

            if (userData && userData.roleList && userData.roleList.includes(`${selectedGame}: ${selectedRole}`)) {
              matchingUsers.push(userData);
            }
          }
        }

        // Notify the command executor with the matching users
        if (matchingUsers.length > 0) {
          const userInformation = matchingUsers.map(user => `\n- ${user.username} (${user.userId})`);
          interaction.followUp(`Users with the specified game "${selectedGame}" and role "${selectedRole}":${userInformation}`);
        } else {
          interaction.followUp(`No users found with the specified game "${selectedGame}" and role "${selectedRole}".`);
        }
      }
    } catch (error) {
      const errorMessage = `Error executing "/finduser" command: ${error}`;

      // Log using the shared log function
      sharedLog(errorMessage);

      // Log error to the newest log file
      logToFile(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
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

// Function to log errors to the newest log file
function logToFile(errorMessage) {
  // Implement your logToFile logic here
}
