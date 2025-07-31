const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {

		const confirm = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirm Ban')
			.setStyle(ButtonStyle.Danger);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(cancel, confirm);

		const response = await interaction.reply({
			content: `Are you sure you want to ban ${target.username} for reason: ${reason}?`,
			components: [row],
			withResponse: true,
		});

		const collectorFilter = i => i.user.id === interaction.user.id;
		try {
			const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

			if (confirmation.customId === 'confirm') {
				await interaction.guild.members.ban(target);
				await confirmation.update({ content: `${target.username} has been banned for reason: ${reason}`, components: [] });
			} else if (confirmation.customId === 'cancel') {
				await confirmation.update({ content: 'Action cancelled', components: [] });
			}
		}
		catch {
			await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
		}
	},
};