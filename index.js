const { Client, GatewayIntentBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { config } = require('dotenv');
const winston = require('winston');
const fs = require('fs');

config(); // Load environment variables from .env file

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const commands = new Map();

// Configure Winston logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
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
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    logger.info('Started refreshing global (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commandsData },
    );

    logger.info('Successfully reloaded global (/) commands.');
  } catch (error) {
    logger.error(`Error refreshing global (/) commands: ${error.message}`);
  }
}

client.once('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}`);
  
  // Register global slash commands on startup
  await registerGlobalSlashCommands();
});

client.on('messageCreate', (message) => {
  logger.info(`Received message: ${message.content} from ${message.author.tag}`);
  // Your message handling logic here
});

client.on('interactionCreate', (interaction) => {
  logger.info(`Received interaction: ${interaction.type} from ${interaction.user.tag}`);
  
  if (!interaction.isCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing command: ${error.message}`);
    interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
