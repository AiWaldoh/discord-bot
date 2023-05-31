const PuppeteerWrapper = require('./PuppeteerWrapper');

//const Summarizer = require('../Summarizers/Summarizer');
const WebPageSummarizer = require('../Summarizers/WebPageSummarizer');
const CTFSummarizer = require('../Summarizers/CTFSummarizer');
const GoogleSearchSummarizer = require('../Summarizers/GoogleSearchSummarizer');

const CTFAIBot = require('./CTFOpenAIBot');
const CLI = require('../Utilities/CLIWrapper');
const querystring = require('querystring');
const WebScraper = require('../Utilities/WebScraper');

const fs = require('fs');

class DiscordPuppeteerBot extends PuppeteerWrapper {
    constructor(url, messageEmitter, wendahChatBot, adminId) {
        super();
        this.url = url;
        this.adminId = adminId;
        this.messageEmitter = messageEmitter;
        this.webScraper = new WebScraper();
        this.ctfMode = false;
        this.wendahChatBot = wendahChatBot;
        this.ctfAIBot = new CTFAIBot();
        this.cli = new CLI();

        // Bind class methods to the correct context
        this.processMessage = this.processMessage.bind(this);
        this.handleCtfMode = this.handleCtfMode.bind(this);
        this.handleSummarize = this.handleSummarize.bind(this);
        this.handleDefault = this.handleDefault.bind(this);
        this.handleGoogle = this.handleGoogle.bind(this);

        this.commands = {
            'ctfmode': this.handleCtfMode,
            'summarize': this.handleSummarize,
            'google': this.handleGoogle,
        };
        this.messageEmitter.on('message', (username, userId, message) => this.processMessage(username, userId, message));

        this.webScraper.init();
    }

    async listenForMessages(keyword) {
        await this.page.exposeFunction('checkMessage', (username, userId, message) => {
            if (message.startsWith(keyword)) {
                const messageContent = message.split(keyword)[1];
                this.messageEmitter.emit('message', username, userId, messageContent);
            }
        });
        await this.observeDiscordConversation();
    }

    async observeDiscordConversation() {
        await this.page.evaluate(() => {
            const chatLog = document.querySelector('.scrollerInner-2PPAp2');
            setTimeout(() => {
                const observer = new MutationObserver(mutations => {
                    for (let mutation of mutations) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            const newNode = mutation.addedNodes[0];
                            const messageElement = newNode.querySelector('.markup-eYLPri');
                            const avatarElement = newNode.querySelector('img.avatar-2e8lTP');
                            const usernameElement = newNode.querySelector('.username-h_Y3Us');

                            if (messageElement) {
                                let avatarURL = avatarElement.getAttribute('src');
                                let userId = avatarURL.split('/')[4]; //
                                const message = messageElement.textContent;
                                const username = usernameElement.textContent;
                                window.checkMessage(username, userId, message);
                            }
                        }
                    }
                });
                observer.observe(chatLog, { childList: true });
            }, 3000); // Adjust the delay as needed to prevent existing messages from showing up
        });
    }


    async processMessage(username, userId, message) {
        let command = message.trim().split(" ")[0];
        if (command in this.commands) {
            this.commands[command](username, userId, message);
        } else {
            this.handleDefault(username, userId, message);
        }
    }

    //
    async handleCtfMode(username, userId, message) {

        //security measure. Make better later
        if (userId != this.adminId) {
            console.log(`unauthorized attempt to enable ctf mode! ${userId}`);
            return;
        }

        console.log(`activating ctfmode!`);

        //enable ctf mode
        this.ctfMode = message.trim().split(" ")[1].toLowerCase() === "on";

        //send message to wendah. wrap in function?
        this.wendahChatBot.send_message("CTF mode is now " + (this.ctfMode ? "on" : "off" + ". It's morphing time (power rangers reference)!"));
        const response = await this.wendahChatBot.get_response(0.9);


        this.messageEmitter.emit('response', response);

    }

    //handle google command

    async handleGoogle(commandArguments) {
        const query = commandArguments.join(' ');
        const results = await this.googleSearch.search(query);
        return this.sendMessage(results);
    }

    async handleGoogle(username, userId, message) {
        console.log("in google!");

        const command = "google";

        const searchQuery = message.slice(command.length + 1).trim();
        const encodedQuery = querystring.escape(searchQuery);

        //generate google url to scrape with puppeteer
        const googleUrl = `https://www.google.ca/search?q=${encodedQuery}`;

        const summarizer = new GoogleSearchSummarizer(this.webScraper, this.wendahChatBot);

        try {

            let summary = await summarizer.summarizeGoogle(googleUrl);

            //create template to save in memory. What memory!!!???
            const databit = `###IMPORTANT### Google results from ${googleUrl}."###DATA### " + ${summary}`;

            //create template to send to discord
            const myStringWithBackticks = 'Summary for ' + googleUrl + ': ```' + summary + '```';

            //ctf bot does not remember google searches
            //save to memory???!!! save to file???!!! WHAAAAAATTTTTT
            //this.ctfAIBot.send_message(databit);

            //wendah regular remembers google searches
            //save to wendahs memory if its a normal conversation? she only has 4k tokens memory
            this.wendahChatBot.send_message(databit);

            //send to discord
            this.messageEmitter.emit('response', myStringWithBackticks);

        } catch (ex) {
            console.log(ex);
            this.messageEmitter.emit('response', "Sorry, I couldn't summarize that page. Please try another page.");
        }

    }


    async handleSummarize(username, userId, message) {
        console.log("in summarize!");

        //ctfmode uses ctfAiBot (gpt4)
        if (this.ctfMode) {

            if (userId != this.adminId) {
                console.log(`unauthorized user! ${userId}`);
                return;
            }

            let url = message.trim().split(" ")[1];

            //instantiate gpt4 ctfAibot
            const summarizer = new CTFSummarizer(this.webScraper, this.ctfAIBot);
            try {

                //needs gpt4
                let summary = await summarizer.summarize(url);
                const databit = `###IMPORTANT### scraped data from ${url}."###DATA### " + ${summary}`;
                const myStringWithBackticks = 'Summary for ' + url + ': ```' + summary + '```';
                this.ctfAIBot.send_message(databit);
                await summarizer.closeScraper();
                this.messageEmitter.emit('response', myStringWithBackticks);
            } catch (ex) {
                await summarizer.closeScraper();
                console.log(ex);
                this.messageEmitter.emit('response', "Sorry, I couldn't summarize that page. Please try another page.");
            }
        }
        else {
            let url = message.trim().split(" ")[1];
            //instantiating a new summarizer instance here??
            //const summarizer = new Summarizer(this.messageEmitter);
            const summarizer = new WebPageSummarizer(this.webScraper, this.wendahChatBot);
            try {
                //agent should be default gpt4. no need to set it in summarize
                let summary = await summarizer.summarize(url);
                const databit = `###IMPORTANT### scraped data from ${url}."###DATA### " + ${summary}`;
                const myStringWithBackticks = 'Summary for ' + url + ': ```' + summary + '```';
                this.wendahChatBot.send_message(databit);
                this.messageEmitter.emit('response', myStringWithBackticks);
                await summarizer.closeScraper();
            } catch (ex) {
                await summarizer.closeScraper();
                console.log(ex);
                this.messageEmitter.emit('response', "Sorry, I couldn't summarize that page. Please try another page.");
            }

        }
    }

    //regular conversation
    async handleDefault(username, userId, message) {

        console.log(userId);

        //ctfMode == gpt4
        if (this.ctfMode) {

            if (userId != this.adminId) {
                console.log(`unauthorized user talking to me while in ctfmode on! ${userId}`);
                return;
            }  //wenda 969698599757824080

            console.log(`speaking with CTF GPT 4!`);
            const botResponse = await this.ctfAIBot.processMessage(message);

            //if I gave it a command to run
            if (this.ctfAIBot.isValidJSON(botResponse)) {

                const linuxCommand = await this.ctfAIBot.getLinuxCommand(botResponse);

                try {
                    console.log(`running command: ${linuxCommand}`);

                    this.ctfAIBot.send_message(linuxCommand)

                    const output = await this.cli.runCommand(linuxCommand);
                    console.log(`object output: ${output}`);
                    const formattedOutput = "```\n" + output + "\n```";

                    this.ctfAIBot.send_message(formattedOutput);
                    console.log(`emitting response: ${formattedOutput}`);
                    this.messageEmitter.emit('response', formattedOutput);
                } catch (ex) {
                    const formattedError = "```\n" + ex.message + "\n```"; // access the message from the ex object
                    console.log(`emitting error response: ${formattedError}`);
                    this.ctfAIBot.send_message(formattedError);
                    this.messageEmitter.emit('response', formattedError);
                }

                //
            } else {
                console.log(`invalid json found! sending regular message!`);
                this.messageEmitter.emit('response', botResponse);
            }


            //gpt 3.5 regular message is Wendah
        } else {
            console.log('in regular message!');
            this.wendahChatBot.send_message(message);
            const response = await this.wendahChatBot.get_response(1);
            this.messageEmitter.emit('response', response);
        }
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


    async sendTextMessage(message) {
        // Define the indicator
        const indicator = ' [MORE]...';
        const ticks = '```';

        let messageToSend;

        // Check if the message length is over 1990 characters
        if (message.length > 1990 - indicator.length - ticks.length) {
            // If yes, trim the message to (1990 - length of the indicator - length of ticks) characters 
            // and append the indicator and ticks
            messageToSend = message.substring(0, 1990 - indicator.length - ticks.length) + indicator;

            // Check if the original message ends with ticks
            if (message.endsWith(ticks)) {
                // If yes, append ticks to the message to send
                messageToSend += ticks;
            }
        } else {
            // If not, use the whole message
            messageToSend = message;
        }

        // await this.page.type('div[role="textbox"]', messageToSend);
        // Use page.evaluate to set the text content all at once
        // Click the textbox to set focus
        await this.page.click('div[role="textbox"]');

        // Use page.keyboard.type() to fill the text content all at once
        await this.page.keyboard.type(messageToSend);

        // Press 'Enter' to send the message
        await this.page.keyboard.press('Enter');

        // If the original message is longer than 1990 characters, write the rest to a file
        if (message.length > 1990) {
            // Create filename from the first 20 characters of the message (spaces removed)
            let filename = message.replace(/\s/g, '').replace(/[^a-z0-9]/gi, '_').substring(0, 20);

            // Write the message to a .txt file
            fs.writeFile(`${filename}.txt`, message, (err) => {
                if (err) {
                    console.log('Error writing file:', err);
                } else {
                    console.log('Message saved to file:', `${filename}.txt`);
                }
            });
        }
    }
    getMessageEmitter() {
        return this.messageEmitter;
    }
}

module.exports = DiscordPuppeteerBot;



