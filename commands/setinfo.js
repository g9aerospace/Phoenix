const fs = require('fs');
const path = require('path');
const { log } = require('../index');
const axios = require('axios');
require('dotenv').config();

// Function to save user data to a JSON file
function saveUserData(userId, userData) {
  const usersFolder = './users';
  const userFilePath = path.join(usersFolder, `${userId}.json`);

  // Ensure the "users" folder exists
  if (!fs.existsSync(usersFolder)) {
    fs.mkdirSync(usersFolder);
  }

  // Check if the user file already exists
  let existingData = {};
  if (fs.existsSync(userFilePath)) {
    const existingContent = fs.readFileSync(userFilePath, 'utf-8');
    existingData = JSON.parse(existingContent);
  }

  // Merge existing data with new data
  const mergedData = { ...existingData, ...userData };

  // Write merged data to the JSON file
  fs.writeFileSync(userFilePath, JSON.stringify(mergedData, null, 2));

  // Log to console
  console.log(`User data saved to: ${userFilePath}`);
}

// Function to log messages to the specified webhook using Axios
async function sharedLogToWebhook(message) {
  const webhookURL = process.env.WEBHOOK_URL;

  if (webhookURL) {
    try {
      await axios.post(webhookURL, { content: message });
    } catch (webhookError) {
      console.error(`Error logging to webhook: ${webhookError.message}`);
      // Log webhook error details to the newest log file
      logToFile(`Error logging to webhook: ${webhookError.message}`);
    }
  } else {
    console.warn('Webhook URL not provided in the environment variables.');
    // Log warning details to the newest log file
    logToFile('Webhook URL not provided in the environment variables.');
  }
}

// Function to append messages to the newest file in the "logs" folder
function logToFile(message) {
  const logsFolder = './logs';

  const logFiles = fs.readdirSync(logsFolder).filter(file => file.endsWith('.log'));
  logFiles.sort((a, b) => fs.statSync(path.join(logsFolder, b)).mtime.getTime() - fs.statSync(path.join(logsFolder, a)).mtime.getTime());

  const newestLogFile = logFiles.length > 0 ? logFiles[0] : new Date().toISOString().replace(/:/g, '-') + '.log';
  const logFilePath = path.join(logsFolder, newestLogFile);

  fs.appendFileSync(logFilePath, `${message}\n`);
  console.log(message); // Log to console
}

// Import the predefined questions data
const gameData = require('../assets/questions.json');

module.exports = {
  setup: (client, sharedLog) => {
    // Any setup logic can go here if needed
  },
  data: {
    name: 'setinfo',
    description: 'Ask the user for a short message about themselves (not more than 300 words).',
  },
  execute: async (interaction, sharedLog) => {
    try {
      const userTag = interaction.user.tag;

      // Log using the shared log function
      sharedLog(`Command "/setinfo" used by ${userTag}.`);

      if (!interaction.replied) {
        const user = interaction.user;

        // Check if the user provided a file attachment
        if (interaction.attachments && interaction.attachments.size > 0) {
          interaction.followUp(`Sorry ${user.tag}, please provide your information as text instead of a file attachment. Stay within the character limit (not more than 300 words).`);
          return;
        }

        // Ask the user for a short message including everything about them
        await interaction.reply(`Hello ${user.tag}! Please provide a short message about yourself (not more than 300 words). You have 10 minutes.`);

        // Collect the user's response for the short message
        const shortMessageFilter = (response) => response.author.id === user.id;
        const shortMessageCollector = interaction.channel.createMessageCollector({ filter: shortMessageFilter, time: 600000 }); // 10 minutes

        let shortMessage = '';

        shortMessageCollector.on('collect', (response) => {
          // Limit the short message to 300 words
          shortMessage = response.content.trim().slice(0, 300);

          // Log the user's provided information
          sharedLog(`${user.tag} provided short message: ${shortMessage}`);

          // Save user data to a JSON file
          saveUserData(user.id, { userId: user.id, username: user.tag, shortMessage });

          // Respond to the user acknowledging their input
          interaction.followUp(`Thank you, ${user.tag}! Your information has been noted.`);

          // Stop the collector after collecting the response
          shortMessageCollector.stop();

          // Ask the user to visit a website and generate a list of roles
          interaction.followUp(`Now, ${user.tag}, please visit [this website](https://phoenix.g9aerospace.in/) and generate a list of roles you can apply for. Reply with the list within the next 10 minutes.`);

          // Collect the user's response for role list
          const roleListFilter = (response) => response.author.id === user.id;
          const roleListCollector = interaction.channel.createMessageCollector({ filter: roleListFilter, time: 600000 }); // 10 minutes

          let roleList = '';

          roleListCollector.on('collect', (response) => {
            roleList = response.content.trim();

            // Log the user's provided role list
            sharedLog(`${user.tag} provided role list: ${roleList}`);

            // Check each line for validity
            const lines = roleList.split('\n');

            // Check if the user's response matches with the predefined roles/questions
            const isValidResponse = (game, role) => {
              const foundGame = gameData.games.find((g) => g.name.toLowerCase() === game.toLowerCase());
              return foundGame && foundGame.questions.includes(role);
            };

            // Function to format the user's response as required
            const formatUserResponse = (game, role) => `${game}: ${role}`;

            // Check each line for validity
            const isValidLines = lines.every((line) => {
              const [game, role] = line.split(':').map((item) => item.trim());
              return isValidResponse(game, role);
            });

            // If all lines are valid, save the user data; otherwise, ask for a non-modified text
            if (isValidLines) {
              // Save role list data to the user's JSON file
              saveUserData(user.id, { roleList });

              // Respond to the user acknowledging their input
              interaction.followUp(`Thank you, ${user.tag}! Your role list has been noted.`);
            } else {
              // Respond to the user and ask for a non-modified text
              interaction.followUp(`Sorry ${user.tag}, please provide only a non-modified text message. Ensure that the generated text matches the predefined roles/questions.`);
              
              // Stop the collector after providing the response
              roleListCollector.stop();
            }
          });

          roleListCollector.on('end', (collected, reason) => {
            if (reason === 'time') {
              interaction.followUp(`Time is up! Please run the command again to provide your information and role list.`);
            }
          });
        });

        shortMessageCollector.on('end', (collected, reason) => {
          if (reason === 'time') {
            interaction.followUp(`Time is up! Please run the command again to provide your information.`);
          }
        });
      }
    } catch (error) {
      const errorMessage = `Error executing "/setinfo" command: ${error}`;

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
