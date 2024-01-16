const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const { log } = require('./assets/logger');
const servicesData = require('./assets/services.json');
const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');

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
        if (!interaction.isCommand() && !interaction.isModalSubmit() && !interaction.isSelectMenu()) {
            // Handle other types of interactions or catch any unexpected cases
            // Add your default handling or error response here
            log('WARNING', `Unhandled interaction type: ${interaction.type}`);
            await interaction.reply({ content: 'Unhandled interaction type.', ephemeral: true });
            return;
        }

        if (interaction.isCommand()) {
            // Handle command interactions
            const { commandName } = interaction;

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
                const interactionDuration = (interactionEndTime - interaction.createdAt) / 1000; // Duration in seconds
                log('INFO', `Interaction duration: ${interactionDuration.toFixed(2)} seconds`);
            }
        } else if (interaction.isModalSubmit() && interaction.customId === 'setAboutCommand') {
            // Extract data from modal submission
            const userDescription = interaction.fields.getTextInputValue('descriptionInput');

            // Save data to a JSON file named after the user's userId
            const userId = interaction.user.id;
            const userData = { userDescription };

            // Specify the file path
            const filePath = `./users/${userId}.json`;

            try {
                // Ensure the "users" directory exists, create it if not
                await fs.promises.mkdir('./users', { recursive: true });

                // Write the data to the JSON file
                await fs.promises.writeFile(filePath, JSON.stringify(userData, null, 2));
                log('INFO', `User description saved to ${filePath}`);

                // Reply to the user
                await interaction.reply({ content: 'User description set successfully!', ephemeral: true });
            } catch (error) {
                console.error(`Error saving user description for user ${userId}:`, error);
                log('ERROR', `Error saving user description for user ${userId}: ${error.message}`);
                await interaction.reply({ content: 'There was an error while processing your request.', ephemeral: true });
            }
        } else  if (interaction.isSelectMenu() && interaction.customId === 'jobs') {
          // Handle job selection from the first dropdown

          // Get the selected jobs
          const selectedJobs = interaction.values || [];

          // Create options for the second dropdown based on the selected jobs
          const roleOptions = [];
          for (const selectedJob of selectedJobs) {
              const jobData = servicesData.services.find(service => service.job === selectedJob);
              if (jobData) {
                  roleOptions.push(
                      ...jobData.roles.map(role => new StringSelectMenuOptionBuilder()
                          .setLabel(role)
                          .setDescription(`Select roles for ${selectedJob}`)
                          .setValue(`${selectedJob}-${role}`)
                      )
                  );
              }
          }

          // Create the second dropdown for roles
          const selectRoles = new StringSelectMenuBuilder()
              .setCustomId('roles')
              .setPlaceholder('Choose the roles for selected jobs')
              .setMinValues(1)
              .setMaxValues(roleOptions.length)
              .addOptions(...roleOptions);

          // Send the second dropdown to the user
          await interaction.reply({
              content: 'Choose your Roles',
              components: [new ActionRowBuilder().addComponents(selectRoles)],
          });
      }
    } catch (error) {
        // Handle any errors or log them as needed
        console.error(`Error during interaction handling: ${error.message}`);
        log('ERROR', `Error during interaction handling: ${error.message}`);
        log('WARNING', 'There was an error during interaction handling.');
        await interaction.reply({ content: 'There was an error while processing your request.', ephemeral: true });
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
