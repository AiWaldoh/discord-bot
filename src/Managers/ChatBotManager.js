const OpenAIWrapper = require('../Bots/OpenAIWrapper');
const fs = require('fs').promises;

class ChatBotManager {
    constructor() {
        this.chatBot = new OpenAIWrapper();
    }

    async initialize(role, contextFilePath) {
        this.chatBot.set_role(role);
        const context = await this.readFile(contextFilePath);
        this.chatBot.send_message(context);
    }
    getChatBot() {
        return this.chatBot;
    }
    async getResponse() {
        return await this.chatBot.get_response();
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

module.exports = ChatBotManager;
