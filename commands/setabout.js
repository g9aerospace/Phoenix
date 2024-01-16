// setAbout.js

const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { log } = require('../assets/logger');

module.exports = {
    data: {
        name: 'setabout',
        description: 'Set your user description.',
    },
    async execute(interaction) {
        try {
            log('INFO', 'Command execution started: setabout');

            // Create the modal for setting user description
            const modal = new ModalBuilder()
                .setCustomId('setAboutCommand')
                .setTitle('Set About');

            // Create the text input component for user description
            const descriptionInput = new TextInputBuilder()
                .setCustomId('descriptionInput')
                .setLabel('User Description (max 150 characters)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(150);

            // Add the input to the modal
            const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
            modal.addComponents(descriptionRow);

            // Show the modal to the user
            await interaction.showModal(modal);

            log('INFO', 'Modal displayed to user');

            log('INFO', 'Command execution completed: setabout');
        } catch (error) {
            log('ERROR', `Error executing setabout command: ${error.message}`);

            if (error instanceof DiscordAPIError) {
                log('ERROR', `Discord API Error: ${error.code}`);
            }

            if (error.response && error.response.data) {
                log('ERROR', `API Response Data: ${JSON.stringify(error.response.data)}`);
            }
        }
    },
};
