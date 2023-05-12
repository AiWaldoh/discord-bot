const puppeteer = require('puppeteer');

class PuppeteerWrapper {
  constructor(url) {
    this.url = url;
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.goto(this.url);
  }

  async close() {
    await this.browser.close();
  }
  async goto(url) {
    await this.page.goto(url);
  }
  async fillForm(selectorMap) {
    await this.page.waitForSelector('#uid_5');
    for (let [selector, value] of Object.entries(selectorMap)) {
      await this.page.type(selector, value);
    }
  }

  async clickButton(selector) {
    await this.page.click(selector);
  }

  async screenshot(path) {
    await this.page.screenshot({ path });
  }
}

module.exports = PuppeteerWrapper