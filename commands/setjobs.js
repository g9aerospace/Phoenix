// commands/setjobs.js

const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');
const servicesData = require('../assets/services.json'); // Assuming the services.json file is in the parent directory

module.exports = {
    data: {
        name: 'setjobs',
        description: 'Select the jobs and roles which apply to you',
    },
    async execute(interaction) {
        const jobOptions = servicesData.services.map(service => {
            return new StringSelectMenuOptionBuilder()
                .setLabel(service.job)
                .setDescription(`Roles available for ${service.job}`)
                .setValue(service.job);
        });

        const selectJobs = new StringSelectMenuBuilder()
            .setCustomId('jobs')
            .setPlaceholder('Choose the jobs that apply to you')
            .setMinValues(1)
            .setMaxValues(jobOptions.length)
            .addOptions(...jobOptions);

        const rowJobs = new ActionRowBuilder()
            .addComponents(selectJobs);

        await interaction.reply({
            content: 'Choose your Jobs',
            components: [rowJobs],
        });
    },
};
