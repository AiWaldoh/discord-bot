
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

let default_model = "gpt-3.5-turbo";
let default_message = "You are an AI capable of only responding in valid json format.###Example###{question: \"Hi, how can I help you?\"}"

class OpenAIChatBot {
    constructor(model = default_model, initial_message = default_message) {

        this.model = model;
        this.messages = [{ role: "system", content: initial_message }];
        this.openai = new OpenAIApi(new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        }));
        this.prompt_tokens_used = [];
        this.completion_tokens_used = [];
        this.total_tokens_used = [];
    }

    set_role(initial_message) {
        this.messages[0] = { role: "system", content: initial_message };
    }

    send_message(message) {
        message = Buffer.from(message, 'utf8').toString();
        this.messages.push({ role: "user", content: message });
    }

    async get_response(temperature = 0.7) {
        let response;
        try {
            response = await this.openai.createChatCompletion({
                model: this.model,
                messages: this.messages,
                temperature: temperature,
            });
            const usage = response.data.usage;
            this.prompt_tokens_used.push(usage.prompt_tokens);
            this.completion_tokens_used.push(usage.completion_tokens);
            this.total_tokens_used.push(usage.total_tokens);
            this.messages.push({ role: "assistant", content: response.data.choices[0].message.content });

            return response.data.choices[0].message.content;
        } catch (error) {
            if (error.response) {
                console.log(error.response.status);
                console.log(error.response.data);
            } else {
                console.log(error.message);
            }
        }
    }

    clear_messages() {
        this.messages = [{ role: "system", content: default_message }];
        this.prompt_tokens_used = [];
        this.completion_tokens_used = [];
        this.total_tokens_used = [];
    }

    get_prompt_tokens_used() {
        return this.prompt_tokens_used;
    }

    get_completion_tokens_used() {
        return this.completion_tokens_used;
    }

    get_total_tokens_used() {
        return this.total_tokens_used;
    }

    set_model(model) {

        this.model = model;
    }

    get_model() {
        return this.model;
    }

}

module.exports = OpenAIChatBot;

