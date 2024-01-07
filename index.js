const { Client, GatewayIntentBits} = require('discord.js');
const { MessageEmbed } = require('discord.js');
const express = require('express');
const { createLogger, transports, format } = require('winston');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

// Initialize Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Map();

// Initialize Express server
const app = express();
const port = process.env.WEB_SERVER_PORT || 3000;

// Create logs folder if not exists
const logsFolder = 'logs';
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder);
}

// Create a logger with timestamped log files
const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({
      filename: `${logsFolder}/${Date.now()}.log`,
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});

// Function to log to Discord webhook
const logToWebhook = async (message) => {
  try {
    await axios.post(process.env.WEBHOOK_URL, { content: message });
  } catch (error) {
    console.error('Error sending message to webhook:', error.message);
  }
};

// Event: Bot ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  logger.info(`Logged in as ${client.user.tag}`);
  logToWebhook(`Bot is now online: ${client.user.tag}`);
});

// Event: Message interaction
client.on('messageCreate', (message) => {
  // Exclude messages sent by the bot
  if (message.author.bot) return;

  // Log interactions
  console.log(`User: ${message.author.tag} | Message: ${message.content}`);
  logger.info(`User: ${message.author.tag} | Message: ${message.content}`);
  logToWebhook(`User: ${message.author.tag} | Message: ${message.content}`);

  // Your command handling logic here (if needed for non-slash commands)
});

// Load slash commands
const commandsFolder = './commands';
fs.readdirSync(commandsFolder).forEach((file) => {
  if (file.endsWith('.js')) {
    const command = require(`${commandsFolder}/${file}`);
    client.commands.set(command.data.name, command);
  }
});

// Event: Bot interaction (slash commands)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
    console.log(`Command executed: ${command.data.name}`);
    logger.info(`Command executed: ${command.data.name}`);
    logToWebhook(`Command executed: ${command.data.name}`);
  } catch (error) {
    console.error(`Error executing command: ${command.data.name}`, error);
    logger.error(`Error executing command: ${command.data.name} - ${error.message}`);
    logToWebhook(`Error executing command: ${command.data.name} - ${error.message}`);
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`Web server running at http://localhost:${port}`);
  logger.info(`Web server running at http://localhost:${port}`);
  logToWebhook(`Web server running at http://localhost:${port}`);
});

// Log in to Discord
client.login(process.env.TOKEN);
