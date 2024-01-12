module.exports = {
  setup: (client) => {
    // Setup logic, if needed
  },
  data: {
    name: 'ping',
    description: 'Get a pong response.',
  },
  execute: async (interaction) => {
    await interaction.reply('Pong!');
  },
};
