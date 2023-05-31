// const WebScraper = require('../Utilities/WebScraper');
// const OpenAIChatBot = require('../Bots/OpenAIWrapper');

class Summarizer {
  constructor(scraper, chatBot) {
    this.scraper = scraper;
    this.chatBot = chatBot;
  }

  async closeScraper() {
    this.scraper.close();
  }

  async parseData(url, xpath) {
    console.log(`Parsing important data using xpath...`);
    return await this.scraper.getTextFromXPath(url, xpath);
  }

  async getImportantData(prompt, data) {
    this.chatBot.send_message(prompt);
    this.chatBot.send_message(JSON.stringify(data));

    return JSON.parse(await this.chatBot.get_response(0));
  }
  async scrapeWebsite(url) {
    //await this.scraper.init();
    console.log(`Navigating to url: ${url}...`);
    await this.scraper.goToPage(url);

    return await this.scraper.scrapeForImportantStuff();
  }
  async getSummary(role, message, text, temperature) {
    this.chatBot.clear_messages();
    this.chatBot.set_role(role);
    this.chatBot.send_message(message);
    this.chatBot.send_message(text);

    return await this.chatBot.get_response(temperature);
  }
}

module.exports = Summarizer;

