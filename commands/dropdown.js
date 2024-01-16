const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'dropdown',
        description: 'Send a dropdown menu to the user.',
    },
    async execute(interaction) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('starter')
            .setPlaceholder('Make a selection!')
            .setMinValues(1)  // Minimum number of selected options (set to 1 to allow at least one selection)
            .setMaxValues(3)  // Maximum number of selected options (set to the number of options to allow selecting all)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Bulbasaur')
                    .setDescription('The dual-type Grass/Poison Seed Pokémon.')
                    .setValue('bulbasaur'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Charmander')
                    .setDescription('The Fire-type Lizard Pokémon.')
                    .setValue('charmander'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Squirtle')
                    .setDescription('The Water-type Tiny Turtle Pokémon.')
                    .setValue('squirtle'),
            );

        const row = new ActionRowBuilder()
            .addComponents(select);

        await interaction.reply({
            content: 'Choose your starter!',
            components: [row],
        });
    },
};
