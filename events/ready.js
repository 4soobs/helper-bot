const { Events, ActivityType, PresenceUpdateStatus } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setPresence({
			activities: [
				{
					name: '/flirty staff',
					type: ActivityType.Watching,
				},
			],
			status: PresenceUpdateStatus.Online,
		});
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};