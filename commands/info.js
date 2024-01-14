const { name, version, description, author, repository, website } = require('../package.json');

module.exports = {
  setup: (client, sharedLog) => {
    module.exports.client = client;
    module.exports.sharedLog = sharedLog;
  },
  data: {
    name: 'info',
    description: 'Get information about the bot.',
  },
  execute: async (interaction) => {
    try {
      const userTag = interaction.user.tag;

      // Ensure the client object is accessible within the execute function
      const client = module.exports.client;
      const sharedLog = module.exports.sharedLog;

      // Read information from package.json
      const botInfo = {
        Name: name,
        Version: version,
        Description: description,
        Author: author,
        Repository: repository,
        Website: website
      };

      // Log using the shared log function
      sharedLog(`Command "/info" used by ${userTag}. Bot Information: ${JSON.stringify(botInfo)}`);

      // Reply with bot information as an embed
      const embed = {
        title: 'Bot Information',
        fields: Object.entries(botInfo).map(([name, value]) => ({ name, value })),
        color: 0x0099ff,
      };

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorMessage = `Error executing "/info" command: ${error}`;

      // Log error using the shared log function
      sharedLog(errorMessage);

      await interaction.reply('An error occurred while processing the command.');
    }
  },
};
