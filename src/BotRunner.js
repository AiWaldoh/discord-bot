const EnvWrapper = require('./EnvWrapper');
const DiscordPuppeteerBot = require('./DiscordPuppeteerBot');
const MessageEmitter = require('events');

class BotRunner {
    constructor() {
        this.env = new EnvWrapper();
        this.messageEmitter = new MessageEmitter();
    }

    async runBot() {
        const username = this.env.get('DISCORD_EMAIL');
        const password = this.env.get('DISCORD_PASSWORD');
        const channelUrl = this.env.get('DISCORD_CHANNEL_URL');
        const nickname = this.env.get("DISCORD_NICKNAME");
        const cookiesPath = './cookies/discord-cookie.json';


        this.bot = new DiscordPuppeteerBot('https://discord.com', cookiesPath, this.messageEmitter);
        await this.bot.init();

        try {
            // Log in to Discord
            await this.bot.discordLogin(username, password);

            // Send a text message to the specified channel
            await this.bot.goto(channelUrl);
            await this.bot.waitForElement('div[role="textbox"]');
            //await this.bot.sendTextMessage(channelUrl, 'Hello, again!');

            await this.bot.listenForMessages(nickname);

            // Close the browser
            //await this.bot.close();
        } catch (error) {
            console.error('An error occurred:', error);
            process.exit(1);
        }
    }

    handleResponse(response) {
        console.log('Received a response from the chatbot:', response);
        // This is an example, you should replace 'channelUrl' with actual value
        this.bot.sendTextMessage('channelUrl', response);
    }
}

module.exports = BotRunner;
