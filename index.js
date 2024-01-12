const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const { format } = require('date-fns');
require('dotenv').config();

const logsFolder = './logs';
const commandsFolder = './commands';
let currentLogFile;

// Function to create a new log file with timestamp as the name
function createLogFile() {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  currentLogFile = path.join(logsFolder, `${timestamp}.log`);
  fs.writeFileSync(currentLogFile, `Log started at: ${timestamp}\n\n`);
}

// Function to log messages to the console and current log file
function log(message) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  console.log(`[${timestamp}] ${message}`);
  fs.appendFileSync(currentLogFile, `[${timestamp}] ${message}\n`);
}

// Initialize logs folder if not exists
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder);
}

// Initialize a new log file on startup
createLogFile();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [];

client.once('ready', async () => {
  try {
    log(`Logged in as ${client.user.tag}`);
    
    // Load slash commands
    loadCommands();

    // Refresh slash commands across all guilds
    await refreshSlashCommands();
  } catch (error) {
    log(`Error during startup: ${error}`);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    // Handle each command separately
    if (commandName === 'ping') {
      await require('./commands/ping').execute(interaction);
    } else if (commandName === 'hello') {
      await require('./commands/hello').execute(interaction);
    } else if (commandName === 'help') {
      await require('./commands/help').execute(interaction);
    }
    // Add more conditions for other commands as needed
  } catch (error) {
    log(`Error handling command "${commandName}": ${error}`);
    await interaction.reply('An error occurred while processing the command.');
  }
});

client.login(process.env.TOKEN);

async function loadCommands() {
  try {
    // Check if the commands folder exists
    if (!fs.existsSync(commandsFolder)) {
      throw new Error('Commands folder not found.');
    }

    // Read each file in the commands folder and load the commands
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      try {
        const command = require(`./commands/${file}`);
        if (typeof command.setup === 'function') {
          command.setup(client);
          log(`Command ${file} loaded successfully.`);
        } else {
          log(`Invalid command structure in ${file}.`);
        }

        // Collect command data for global update
        commands.push(command.data);
      } catch (error) {
        log(`Error loading command from ${file}: ${error}`);
      }
    }
  } catch (error) {
    log(`Error during command loading: ${error}`);
  }
}

async function refreshSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    log('Started refreshing global (/) commands.');

    // Fetch application (bot) information
    const application = await client.application?.fetch();
    
    // Update global slash commands (null is used for global commands)
    await rest.put(
      Routes.applicationCommands(application.id),
      { body: commands },
    );

    log('Successfully reloaded global (/) commands.');
  } catch (error) {
    log(`Error refreshing global (/) commands: ${error}`);
  }
}
