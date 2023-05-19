const EnvWrapper = require('./EnvWrapper');
const DiscordPuppeteerBot = require('./DiscordPuppeteerBot');
const { EventEmitter } = require('events');
const OpenAIChatBot = require('./OpenAIChatBot');
const fs = require('fs').promises;

class BotRunner {
    constructor() {
        this.env = new EnvWrapper();
        this.messageEmitter = new EventEmitter();
    }

    async readFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return data;
        } catch (error) {
            console.error(`Got an error trying to read the file: ${error.message}`);
        }
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
        const context = await this.readFile(`prompt.txt`);

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
            // Listen for messages and respond to them
            await this.bot.listenForMessages(nickname, chatbot);

            //await this.bot.close();
        } catch (error) {
            console.error('An error occurred:', error);
            this.handleResponse("One Moment. I 404 sometimes.");
            process.exit(1);
        }


    }

    async handleResponse(response) {
        const channelUrl = this.env.get('DISCORD_CHANNEL_URL');
        try {
            await this.bot.sendTextMessage(channelUrl, response);
        } catch (error) {
            console.error('An error occurred:', error);
            this.handleResponse("I think I 404'd in my code...");
        }

    }
}

module.exports = BotRunner;
