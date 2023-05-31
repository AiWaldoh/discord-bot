const EnvironmentManager = require('./Managers/EnvironmentManager');
const ChatBotManager = require('./Managers/ChatBotManager');
const DiscordManager = require('./Managers/DiscordManager');
const SoldierAgentManager = require('./Managers/SoldierAgentManager');
const { EventEmitter } = require('events');

class BotRunner {
    constructor() {
        this.envManager = new EnvironmentManager();
        this.chatBotManager = new ChatBotManager();
        this.discordManager = new DiscordManager('https://discord.com', new EventEmitter(), this.chatBotManager.getChatBot(), this.envManager.getEnvVariable('ADMIN_DISCORD_ID'));
        this.soldierAgentManager = new SoldierAgentManager();
        this.messageEmitter = this.discordManager.getMessageEmitter(); // Assuming you have a getMessageEmitter method in DiscordManager

        this.setupCommandListener();
    }

    setupCommandListener() {
        this.messageEmitter.on('command', async (command) => {
            try {
                const result = await this.soldierAgentManager.executeTask(command);
                console.log('Task execution result:', result);
            } catch (error) {
                console.error('Error executing task:', error);
            }
        });
    }
    // Add the handleResponse method
    async handleResponse(response) {
        await this.discordManager.handleResponse(response);
    }
    async runBot() {
        try {
            await this.chatBotManager.initialize(this.envManager.getEnvVariable('OPENAI_INITIAL_MESSAGE'), 'prompt.txt');
            await this.discordManager.logIntoDiscord(this.envManager.getEnvVariable('DISCORD_EMAIL'), this.envManager.getEnvVariable('DISCORD_PASSWORD'));
            await this.discordManager.goToChannel(this.envManager.getEnvVariable('DISCORD_CHANNEL_URL'));

            //listens in discord channel and replies to messages
            await this.discordManager.startListeningForMessages(this.envManager.getEnvVariable('DISCORD_NICKNAME'));
        } catch (error) {
            console.error('An error occurred:', error);
            await this.discordManager.handleResponse("One Moment. I 404 sometimes.");
            process.exit(1);
        }
    }
}

module.exports = BotRunner;
