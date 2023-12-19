const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    const start = Date.now();
    await interaction.reply({ content: 'Pinging...', ephemeral: true });

    const end = Date.now();
    const latency = end - start;

    interaction.editReply(`Pong! Latency is ${latency}ms.`);
  },
};
