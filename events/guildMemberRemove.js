const { Events, AuditLogEvent, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member) {
		const guild = member.guild;
		const logChannelId = process.env.LOGCHANNELID;

		const logChannel = guild.channels.cache.get(logChannelId);

		// Fetch more entries to increase accuracy
		const fetchedLogs = await guild.fetchAuditLogs({
			type: AuditLogEvent.MemberKick,
			limit: 5,
		});

		// Find the most recent entry for this user within the last 5 seconds
		const now = Date.now();
		const auditEntry = fetchedLogs.entries.find(entry =>
			entry.target.id === member.id &&
			(now - entry.createdTimestamp) < 5000,
		);

		// if no matching log entry, return
		if (!auditEntry) return;

		let { executor, reason } = auditEntry;
		const { target } = auditEntry;

		// processing reason and executor
		if (executor.id == '593921296224747521') {
			// quering reason for mod username & reason
			const parts = reason.split('User Responsible: ')[1].split(' / ');
			const modUsername = parts[0];
			reason = parts[1].toLowerCase();
			const guildMembers = await guild.members.fetch({ query: modUsername, limit: 10 });
			executor = guildMembers.find(m => m.user.username === modUsername).user;
			if (!executor) return;
		}
		else if (executor.bot) {
			console.log('bot executor found that\'s not bleed, ignoring');
			return;
		}

		const logEmbed = new EmbedBuilder()
			.setAuthor({
				name: 'kicked by ' + executor.username,
				iconURL: executor.avatarURL(),
			})
			.setTitle('<:070:1387872131983081504>    ⸻ kick proof !*!*')
			.setDescription('**target:** ' + target.username + ' (`' + target.id + '`)\n**moderator:** ' + executor.username + ' (`' + executor.id + '`)\n**reason:** ' + (reason || 'no reason provided') + '\n**proof:** *waiting for proof submission...*')
			.setColor('#b8ebff')
			.setFooter({
				text: 'thank you for keeping the server safe <3',
			})
			.setTimestamp();

		const proofSubmitBtn = new ButtonBuilder()
			.setCustomId('proofSubmit')
			.setLabel('submit proof')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('1398284839739854998');

		const btnRow = new ActionRowBuilder()
			.addComponents(proofSubmitBtn);

		await logChannel.send({ content: '<@' + executor.id + '>', embeds: [logEmbed], components: [btnRow] });
	},
};