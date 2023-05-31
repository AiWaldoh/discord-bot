const Summarizer = require("./Summarizer");

const prompt = `The following data is html hierarchy with elements and the first 4 words of text they contain. Return xpath selectors for all the visible text using descendants syntax (//)
###EXAMPLE###
[{"tag":"main","id":"jump-content","class":"site-content","text":null,"children":[{"tag":"article","id":"","class":"uni-article-wrapper","text":null,"children":[{"tag":"section","id":"","class":"article-hero","text":null,"children":[{"tag":"div","id":"","class":"article-hero__container","text":null,"children":[{"tag":"h1","id":"","class":"article-hero__h1","text":"Being bold on AI","children":[]}]}]}]
###RESPONSE###
{
  "xpath": [
    "//div[@class='article-hero__container']//h1",
  ]
}`;

class CTFSummarizer extends Summarizer {
  constructor(scraper, chatBot) {
    super(scraper, chatBot);
    this.PROMPT_CTF = prompt;
  }

  async summarize(url) {
    const data = await this.scrapeWebsite(url);
    const jsonXpaths = await this.getImportantData(this.PROMPT_CTF, data);
    const websiteVisibleText = await this.parseData(url, jsonXpaths.xpath);
    const summary = await this.getSummary(
      "You are an ethical hacker doing a CTF. You will return important information such as versions, software name, if there's a form, etc. Mention known vulnerabilities and finally give a brief summary of the website's technologies.",
      "Summarize the information relevant to an ethical hacker doing a pentest from this website.",
      websiteVisibleText,
      0
    );
    await this.closeScraper();
    return summary;
  }
}

module.exports = CTFSummarizer;