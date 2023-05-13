const EnvWrapper = require('./EnvWrapper');
const DiscordPuppeteerBot = require('./DiscordPuppeteerBot');
const { EventEmitter } = require('events');
const OpenAIChatBot = require('./OpenAIChatBot');
class BotRunner {
    constructor() {
        this.env = new EnvWrapper();
        this.messageEmitter = new EventEmitter();
    }

    async runBot() {
        const username = this.env.get('DISCORD_EMAIL');
        const password = this.env.get('DISCORD_PASSWORD');
        const channelUrl = this.env.get('DISCORD_CHANNEL_URL');
        const nickname = this.env.get("DISCORD_NICKNAME");
        const cookiesPath = './browserState/discord-data.json';
        // Instantiate the OpenAIChatBot
        let chatbot = new OpenAIChatBot();
        chatbot.set_role(this.env.get("OPENAI_INITIAL_MESSAGE"));
        const context = this.env.get("OPENAI_CONTEXT");

        chatbot.send_message(context);

        this.bot = new DiscordPuppeteerBot('https://discord.com', cookiesPath, this.messageEmitter);

        await this.bot.init();

        try {
            // Log in to Discord
            await this.bot.discordLogin(username, password);
            console.log(`logged in!`);

            // Go to listening channel
            await this.bot.goto(channelUrl);
            //wait for channel to load
            await this.bot.waitForElement('div[role="textbox"]');

            // Send a message
            //await this.bot.sendTextMessage(channelUrl, 'Hello, again!');

            // Listen for messages and respond to them
            await this.bot.listenForMessages(nickname, chatbot);

            //await this.bot.close();
        } catch (error) {
            console.error('An error occurred:', error);
            process.exit(1);
        }
    }

    async handleResponse(response) {
        const channelUrl = this.env.get('DISCORD_CHANNEL_URL');
        console.log('Received a response from the chatbot:', response);
        await this.bot.sendTextMessage(channelUrl, response);
    }
}

module.exports = BotRunner;
