// commands/start.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start a session'),

  async execute(interaction) {
    const sessionCode = Math.random().toString(36).substring(7);
    const userId = interaction.user.id;
    const userFilePath = `users/${userId}.json`;

    const serverIP = process.env.SERVER_IP || 'localhost';
    const serverPort = process.env.WEB_SERVER_PORT || 3000;

    const websiteURL = `http://${serverIP}:${serverPort}/index.html?code=${sessionCode}`;

    await interaction.reply({
      content: `To start the session, go to ${websiteURL} and enter the code: \`${sessionCode}\`.`,
      ephemeral: true,
    });

    const userSessionData = {
      sessionCode: sessionCode,
      responses: [],
    };

    fs.writeFileSync(userFilePath, JSON.stringify(userSessionData, null, 2));
  },
};
