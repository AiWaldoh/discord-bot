const WebScraper = require('./WebScraper');
const OpenAIChatBot = require('./OpenAIChatBot');

const prompt = `The following data is html hierarchy with 4 words of text for elements that contain text. Return me xpath selectors for paragraph and heading tags using descendants syntax with //.
###EXAMPLE###
[{"tag":"main","id":"jump-content","class":"site-content","text":null,"children":[{"tag":"article","id":"","class":"uni-article-wrapper","text":null,"children":[{"tag":"section","id":"","class":"article-hero","text":null,"children":[{"tag":"div","id":"","class":"article-hero__container","text":null,"children":[{"tag":"h1","id":"","class":"article-hero__h1","text":"Being bold on AI","children":[]}]}]}]
###RESPONSE###
{
  "xpath": [
    "//div[@class='article-hero__container']//h1",
  ]
}`;

let model = "gpt-4";

class RunApp {
  constructor(messageEmitter) {
    this.scraper = new WebScraper();
    this.chatBot = new OpenAIChatBot(model);
    this.messageEmitter = messageEmitter;
  }

  async summarize(url, wendahAI) {

    await this.scraper.init();

    wendahAI.send_message(`generate a funny loading message saying you're opening up your browser to load the domain ${url}`);
    let loadingMsg = await wendahAI.get_response(1);
    this.messageEmitter.emit('response', loadingMsg);


    console.log(`Navigating to url: ${url}...`);
    //await this.getFunnyLoadingMessageForStatus(`Initializing application...`);
    await this.scraper.goToPage(url);

    wendahAI.send_message("generate a funny loading message explaining you are currently scraping the page");
    loadingMsg = await wendahAI.get_response(1);
    this.messageEmitter.emit('response', loadingMsg);

    const data = await this.scraper.scrapeForImportantStuff();

    this.chatBot.send_message(prompt);
    this.chatBot.send_message(JSON.stringify(data));
    const jsonXpaths = JSON.parse(await this.chatBot.get_response(0));


    console.log(`Parsing important data using xpath...`);
    const text = await this.scraper.getTextFromXPath(url, jsonXpaths.xpath);
    console.log(text);

    wendahAI.send_message(`generate a funny 10 word loading message saying you're summarizing the parsed data for ${url}`);

    //wendahAI.send_message(`generate a funny 20 word loading message for summarizing data a la Sherlock Holmes for ${url}.`);
    loadingMsg = await wendahAI.get_response(1);
    this.messageEmitter.emit('response', loadingMsg);


    this.chatBot.clear_messages();
    this.chatBot.set_role("You are a summarization AI.")
    this.chatBot.send_message("comprehensively summarize the following text so it's maximum 3000 tokens size for an AI to understand:");
    // console.log(text);
    this.chatBot.send_message(text);
    const summary = await this.chatBot.get_response(0.5);
    this.scraper.close();

    wendahAI.send_message(`###IMPORTANT### scraped data from ${url}."###DATA### " + ${summary}`);

    loadingMsg = await wendahAI.get_response(0.8);
    return summary;
  }

}

module.exports = RunApp;


