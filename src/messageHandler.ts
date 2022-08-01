import { APIUser, ButtonStyle, ComponentType, Message } from 'discord.js';
import fetch from 'node-fetch';
import { tokenRegex } from './constants.js';
import { elipsis } from './utils.js';

export async function messageHandler(message: Message): Promise<void> {
	if (!message.content || message.author.bot) return;

	const token = tokenRegex.exec(message.content);
	if (!token) return;

	const { snowflake } = token.groups!;

	const user = await message.client.users.fetch(Buffer.from(snowflake!, 'base64').toString('utf8')).catch(() => null);

	if (!user) return;

	const tokenInfo = (await fetch('https://discord.com/api/v10/users/@me', {
		headers: {
			Authorization: `${user.bot ? 'Bot ' : ''}${token[0]!}`,
			'Content-Type': 'application/json',
		},
	}).then((res) => res.json())) as APIUser & { message?: string; code?: number };

	const isValid = !Boolean(tokenInfo.message);
	const type = user.bot ? 'Bot' : 'User';
	const tag = `${tokenInfo.username}#${tokenInfo.discriminator}`;

	console.log(tokenInfo);

	const parameters = [`\`⚠️\` **Warning**: We have detected a ${type.toLowerCase()} token in your message.`];

	if (isValid) {
		parameters.push('', '**Token Info**');
		parameters.push(`> **Id:** ${tokenInfo.id}`);
		parameters.push(`> **${type} Tag:** ${tag}`);
		parameters.push(
			'',
			user.bot
				? '**If the bot is yours, use the button bellow to reset the token**'
				: `**Please \`${tag}\` change your password ${tokenInfo.mfa_enabled ? '' : 'and enable 2FA'}**`,
		);
	} else {
		parameters.push('', "Although this is token isn't valid anymore, you should be more careful!!");
	}

	if (isValid && message.deletable) {
		await message.channel.send(
			elipsis(
				[
					`**Filtered message from ${message.author.tag}**`,
					'',
					message.content.replace(tokenRegex, '[ <Filtered Token> ]'),
				].join('\n'),
				2048,
			),
		);
	}

	await message
		.reply({
			content: parameters.join('\n'),
			components:
				user.bot && isValid
					? [
							{
								type: ComponentType.ActionRow,
								components: [
									{
										type: ComponentType.Button,
										label: 'Reset your bot Token',
										url: `https://discord.com/developers/applications/${tokenInfo.id}/bot`,
										style: ButtonStyle.Link,
									},
								],
							},
					  ]
					: [],
		})
		.then(() => (message.deletable && isValid ? message.delete() : null));
}
