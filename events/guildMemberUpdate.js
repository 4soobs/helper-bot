const { Events, AuditLogEvent, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	name: Events.GuildMemberUpdate,
	async execute(oldMember, newMember) {
		const freshMember = await newMember.guild.members.fetch(newMember.id);
		const target = freshMember;

		const logChannelId = process.env.LOGCHANNELID;
		const jailedRoleId = process.env.JAILEDROLEID;

		// fetch the log channel
		const logChannel = newMember.guild.channels.cache.get(logChannelId);

		// get the old and new roles
		const oldRoles = new Set(oldMember.roles.cache.keys());
		const newRoles = new Set(newMember.roles.cache.keys());
		// compare the roles to see if the jailed role was added
		const wasJailedAdded = !oldRoles.has(jailedRoleId) && newRoles.has(jailedRoleId);

		// if nothing changed, return
		if (!wasJailedAdded) return;

		// fetch audit logs by member role update
		const fetchedLogs = await newMember.guild.fetchAuditLogs({
			limit: 5,
			type: AuditLogEvent.MemberRoleUpdate,
		});

		// find a matching log entry
		const now = Date.now();
		const auditEntry = fetchedLogs.entries.find(entry =>
			entry.target.id === newMember.id &&
			now - entry.createdTimestamp < 5000,
		);

		// if no matching log entry, return
		if (!auditEntry) return;
		let { executor, reason } = auditEntry;

		// processing reason and executor
		if (executor.id == '593921296224747521') {
			// quering reason for mod username & reason
			reason = reason?.split('for ').slice(1).join('for ') || 'no reason provided';
			const modUsername = reason?.split('Jailed by ')[1]?.split(' for ')[0]?.trim();
			const guildMembers = await newMember.guild.members.fetch({ query: modUsername, limit: 10 });
			executor = guildMembers.find(m => m.user.username === username);
			if (!executor) return;
		}
		else if (executor.bot) {
			// executor is a bot but not bleed, return
			return;
		}

		// if upper if-statement isn't executed, executor is a user that added the role manually

		const logEmbed = new EmbedBuilder()
			.setAuthor({
				name: 'banned by ' + username,
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
	},
};