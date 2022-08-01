import { Client as DjsClient, IntentsBitField } from 'discord.js';
import { messageHandler } from './messageHandler.js';

const GatewayIntents = IntentsBitField.Flags;

const Client = new DjsClient({
	intents: [GatewayIntents.GuildMessages, GatewayIntents.Guilds, GatewayIntents.MessageContent],
});

Client.on('messageCreate', messageHandler);

Client.on('messageUpdate', async (oldMessage, newMessage) => {
	if (oldMessage.content === newMessage.content) {
		return;
	}

	if (newMessage.partial) newMessage = await newMessage.fetch();

	await messageHandler(newMessage);
});

Client.on('debug', console.log);

await Client.login(process.env.DISCORD_TOKEN);
