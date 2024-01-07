module.exports = {
  data: {
    name: 'ping',
    description: 'Ping command to check bot latency.',
  },
  async execute(interaction) {
    const ping = Date.now() - interaction.createdTimestamp;

    await interaction.reply({
      content: `🏓 Pong! Latency is ${ping}ms.`,
      ephemeral: true, // Set to true if you want the response to be visible only to the user who triggered the command
    });
  },
};
