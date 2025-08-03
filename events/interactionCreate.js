const { Events, MessageFlags, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ThreadAutoArchiveDuration } = require('discord.js');

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteAllExcept(threadChannel, messageIdToKeep) {
	let lastId;
	while (true) {
		const options = { limit: 100 };
		if (lastId) options.before = lastId;

		const messages = await threadChannel.messages.fetch(options);
		if (messages.size === 0) break;

		lastId = messages.last().id;

		for (const message of messages.values()) {
			if (message.id === messageIdToKeep || message.system) continue;

			try {
				await message.delete();
			}
			catch (err) {
				console.warn(`Could not delete message ${message.id}:`, err.message);
			}
		}
	}
}

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {
			const command = interaction.client.commands.get(interaction.commandName);

			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}

			try {
				await command.execute(interaction);
			}
			catch (error) {
				console.error(`Error executing ${interaction.commandName}`);
				console.error(error);
			}
		}
		else if (interaction.isButton()) {
			if (interaction.customId === 'proofSubmit') {
				const moderator = interaction.message.mentions.users.first();

				if (interaction.user.id !== moderator.id) {
					await interaction.reply({
						content: 'you\'re not this case\'s moderator!',
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				if (interaction.message.hasThread) {
					try {
						await interaction.message.thread.delete('Thread cleanup reason');
						console.log('Thread deleted.');
					}
					catch (error) {
						console.error('Failed to delete thread:', error);
					}
				}

				const logMsg = interaction.message;
				const embed = logMsg.embeds[0];
				if (!embed?.description) return;

				if (!embed?.description) {
					console.warn('No embed description');
					return;
				}

				const desc = embed.description;

				const fiveMinLater = Math.floor(Date.now() / 1000) + 300;
				const askEmbed = new EmbedBuilder()
					.setAuthor({
						name: 'case proof request',
						iconURL: interaction.user.avatarURL(),
					})
					.setTitle('<:070:1387872131983081504>    ⸻ proof request !*!*')
					.setDescription(`please submit any relevant information/evidence in **1 message**. this thread will be closed automatically <t:${fiveMinLater}:R>. you can try again anytime.`)
					.setColor('#b8ebff')
					.setFooter({
						text: 'thank you for keeping the server safe <3',
					})
					.setTimestamp();

				const confirmEmbed = new EmbedBuilder()
					.setAuthor({
						name: 'confirmation',
						iconURL: interaction.user.avatarURL(),
					})
					.setTitle('<:070:1387872131983081504>    ⸻ are you sure ?*!*')
					.setDescription(`are you sure you want to submit this as proof?\n\n${desc}`)
					.setColor('#b8ebff')
					.setFooter({
						text: 'thank you for keeping the server safe <3',
					})
					.setTimestamp();

				const acceptBtn = new ButtonBuilder()
					.setCustomId('acceptProof')
					.setLabel('​')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('1368154066496131122');

				const denyBtn = new ButtonBuilder()
					.setCustomId('denyProof')
					.setLabel('​')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('1368154067532251198');

				const confirmRow = new ActionRowBuilder()
					.addComponents(acceptBtn, denyBtn);

				const submitThread = await interaction.message.startThread({
					name: 'proof submission for ' + moderator.username,
					autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
					reason: moderator.username + ' requested proof submission',
				});
				const sentEmbed = await submitThread.send({ embeds: [askEmbed] });
				await interaction.reply({
					content: 'i\'ve created a thread for you <#' + submitThread.id + '>!',
					flags: MessageFlags.Ephemeral,
				});

				let submitted;

				while (true) {
					try {
						const collected = await sentEmbed.channel.awaitMessages({
							max: 1,
							time: 5 * 60 * 1000,
							errors: ['time'],
							filter: m => m.author.id === interaction.user.id,
						});

						msg = collected.first();
						const confirmResponse = await msg.reply({
							embeds: [confirmEmbed],
							components: [confirmRow],
							withResponse: true,
						});

						const collectorFilter = i => i.user.id === interaction.user.id;

						try {
							const confirmation = await confirmResponse.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
							if (confirmation.customId === 'acceptProof') {
								await confirmation.deferUpdate();
								const content = msg.content || '';
								const files = msg.attachments.map(att => att.url);
								const proofMsg = await submitThread.send({ content, files });
								await deleteAllExcept(submitThread, proofMsg.id);
								await submitThread.send('proof submitted by <@' + interaction.user.id + '>');
								await submitThread.setLocked(true);
								await submitThread.setArchived(true);
								submitted = true;
								break;
							}
							else if (confirmation.customId === 'denyProof') {
								await confirmation.update({ content: 'action cancelled, closing thread...', components: [], embeds: [] });
								await wait(5000);
								await submitThread.delete();
								return;
							}
						}
						catch {
							await interaction.editReply({ content: 'confirmation not recieved after 1 minute, closing thread...', components: [], embeds: [] });
							await wait(5000);
							await submitThread.delete();
							return;
						}
					}
					catch {
						if (!submitThread) return;
						await submitThread.send('proof not recieved after 5 minutes, closing thread...');
						await wait(5000);
						await submitThread.delete();
						return;
					}
				}
				const newLogEmbed = new EmbedBuilder(embed);
				const proofSubmitBtn = new ButtonBuilder()
					.setCustomId('proofSubmit')
					.setLabel('submit proof')
					.setStyle(ButtonStyle.Secondary)
					.setEmoji('1398284839739854998')
					.setDisabled(true);
				const btnRow = new ActionRowBuilder()
					.addComponents(proofSubmitBtn);
				if (submitted) {
					const newDescription = embed.description.replace(
						'*waiting for proof submission...*',
						'proof submitted in <#' + submitThread.id + '>',
					);
					newLogEmbed.setDescription(newDescription);
					interaction.message.edit({ embeds: [newLogEmbed], components: [btnRow] });
				}
			}
		}
	},
};