const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
const { format } = require('date-fns');
const axios = require('axios');
require('dotenv').config();

const logsFolder = './logs';
let currentLogFile;
const botLogQueue = [];
let isProcessingBotLogQueue = false;

// Webhook URL from .env
const webhookURL = process.env.WEBHOOK_URL;

// Function to create a new log file with timestamp as the name
function createLogFile() {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  currentLogFile = path.join(logsFolder, `${timestamp}.log`);
  fs.writeFileSync(currentLogFile, `Log started at: ${timestamp}\n\n`);
}

// Function to log messages to the console, current log file, and bot webhook queue
async function log(message) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const formattedMessage = `[${timestamp}] ${message}`;

  console.log(formattedMessage);
  fs.appendFileSync(currentLogFile, `${formattedMessage}\n`);

  // Log to bot webhook queue
  if (webhookURL) {
    botLogQueue.push(formattedMessage);
    if (!isProcessingBotLogQueue) {
      processBotLogQueue();
    }
  }
}

// Function to process the bot-related log queue and send logs to the webhook
async function processBotLogQueue() {
  isProcessingBotLogQueue = true;

  // Wait for a brief period to collect more logs
  await new Promise(resolve => setTimeout(resolve, 500));

  if (botLogQueue.length > 0) {
    const logs = botLogQueue.join('\n');
    botLogQueue.length = 0; // Clear the queue
    try {
      await axios.post(webhookURL, { content: logs });
      console.log('Logged to bot webhook successfully.');
    } catch (webhookError) {
      handleWebhookError(webhookError, botLogQueue, processBotLogQueue);
    }
  }

  isProcessingBotLogQueue = false;
}

// Handle webhook error and retry mechanism
function handleWebhookError(webhookError, logQueue, processLogQueue) {
  if (webhookError.response && webhookError.response.status === 429) {
    // Retry after a delay (e.g., 5 seconds)
    console.log('Rate limited. Retrying after 5 seconds...');
    setTimeout(() => {
      processLogQueue();
    }, 5000);
  } else {
    console.error(`Error logging to webhook: ${webhookError.message}`);
  }
}

// Initialize logs folder if it does not exist
if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder);
}

// Initialize a new log file on startup
createLogFile();

// Export webhook URL for other modules if needed
module.exports = {
  webhookURL,
  log, // Export log function for other modules
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [];

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    try {
      // Handle each command separately
      if (commandName === 'ping') {
        await require('./commands/ping').execute(interaction, log);
      } else if (commandName === 'hello') {
        await require('./commands/hello').execute(interaction, log);
      } else if (commandName === 'help') {
        await require('./commands/help').execute(interaction, log);
      } else if (commandName === 'info') {
        await require('./commands/info').execute(interaction, log);
      } else if (commandName === 'setinfo') {
        await require('./commands/setinfo').execute(interaction, log);
      } else if (commandName === 'finduser') {
        await require('./commands/finduser').execute(interaction, log);
      } else if (commandName === 'userinfo') {
        await require('./commands/userinfo').execute(interaction, log);
      }
    } catch (error) {
      console.error(`Error handling command "${commandName}": ${error}`);
      await interaction.reply('An error occurred while processing the command.');
    }
  }
});

// Function to handle game dropdown selection
async function handleGameDropdown(interaction, selectedGame) {
  await interaction.reply({ content: `You selected the game: ${selectedGame}`, ephemeral: true });
}

// Function to handle role dropdown selection
async function handleRoleDropdown(interaction, selectedRole) {
  await interaction.reply({ content: `You selected the role: ${selectedRole}`, ephemeral: true });
}

// Function to handle category dropdown selection
async function handleCategoryDropdown(interaction, selectedCategory) {
  await interaction.reply({ content: `You selected the category: ${selectedCategory}`, ephemeral: true });
}

// Function to handle question dropdown selection
async function handleQuestionDropdown(interaction, selectedQuestion) {
  await interaction.reply({ content: `You selected the question: ${selectedQuestion}`, ephemeral: true });
}

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

client.login(process.env.TOKEN);

async function loadCommands() {
  try {
    // Check if the commands folder exists
    const commandsFolder = './commands';
    if (!fs.existsSync(commandsFolder)) {
      throw new Error('Commands folder not found.');
    }

    // Read each file in the commands folder and load the commands
    const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      try {
        const command = require(`./commands/${file}`);
        if (typeof command.setup === 'function') {
          command.setup(client, log);
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
    
    // Update global slash commands
    await rest.put(
      Routes.applicationCommands(application.id),
      { body: commands },
    );

    log('Successfully reloaded global (/) commands.');
  } catch (error) {
    log(`Error refreshing global (/) commands: ${error}`);
  }
}