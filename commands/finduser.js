const fs = require('fs');
const path = require('path');
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

        // Ask the user to specify a game
        const gameFilter = (response) => response.author.id === interaction.user.id && games.includes(response.content);
        await interaction.reply(`Please specify the game you are interested in from the following list: ${games.join(', ')}`);
        const gameResponse = await interaction.channel.awaitMessages({ filter: gameFilter, max: 1, time: 60000 }); // 1 minute

        if (gameResponse.size === 0) {
          return interaction.followUp('No valid response received within the time limit. The command has been canceled.');
        }

        const selectedGame = gameResponse.first().content;
        const selectedGameQuestions = gameData.games.find(game => game.name === selectedGame)?.questions;

        // Ask the user to specify a role for the selected game
        const roleFilter = (response) => response.author.id === interaction.user.id && selectedGameQuestions.includes(response.content);
        await interaction.followUp(`Great! Now, please specify the role you are interested in for the game "${selectedGame}" from the following list: ${selectedGameQuestions.join(', ')}`);
        const roleResponse = await interaction.channel.awaitMessages({ filter: roleFilter, max: 1, time: 60000 }); // 1 minute

        if (roleResponse.size === 0) {
          return interaction.followUp('No valid response received within the time limit. The command has been canceled.');
        }

        const selectedRole = roleResponse.first().content;

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
