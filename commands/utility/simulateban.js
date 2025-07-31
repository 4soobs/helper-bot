// simulateban.js
const { SlashCommandBuilder, AuditLogEvent, Events } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('simulateban')
		.setDescription('Simulates a ban and its audit log without performing a real ban.'),
	async execute(interaction) {
		const { guild, user, client, member } = interaction;

		// Create fake ban object
		const fakeBan = { guild, user };

		// Create fake audit log entry payload
		const fakeLogData = {
			action_type: AuditLogEvent.MemberBanAdd,
			user_id: member.user.id,
			target_id: user.id,
			reason: 'Simulated ban reason',
			guild_id: guild.id,
			id: 'fake-simulateban',
			changes: [],
			options: null,
		};

		// Emit both events for simulation
		client.emit('guildBanAdd', fakeBan);
		client.emit(Events.GuildAuditLogEntryCreate, fakeLogData);

		await interaction.reply('✅ Simulated ban and audit log entry.');
	},
};
