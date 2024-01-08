const { Client, GatewayIntentBits } = require('discord.js');
const { config } = require('dotenv');
const fs = require('fs');
const winston = require('winston');
const axios = require('axios');

// Load environment variables from .env file
config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Set up logging
const logFolder = 'logs';
if (!fs.existsSync(logFolder)) {
  fs.mkdirSync(logFolder);
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: `${logFolder}/bot.log` }),
  ],
});

// Function to log to webhook
const logToWebhook = async (message) => {
  try {
    await axios.post(process.env.WEBHOOK_URL, { content: message });
  } catch (error) {
    console.error('Error logging to webhook:', error.message);
  }
};

// Function to create a timestamped log file
const createLogFile = () => {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const fileName = `${logFolder}/${timestamp}.log`;

  fs.writeFileSync(fileName, ''); // Create an empty file

  return fileName;
};

// Function to log command details
const logCommandDetails = (commandName, startTime) => {
  const endTime = new Date();
  const elapsedTime = endTime - startTime;

  logger.info(`Command '${commandName}' executed in ${elapsedTime}ms`);

  const logMessage = `Command '${commandName}' executed in ${elapsedTime}ms`;
  logToWebhook(logMessage);
};

// Event handler for when the bot is ready
client.once('ready', () => {
  logger.info(`Logged in as ${client.user.tag}`);
});

// Event handler for when a slash command is executed
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const startTime = new Date();

  try {
    const command = require(`./commands/${interaction.commandName}.js`);
    await command.execute(interaction);
    logCommandDetails(interaction.commandName, startTime);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// Log in to Discord
client.login(process.env.TOKEN);
