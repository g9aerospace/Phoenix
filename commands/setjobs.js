const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');
const servicesData = require('../assets/services.json'); // Assuming the services.json file is in the parent directory

module.exports = {
    data: {
        name: 'setjobs',
        description: 'Select the jobs which apply to you',
    },
    async execute(interaction) {
        const jobOptions = servicesData.services.map(service => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(service.job)
                .setDescription(`Roles available for ${service.job}`)
                .setValue(service.job);
        });

        const select = new StringSelectMenuBuilder()
            .setCustomId('jobs')
            .setPlaceholder('Choose the jobs that apply to you')
            .setMinValues(1) // Minimum number of selected options
            .setMaxValues(jobOptions.length) // Maximum number of selected options (equal to the number of jobs)
            .addOptions(...jobOptions);

        const row = new ActionRowBuilder()
            .addComponents(select);

        await interaction.reply({
            content: 'Choose your Jobs',
            components: [row],
        });
    },
};
