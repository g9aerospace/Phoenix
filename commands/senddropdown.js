const { MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
  data: {
    name: 'senddropdown',
    description: 'Send a message with a dropdown menu.',
  },
  execute: async (interaction) => {
    try {
      const userTag = interaction.user.tag;
  
      // Define the options for the dropdown
      const options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
      ];
  
      // Log the usage of the command to the console
      console.log(`Command "/senddropdown" used by ${userTag}.`);
  
      // Reply to the interaction with the select menu
      await interaction.reply({
        content: 'Please select an option:',
        components: [
          {
            type: 1, // Action row
            components: [
              {
                type: 3, // Select menu
                custom_id: 'dropdown',
                placeholder: 'Select an option',
                options: options,
              },
            ],
          },
        ],
      });
  
      // Log that the reply was successfully sent
      console.log('Dropdown menu replied successfully.');
  
    } catch (error) {
      // Handle errors by logging to the console
      console.error(`Error handling command "senddropdown": ${error.message}`);
      await interaction.reply('An error occurred while processing the command.');
  
      // Log that an error occurred during the execution
      console.error('Error during execution:', error);
    }
  },
  
  
};
