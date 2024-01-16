// add.js

const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { log } = require('../assets/logger');

module.exports = {
    data: {
        name: 'add',
        description: 'Add a new server with a short message.',
    },
    async execute(interaction) {
        try {
            log('INFO', 'Command execution started: add');

            // Create the modal
            const modal = new ModalBuilder()
                .setCustomId('addServerCommand')
                .setTitle('Add Server');

            // Create the text input component for short message
            const messageInput = new TextInputBuilder()
                .setCustomId('messageInput')
                .setLabel('Short Message (max 150 characters)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(150);

            // Add the input to the modal
            const messageRow = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(messageRow);

            // Show the modal to the user
            await interaction.showModal(modal);

            log('INFO', 'Modal displayed to user');

            log('INFO', 'Command execution completed: add');
        } catch (error) {
            log('ERROR', `Error executing add command: ${error.message}`);

            if (error instanceof DiscordAPIError) {
                log('ERROR', `Discord API Error: ${error.code}`);
            }

            if (error.response && error.response.data) {
                log('ERROR', `API Response Data: ${JSON.stringify(error.response.data)}`);
            }
        }
    },
};
