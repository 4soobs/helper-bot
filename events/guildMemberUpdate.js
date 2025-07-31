const { Events, AuditLogEvent, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: Events.GuildMemberUpdate,
	async execute(oldMember, newMember) {
		const freshMember = await newMember.guild.members.fetch(newMember.id);
		const target = freshMember;
		const logChannelId = process.env.LOGCHANNELID;

		const logChannel = newMember.guild.channels.cache.get(logChannelId);

		// Compare roles
		const jailedRoleId = process.env.JAILEDROLEID;

		// Check if jailed role was added right now
		const oldRoles = new Set(oldMember.roles.cache.keys());
		const newRoles = new Set(newMember.roles.cache.keys());
		const wasJailedAdded = !oldRoles.has(jailedRoleId) && newRoles.has(jailedRoleId);

		if (!wasJailedAdded) return;
		// If no roles changed, do nothing\

		// Fetch audit logs
		const fetchedLogs = await newMember.guild.fetchAuditLogs({
			limit: 5,
			type: AuditLogEvent.MemberRoleUpdate,
		});

		// Find a matching log entry
		const now = Date.now();
		const auditEntry = fetchedLogs.entries.find(entry =>
			entry.target.id === newMember.id &&
			now - entry.createdTimestamp < 5000,
		);

		if (!auditEntry) return;

		const { executor, reason } = auditEntry;
		const newReason = reason?.split('for ').slice(1).join('for ') || 'no reason provided';

		if (wasJailedAdded) {
			const logEmbed = new EmbedBuilder()
				.setAuthor({
					name: 'banned by ' + executor.username,
					iconURL: executor.avatarURL(),
				})
				.setTitle('<:070:1387872131983081504>    ⸻ jail proof !*!*')
				.setDescription('**target:** ' + target.user.username + ' (`' + target.user.id + '`)\n**moderator:** ' + executor.username + ' (`' + executor.id + '`)\n**reason:** ' + (newReason || 'no reason provided') + '\n**proof:** *waiting for proof submission...*')
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
		}
	},
};