const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { config } = require('dotenv');
const winston = require('winston');
const axios = require('axios');
const fs = require('fs');

config(); // Load environment variables from .env file

// Configure Winston logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new winston.transports.File({ filename: 'logs/bot.log' }),
  ],
});

// Function to register slash commands globally
async function registerGlobalSlashCommands() {
  const commandsData = [];
  const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commandsData.push(command.data);
    commands.set(command.data.name, command);

    // Log each loaded command in green
    logger.info('\x1b[32m%s\x1b[0m', `Loaded command: ${command.data.name}`);
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    logger.info('Started refreshing global (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandsData },
    );

    logger.info('Successfully reloaded global (/) commands.');
  } catch (error) {
    logger.error(`Error refreshing global (/) commands: ${error.message}`);
    logToWebhook(`Error refreshing global (/) commands: ${error.message}`);
  }
}

// Function to post logs to Discord webhook
async function logToWebhook(message) {
  const webhookURL = process.env.WEBHOOK_URL;

  if (webhookURL) {
    try {
      // Post logs to the webhook
      await axios.post(webhookURL, { content: `\`\`\`asciidoc\n${message}\n\`\`\`` });
      logger.info('Logs successfully posted to the webhook.');
    } catch (error) {
      logger.error('Error posting logs to webhook:', error.message);
    }
  } else {
    logger.warn('WEBHOOK_URL is not defined in the .env file. Logs will not be posted to a webhook.');
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const commands = new Map();

client.once('ready', async () => {
  logToWebhook('Bot is starting...');
  logger.info('\x1b[33m%s\x1b[0m', `Logged in as ${client.user.tag}`);

  // Register global slash commands on startup
  await registerGlobalSlashCommands();
});

client.on('messageCreate', (message) => {
  logger.info('\x1b[36m%s\x1b[0m', `Received message: ${message.content} from ${message.author.tag}`);
  // Your message handling logic here
});

client.on('interactionCreate', (interaction) => {
  const startTime = Date.now();
  logger.info('\x1b[35m%s\x1b[0m', `Received interaction: ${interaction.type} from ${interaction.user.tag}`);

  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    command.execute(interaction);

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    logger.info(`Command ${interaction.commandName} executed in ${timeTaken}ms`);
  } catch (error) {
    logger.error(`Error executing command: ${error.message}`);
    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// Start the web server
const webServer = require('./server');

// Log process errors
process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled promise rejection: ${error}`);
  logToWebhook(`Unhandled promise rejection: ${error}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error}`);
  logToWebhook(`Uncaught exception: ${error}`);
});

// Log metrics to webhook every minute
setInterval(() => {
  const logs = fs.readFileSync('logs/bot.log', 'utf8');
  logToWebhook(logs);
}, 60000);

client.login(process.env.TOKEN);
