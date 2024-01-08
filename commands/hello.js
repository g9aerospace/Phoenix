// commands/hello.js

module.exports = {
  data: {
    name: 'hello',
    description: 'Say hello to the bot',
  },
  async execute(interaction) {
    await interaction.reply('Hello!');
  },
};
