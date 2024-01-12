const fs = require('fs');
const { Client, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v10');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [];
const commandsFolder = './commands';

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Load slash commands
  loadCommands();

  // Refresh slash commands across all guilds
  await refreshSlashCommands();
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
  } catch (error) {
    console.error(`Error handling command "${commandName}":`, error);
    await interaction.reply('An error occurred while processing the command.');
  }
});

client.login(process.env.TOKEN);

async function loadCommands() {
  // Check if the commands folder exists
  if (!fs.existsSync(commandsFolder)) {
    console.error('Commands folder not found.');
    return;
  }

  // Read each file in the commands folder and load the commands
  const commandFiles = fs.readdirSync(commandsFolder).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    try {
      const command = require(`./commands/${file}`);
      if (typeof command.setup === 'function') {
        command.setup(client);
        console.log(`Command ${file} loaded successfully.`);
      } else {
        console.error(`Invalid command structure in ${file}.`);
      }

      // Collect command data for global update
      commands.push(command.data);
    } catch (error) {
      console.error(`Error loading command from ${file}:`, error);
    }
  }
}

async function refreshSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('Started refreshing global (/) commands.');

    // Fetch application (bot) information
    const application = await client.application?.fetch();
    
    // Update global slash commands (null is used for global commands)
    await rest.put(
      Routes.applicationCommands(application.id),
      { body: commands },
    );

    console.log('Successfully reloaded global (/) commands.');
  } catch (error) {
    console.error('Error refreshing global (/) commands:', error);
  }
}
