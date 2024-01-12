module.exports = {
    setup: (client) => {
      // Setup logic, if needed
    },
    data: {
      name: 'hello',
      description: 'Receive a friendly greeting.',
    },
    execute: async (interaction) => {
      await interaction.reply('Hello!');
    },
  };
  