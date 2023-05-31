const Summarizer = require("./Summarizer");

const prompt = `The following data is html hierarchy from a website article. Each data element contains it's first 4 words. Return xpath selectors for paragraph and heading tags where the 4 words are relevant to summarizing an article from a website. Focus on selectors for paragraphs.
###EXAMPLE###
[{"tag":"main","id":"jump-content","class":"site-content","text":null,"children":[{"tag":"article","id":"","class":"uni-article-wrapper","text":null,"children":[{"tag":"section","id":"","class":"article-hero","text":null,"children":[{"tag":"div","id":"","class":"article-hero__container","text":null,"children":[{"tag":"h1","id":"","class":"article-hero__h1","text":"Being bold on AI","children":[]}]}]}]
###RESPONSE###
{
  "xpath": [
    "//div[@class='article-hero__container']//h1",
  ]
}`;


class WebPageSummarizer extends Summarizer {
  constructor(scraper, chatBot) {
    super(scraper, chatBot);
    this.summarizePrompt = prompt;
  }

  async summarize(url) {
    const data = await this.scrapeWebsite(url);
    const jsonXpaths = await this.getImportantData(this.summarizePrompt, data);
    const websiteVisibleText = await this.parseData(url, jsonXpaths.xpath);
    const summary = await this.getSummary("You are a summarization AI.", "Comprehensively summarize the following text so it's maximum 3000 tokens size for an AI to understand:", websiteVisibleText, 0.5);
    await this.closeScraper();

    return summary;
  }

}

module.exports = WebPageSummarizer;