const WebScraper = require('./WebScraper');
const OpenAIChatBot = require('./OpenAIChatBot');

const prompt = `The following data is html hierarchy from a website article. Each data element contains it's first 4 words. Return xpath selectors for paragraph and heading tags where the 4 words are relevant to summarizing an article from a website. Focus on selectors for paragraphs.
###EXAMPLE###
[{"tag":"main","id":"jump-content","class":"site-content","text":null,"children":[{"tag":"article","id":"","class":"uni-article-wrapper","text":null,"children":[{"tag":"section","id":"","class":"article-hero","text":null,"children":[{"tag":"div","id":"","class":"article-hero__container","text":null,"children":[{"tag":"h1","id":"","class":"article-hero__h1","text":"Being bold on AI","children":[]}]}]}]
###RESPONSE###
{
  "xpath": [
    "//div[@class='article-hero__container']//h1",
  ]
}`;

const promptCTF = `The following data is html hierarchy with elements and the first 4 words of text they contain. Return xpath selectors for all the visible text using descendants syntax (//)
###EXAMPLE###
[{"tag":"main","id":"jump-content","class":"site-content","text":null,"children":[{"tag":"article","id":"","class":"uni-article-wrapper","text":null,"children":[{"tag":"section","id":"","class":"article-hero","text":null,"children":[{"tag":"div","id":"","class":"article-hero__container","text":null,"children":[{"tag":"h1","id":"","class":"article-hero__h1","text":"Being bold on AI","children":[]}]}]}]
###RESPONSE###
{
  "xpath": [
    "//div[@class='article-hero__container']//h1",
  ]
}`;

const promptGoogleSearch = `The following data is html hierarchy with elements and words from Google Search Results. Consider those words and return xpath selectors to query title, full url, date and description. the full url is always an anchor tag with attribute href. 
###EXAMPLE###
[{"tag":"main","id":"jump-content","class":"site-content","text":null,"children":[{"tag":"article","id":"","class":"uni-article-wrapper","text":null,"children":[{"tag":"section","id":"","class":"article-hero","text":null,"children":[{"tag":"div","id":"","class":"article-hero__container","text":null,"children":[{"tag":"h1","id":"","class":"article-hero__h1","text":"Being bold on AI","children":[]}]}]}]
###RESPONSE###
{
  "xpath": [
    "//div[@class='article-hero__container']//h1",
  ]
}`;
class RunApp {
  constructor(messageEmitter, model = 'gpt-4') {
    this.scraper = new WebScraper();
    this.chatBot = new OpenAIChatBot(model);
    this.messageEmitter = messageEmitter;
  }

  async scrapeWebsite(url) {
    await this.scraper.init();
    console.log(`Navigating to url: ${url}...`);
    await this.scraper.goToPage(url);

    return await this.scraper.scrapeForImportantStuff();
  }
  // async scrapeGoogleSearch(url) {
  //   await this.scraper.init();
  //   console.log(`Navigating to url: ${url}...`);
  //   await this.scraper.goToPage(url);

  //   return await this.scraper.scrapeForGoogleResults();
  // }
  async getImportantData(prompt, data) {
    this.chatBot.send_message(prompt);
    this.chatBot.send_message(JSON.stringify(data));

    return JSON.parse(await this.chatBot.get_response(0));
  }

  async parseData(url, xpath) {
    console.log(`Parsing important data using xpath...`);
    return await this.scraper.getTextFromXPath(url, xpath);
  }

  async getSummary(role, message, text, temperature) {
    this.chatBot.clear_messages();
    this.chatBot.set_role(role);
    this.chatBot.send_message(message);
    this.chatBot.send_message(text);

    return await this.chatBot.get_response(temperature);
  }

  async closeScraper() {
    this.scraper.close();
  }

  async summarize(url) {
    const data = await this.scrapeWebsite(url);
    console.log(data);
    const jsonXpaths = await this.getImportantData(prompt, data);
    console.log(jsonXpaths);
    const websiteVisibleText = await this.parseData(url, jsonXpaths.xpath);
    console.log(websiteVisibleText);
    const summary = await this.getSummary("You are a summarization AI.", "Comprehensively summarize the following text so it's maximum 3000 tokens size for an AI to understand:", websiteVisibleText, 0.5);
    console.log(summary);
    await this.closeScraper();

    return summary;
  }

  async summarizeGoogle(url) {
    await this.scraper.init();
    console.log(`scraping ${url}...`);
    // const data = await this.scrapeGoogleSearch(url);
    // console.log(`data from ${data}...`);
    // console.log(`getting xpaths from ${url}...`);
    // const jsonXpaths = await this.getImportantData(promptGoogleSearch, data);
    // console.log(jsonXpaths);
    const jsonXpaths = {
      "xpath": [
        "//div[@class='yuRUbf']/a[@href]",
        "//div[contains(@class, 'VwiC3b')]//span/span[1]",
        "//div[contains(@class, 'VwiC3b')]//span/span[2]",
        "//div[contains(@class, 'yuRUbf')]//h3"
      ]
    }

    const relevantXpathSiteData = await this.parseData(url, jsonXpaths.xpath);
    console.log(`website visible text:`);
    console.log(relevantXpathSiteData);
    console.log(`getting google results summary`);
    this.chatBot.set_model('gpt-3.5-turbo');
    const summary = await this.getSummary("You are a Google Search API.", "You will return the title, link, date and short description for these google results", relevantXpathSiteData, 0);
    console.log(summary);
    await this.closeScraper();

    return summary;
  }

  async summarizeCTF(url) {
    console.log(`scraping ${url}...`);
    const data = await this.scrapeWebsite(url);
    console.log(`data from ${data}...`);
    console.log(`getting xpaths from ${url}...`);
    const jsonXpaths = await this.getImportantData(promptCTF, data);
    console.log(`xpath data:`);
    console.log(jsonXpaths);
    const websiteVisibleText = await this.parseData(url, jsonXpaths.xpath);
    console.log(`website visible text:`);
    console.log(websiteVisibleText);
    console.log(`getting summary`);
    const summary = await this.getSummary("You are an ethical hacker doing a CTF. You will return important information such as versions, software name, if there's a form, etc. Mention known vulnerabilities and finally give a brief summary of the website's technologies.", "Summarize the information relevant to an ethical hacker doing a pentest from this website", websiteVisibleText, 0);
    console.log(summary);
    await this.closeScraper();

    return summary;
  }
}

module.exports = RunApp;

