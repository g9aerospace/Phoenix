const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    try {
      // Start measuring the time
      const start = Date.now();

      // Send initial response
      await interaction.reply({ content: 'Pinging...', ephemeral: true });

      // End measuring the time
      const end = Date.now();
      const latency = end - start;

      // Edit the initial response with detailed message
      await interaction.editReply(`Pong! Latency is ${latency}ms.`);

      // Log details to Discord webhook
      const webhookURL = process.env.WEBHOOK_URL;
      if (webhookURL) {
        await axios.post(webhookURL, {
          content: `Command /ping invoked by ${interaction.user.tag}. Latency: ${latency}ms.`,
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      // You can handle the error as needed
    }
  },
};
