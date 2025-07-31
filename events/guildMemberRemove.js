const { Events, AuditLogEvent, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: Events.GuildMemberRemove,
	async execute(member) {
		console.log(`[DEBUG] Member left: ${member.user.tag}`);
		const guild = member.guild;
		const user = member.user;
		const logChannelId = process.env.LOGCHANNELID;

		const logChannel = guild.channels.cache.get(logChannelId);

		// Fetch more entries to increase accuracy
		const fetchedLogs = await guild.fetchAuditLogs({
			type: AuditLogEvent.MemberKick,
			limit: 5,
		});

		// Find the most recent entry for this user within the last 5 seconds
		const now = Date.now();
		const kickLog = fetchedLogs.entries.find(entry =>
			entry.target.id === user.id &&
			(now - entry.createdTimestamp) < 5000 // 5 seconds
		);

		if (!kickLog) {
			console.warn(`No matching audit log entry found for kicked user ${user.tag}`);
			return;
		}

		const { executor, target, reason } = kickLog;

		const logEmbed = new EmbedBuilder()
			.setAuthor({
				name: 'banned by ' + executor.username,
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