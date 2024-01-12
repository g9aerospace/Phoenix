module.exports = {
  setup: (client) => {
    // Setup logic, if needed
  },
  data: {
    name: 'help',
    description: 'Display this help message.',
  },
  execute: async (interaction) => {
    try {
      const helpEmbed = {
        embeds: [
          {
            title: 'Command List',
            description: 'List of available commands:',
            fields: [
              { name: '/ping', value: 'Get a pong response.' },
              { name: '/hello', value: 'Receive a friendly greeting.' },
              { name: '/help', value: 'Display this help message.' },
            ],
          },
        ],
      };

      await interaction.reply(helpEmbed);
    } catch (error) {
      console.error('Error sending help command:', error);
      await interaction.reply('An error occurred while processing the command.');
    }
  },
};
