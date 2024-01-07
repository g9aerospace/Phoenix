module.exports = {
  data: {
    name: 'ping',
    description: 'Ping command to check bot latency.',
  },
  async execute(interaction) {
    const ping = Date.now() - interaction.createdTimestamp;

    await interaction.reply({
      content: `🏓 Pong! Latency is ${Math.abs(ping)}ms.`,
      ephemeral: true,
    });
  },
};
