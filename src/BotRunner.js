const EnvWrapper = require('./EnvWrapper');
const DiscordPuppeteerBot = require('./DiscordPuppeteerBot');
const { EventEmitter } = require('events');
const OpenAIChatBot = require('./OpenAIChatBot');
const fs = require('fs').promises;
class BotRunner {
    constructor() {
        this.env = new EnvWrapper();
        this.messageEmitter = new EventEmitter();

        //SECURITY MEASURE FOR CTF MODE. NEED COMPACT MODE WITH DISPLAY PICS ON. MANUALLY DO THIS FOR NOW
        this.adminId = this.env.get("ADMIN_DISCORD_ID");

        this.username = this.env.get('DISCORD_EMAIL');
        this.password = this.env.get('DISCORD_PASSWORD');
        this.channelUrl = this.env.get('DISCORD_CHANNEL_URL');
        this.nickname = this.env.get("DISCORD_NICKNAME");
        this.role = this.env.get("OPENAI_INITIAL_MESSAGE");
    }

    async runBot() {
        const cookiesPath = './browserState/discord-data.json';

        try {
            const chatbot = await this.initializeChatBot();
            this.puppeteer_bot = new DiscordPuppeteerBot('https://discord.com', cookiesPath, this.messageEmitter, chatbot, this.adminId);
            await this.logIntoDiscord();
            await this.goToChannel();
            await this.startListeningForMessages(chatbot);
        } catch (error) {
            console.error('An error occurred:', error);
            this.handleResponse("One Moment. I 404 sometimes.");
            process.exit(1);
        }
    }

    async initializeChatBot() {
        let chatbot = new OpenAIChatBot();
        chatbot.set_role(this.role);
        const context = await this.readFile(`prompt.txt`);
        chatbot.send_message(context);
        return chatbot;
    }

    async logIntoDiscord() {
        await this.puppeteer_bot.init();
        await this.puppeteer_bot.discordLogin(this.username, this.password);
        console.log(`logged in!`);
    }

    async goToChannel() {
        await this.puppeteer_bot.goto(this.channelUrl);
        await this.puppeteer_bot.waitForElement('div[role="textbox"]');
        console.log(`channel loaded!`);
    }

    async startListeningForMessages(chatbot) {
        await this.puppeteer_bot.listenForMessages(this.nickname, chatbot);
    }

    async handleResponse(response) {
        try {
            await this.puppeteer_bot.sendTextMessage(response);
        } catch (error) {
            console.error('An error occurred:', error);
            // Don't call handleResponse here, it might create an infinite loop
        }
    }

    async readFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return data;
        } catch (error) {
            console.error(`Got an error trying to read the file: ${error.message}`);
        }
    }

}

module.exports = BotRunner;
