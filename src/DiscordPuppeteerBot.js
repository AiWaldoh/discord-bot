const PuppeteerWrapper = require('./PuppeteerWrapper');

const Summarizer = require('./ez-summary/Summarizer');

class DiscordPuppeteerBot extends PuppeteerWrapper {

    constructor(url, cookiePath, messageEmitter) {
        super();
        this.url = url;
        this.cookiePath = cookiePath;
        this.messageEmitter = messageEmitter;
    }

    async listenForMessages(keyword, chatbot) {

        await this.page.exposeFunction('checkMessage', async message => {
            if (message.startsWith(keyword)) {
                message = message.split(keyword)[1];
                this.messageEmitter.emit('message', message);
            }
        });

        this.messageEmitter.on('message', async message => {

            let command = message.trim().split(" ")[0];

            if (command == "summarize") {
                console.log("in summarize!");
                let url = message.trim().split(" ")[1];
                const summarizer = new Summarizer(this.messageEmitter);
                try {
                    let summary = await summarizer.summarize(url, chatbot);
                    this.messageEmitter.emit('response', summary);
                } catch (ex) {
                    console.log(ex);
                    this.messageEmitter.emit('response', "Sorry, I couldn't summarize that page. Please try another page.");
                }




            } else {
                chatbot.send_message(message);
                const response = await chatbot.get_response(1);
                this.messageEmitter.emit('response', response);
            }

        });

        // Add a MutationObserver in the browser context to listen for new messages
        await this.page.evaluate(() => {
            const chatLog = document.querySelector('.scrollerInner-2PPAp2');

            setTimeout(() => {
                const observer = new MutationObserver(mutations => {
                    for (let mutation of mutations) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            const newNode = mutation.addedNodes[0];
                            const messageElement = newNode.querySelector('.markup-eYLPri.messageContent-2t3eCI');
                            if (messageElement) {
                                const message = messageElement.textContent;
                                window.checkMessage(message);
                            }
                        }
                    }
                });

                observer.observe(chatLog, { childList: true });
            }, 3000); // Adjust the delay as needed to prevent existing messages from showing up
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
    }

    async discordLogin(username, password) {
        await this.goto(`${this.url}/login`);
        await this.loginWithCredentials(username, password);
    }


    async sendTextMessage(channelUrl, message) {
        //console.log(`sending text message to channel ${channelUrl}`);
        //await this.goto(channelUrl);
        await this.waitForElement('div[role="textbox"]');
        await this.page.type('div[role="textbox"]', message);
        await this.page.keyboard.press('Enter');
    }
}

module.exports = DiscordPuppeteerBot;
