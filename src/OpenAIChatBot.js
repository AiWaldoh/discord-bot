const { Configuration, OpenAIApi } = require("openai");
const EnvWrapper = require('./EnvWrapper');

class OpenAIChatBot {
    constructor(initial_message = "You are a helpful assistant.", model = "gpt-3.5-turbo") {
        this.env = new EnvWrapper();
        this.configuration = new Configuration({
            apiKey: this.env.get("OPENAI_API_KEY"),
        });
        this.model = model;
        this.messages = [{ role: "system", content: initial_message }];
        this.prompt_tokens_used = [];
        this.completion_tokens_used = [];
        this.total_tokens_used = [];
        this.openai = new OpenAIApi(this.configuration);
    }

    set_role(initial_message) {
        this.messages[0] = { role: "system", content: initial_message };
    }

    send_message(message) {
        message = Buffer.from(message, 'utf-8').toString();
        this.messages.push({ role: "user", content: message });
    }

    async get_response(temperature = 0.7, presence_penalty = 0, frequency_penalty = 0, n = 1) {
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
            console.log(response.data.choices);
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
        this.messages = [{ role: "system", content: "You are a helpful assistant." }];
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
}

module.exports = OpenAIChatBot;
