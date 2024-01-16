const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const { log } = require('./assets/logger');

dotenv.config();

log('INFO', 'Bot starting up...');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const startTime = Date.now();

client.once('ready', async () => {
    try {
        const endTime = Date.now();
        const uptime = (endTime - startTime) / 1000; // Uptime in seconds
        log('INFO', `Logged in as ${client.user.tag}`);
        log('INFO', `Bot is now ready. Uptime: ${uptime.toFixed(2)} seconds`);
        log('INFO', `Bot's ping: ${client.ws.ping}ms`);

        // Set initial activity status
        setBotActivityStatus();

        // Fetch the global application
        const application = await client.application.fetch();
        log('INFO', 'Global application fetched successfully.');

        // Set global commands
        await application.commands.set([]);
        log('INFO', 'Global commands set successfully.');

        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            await application.commands.create(command.data);
            log('INFO', `Global slash command loaded/reloaded: ${file}`);
        }

        // Update activity status every 5 minutes
        setInterval(() => {
            setBotActivityStatus();
            log('INFO', 'Bot activity status updated.');
        }, 5 * 60 * 1000); // 5 minutes in milliseconds
    } catch (error) {
        log('ERROR', `Error during initialization: ${error.message}`);
        log('WARNING', 'Initialization may not have completed successfully.');
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        const interactionStartTime = Date.now();
        const userWhoTriggered = interaction.user.tag;

        if (!interaction.isCommand() && !interaction.isModalSubmit()) return;
        log('INFO', `Received interaction: ${interaction.type} from ${userWhoTriggered}`);

        if (interaction.isCommand()) {
            const { commandName } = interaction;
            log('INFO', `Command interaction received: ${commandName} from ${userWhoTriggered}`);

            try {
                // Dynamically handle commands based on the command name
                const command = require(`./commands/${commandName}.js`);
                await command.execute(interaction);
                log('INFO', `Command '${commandName}' executed successfully.`);
            } catch (error) {
                log('ERROR', `Error handling command '${commandName}': ${error.message}`);
                log('WARNING', 'There was an error while executing a command.');
                await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
            } finally {
                const interactionEndTime = Date.now();
                const interactionDuration = (interactionEndTime - interactionStartTime) / 1000; // Duration in seconds
                log('INFO', `Interaction duration: ${interactionDuration.toFixed(2)} seconds`);
            }
        }

        if (interaction.isModalSubmit() && interaction.customId === 'addServerCommand') {
          // Extract data from modal submissions
          const serverName = interaction.fields.getTextInputValue('nameInput');
          const serverAddress = interaction.fields.getTextInputValue('addressInput');
          const message = interaction.fields.getTextInputValue('messageInput');
    
          // Save data to a JSON file named after the user's userId
          const userId = interaction.user.id;
          const userData = { serverName, serverAddress, message };
    
          // Specify the file path
          const filePath = `./users/${userId}.json`;
    
          try {
              // Ensure the "users" directory exists, create it if not
              await fs.promises.mkdir('./users', { recursive: true });
    
              // Write the data to the JSON file
              await fs.promises.writeFile(filePath, JSON.stringify(userData, null, 2));
              console.log(`Data saved to ${filePath}`);
          } catch (error) {
              console.error(`Error saving data for user ${userId}:`, error);
              await interaction.reply({ content: 'There was an error while processing your request.', ephemeral: true });
              return;
          }
    
          // Reply to the user
          await interaction.reply({ content: 'Server information received and saved successfully!', ephemeral: true });
      }
    } catch (error) {
        log('ERROR', `Error during interaction handling: ${error.message}`);
        log('WARNING', 'There was an error during interaction handling.');
    }
});

client.login(process.env.TOKEN);
log('INFO', 'Bot login initiated.');

function setBotActivityStatus() {
    const activities = [
        { name: 'with Discord.js', type: 'PLAYING' },
        { name: 'with commands', type: 'PLAYING' },
        { name: 'with logs', type: 'WATCHING' },
        { name: 'for interactions', type: 'LISTENING' },
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];

    client.user.setActivity(activity.name, { type: activity.type });
    log('INFO', `Bot activity status updated: ${activity.type} ${activity.name}`);
}
