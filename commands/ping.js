module.exports = {
  data: {
    name: 'ping',
    description: 'Ping command to check bot latency.',
  },
  async execute(interaction) {
    try {
      // Method 1: Using MessageEmbed
      const ping = Date.now() - interaction.createdTimestamp;
      const response = {
        embeds: [{
          title: 'Pong!',
          description: `Latency is ${Math.abs(ping)}ms.`,
          color: 0x0099ff,
        }],
      };

      await interaction.reply(response);
    } catch (errorMethod1) {
      try {
        // Method 2: Using an alternative approach (if MessageEmbed is not available)
        const ping = Date.now() - interaction.createdTimestamp;
        const response = {
          content: `Pong! Latency is ${Math.abs(ping)}ms.`,
        };

        await interaction.reply(response);
      } catch (errorMethod2) {
        console.error('Error in both methods:', errorMethod1, errorMethod2);
        interaction.reply('An error occurred while executing the command.');
      }
    }
  },
};
