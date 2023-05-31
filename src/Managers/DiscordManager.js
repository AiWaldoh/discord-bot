const DiscordPuppeteerBot = require('../Bots/DiscordPuppeteerBot');

class DiscordManager {
    constructor(url, messageEmitter, chatBot, adminId) {
        this.puppeteer_bot = new DiscordPuppeteerBot(url, messageEmitter, chatBot, adminId);
    }

    getMessageEmitter() {
        return this.puppeteer_bot.getMessageEmitter(); // Assuming you have this method in DiscordPuppeteerBot
    }

    async logIntoDiscord(username, password) {
        await this.puppeteer_bot.init();
        await this.puppeteer_bot.discordLogin(username, password);
        console.log(`logged in!`);
    }

    async goToChannel(channelUrl) {
        await this.puppeteer_bot.goto(channelUrl);
        await this.puppeteer_bot.waitForElement('div[role="textbox"]');
        console.log(`channel loaded!`);
    }

    async startListeningForMessages(nickname) {
        await this.puppeteer_bot.listenForMessages(nickname);
    }

    async handleResponse(response) {
        try {
            await this.puppeteer_bot.sendTextMessage(response);
        } catch (error) {
            console.error('An error occurred:', error);
            // Don't call handleResponse here, it might create an infinite loop
        }
    }
}

module.exports = DiscordManager;
