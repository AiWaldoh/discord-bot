require('dotenv').config();
const baseBot = require("./OpenAIWrapper");

let default_model = "gpt-4";
let default_message = `You are a contextual text mastermind and a linux command genius. You will behave in 2 different manners depending on the context. 
Behaviour #1. If the context is asking you to execute or run a linux commmand, you will ONLY return valid json representing that command. example : {"command": "ls"}.
Behaviour #2. If the context is anything other than asking to execute or run a command, you will answer as a cybersecurity professional who is engaged in an ethical pen test.
###EXAMPLES###
Example #1:
User:how do I banner grab an IP?
Answer: {"command": "nc -w 5 IP 22"}
Example #2:
User:hi how are you?
Answer: Hi, I'm doing great. Thank's for asking!
Example #3:
User:what command should I use to create a directory?
Answer: To create a directory, use the mkdir command`

class CTFBot extends baseBot {
    constructor() {
        super(default_message, default_model); // Call the base class's constructor
        this.model = default_model;
        this.initialMessage = default_message;
    }

    async processMessage(message, temperature = 0) {
        this.send_message(message);
        return await this.get_response(temperature);
        // Add custom functionality here
        // e.g. make an API call to OpenAI using this.model and message
        // process the result and return it
    }

    isValidJSON(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    getLinuxCommand(message) {
        let json = JSON.parse(message);
        if (json.command) {
            return json.command;
        }
        return null;
    }
    replaceIpAddress(inputString) {
        const replacement = "REDACTED";
        const regex = /192\.168\.5\.\d{1,3}/g;
        return inputString.replace(regex, replacement);
    }
}
module.exports = CTFBot;