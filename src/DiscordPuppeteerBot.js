const PuppeteerWrapper = require('./PuppeteerWrapper');
const OpenAIChatBot = require('./OpenAIChatBot');
const EventEmitter = require('events');
class MessageEmitter extends EventEmitter {}

class DiscordPuppeteerBot extends PuppeteerWrapper {

    constructor(url, cookiePath, messageEmitter) {
        super();
        this.url = url;
        this.cookiePath = cookiePath;
        this.messageEmitter = messageEmitter;
    }

    
    async listenForMessages(keyword) {
        // Instantiate the OpenAIChatBot
        const chatbot = new OpenAIChatBot();

        // Expose a function to the browser context that logs messages containing the keyword
        await this.page.exposeFunction('checkMessage', async message => {
            console.log(message);
            if (message.startsWith(keyword)) {
                console.log(`Keyword found in message: ${message}`);
                message = message.split("@Wendah")[1];
                // Use the chatbot to send a message and get a response
                chatbot.send_message(message);
                const response = await chatbot.get_response();

                console.log(`ChatBot response: ${response}`);

                this.messageEmitter.emit('response', response);
            }
        });

        // Add a MutationObserver in the browser context to listen for new messages
        await this.page.evaluate(() => {
            const chatLog = document.querySelector('.scrollerInner-2PPAp2'); // Updated selector
            const observer = new MutationObserver(mutations => {
                for (let mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const newNode = mutation.addedNodes[0];
                        const messageElement = newNode.querySelector('.markup-eYLPri.messageContent-2t3eCI'); // Updated selector
                        if (messageElement) {
                            const message = messageElement.textContent;
                            window.checkMessage(message);
                        }
                    }
                }
            });
            observer.observe(chatLog, { childList: true });
        });

        // Keep the script running
        await new Promise(resolve => { });
    }

    async loginWithCredentials(username, password) {
        const selectorMap = {
            '#uid_5': username,
            '#uid_7': password,
        };

        await this.fillForm(selectorMap);
        await this.clickButton('button[type="submit"]');
        await this.waitForElement('[class^="unreadMentionsIndicatorTop-"]');

        const cookies = await this.page.cookies();
        this.saveCookie(cookies, this.cookiePath);
    }

    async loginWithCookie(cookie) {
        // Navigate to the website
        console.log(cookie);
        // Set the cookie for authentication
        await this.page.setCookie(cookie);
    }

    async discordLogin(username, password) {
        await this.goto(`${this.url}/login`);
        const cookie = await this.loadCookie(this.cookiePath);

        if (cookie) {
            // A cookie exists, so log in using the cookie
            //await this.loginWithCookie(cookie);

            //TODO: fix this
            await this.loginWithCredentials(username, password);
        } else {
            // No cookie found, so perform regular login
            await this.loginWithCredentials(username, password);
        }
    }

    async sendTextMessage(channelUrl, message) {
        console.log(`sending text message to channel ${channelUrl}`);
        //await this.goto(channelUrl);
        await this.waitForElement('div[role="textbox"]');
        await this.page.type('div[role="textbox"]', message);
        await this.page.keyboard.press('Enter');
    }
}

module.exports = DiscordPuppeteerBot;
