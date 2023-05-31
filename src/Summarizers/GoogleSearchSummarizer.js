const Summarizer = require('./Summarizer');

class GoogleSearchSummarizer extends Summarizer {
    constructor(scraper, chatBot) {
        super(scraper, chatBot);
    }

    async summarizeGoogle(url) {
        const jsonXpaths = {
            "xpath": [
                "//div[@class='yuRUbf']/a[@href]",
                "//div[contains(@class, 'VwiC3b')]//span/span[1]",
                "//div[contains(@class, 'VwiC3b')]//span/span[2]",
                "//div[contains(@class, 'yuRUbf')]//h3"
            ]
        }

        const relevantXpathSiteData = await this.parseData(url, jsonXpaths.xpath);

        const originalModel = this.chatBot.get_model();
        this.chatBot.set_model('gpt-3.5-turbo');
        const summary = await this.getSummary("You are a Google Search API.", "You will return the title, link, date and short description for these google results", relevantXpathSiteData, 0);
        this.chatBot.set_model(originalModel);
        await this.closeScraper();

        return summary;
    }
}

module.exports = GoogleSearchSummarizer;