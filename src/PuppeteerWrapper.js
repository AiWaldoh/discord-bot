const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

class PuppeteerWrapper {
    constructor(userDataDir = './browserSession') {
        this.userDataDir = userDataDir;
        this.browser = null;
        this.page = null;
    }

    async init() {
        // Initialize Puppeteer browser instance
        this.browser = await puppeteer.launch({ headless: true });
        this.page = (await this.browser.pages())[0];
    }

    async goto(url) {
        // Navigate to the specified URL
        if (!this.page) {
            throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        }
        await this.page.goto(url);
    }

    async close() {
        // Close the Puppeteer browser instance
        if (!this.browser) {
            throw new Error('Puppeteer browser not initialized. Did you forget to call init()?');
        }
        await this.browser.close();
    }

    async clickButton(selector) {
        // Click a button identified by the provided selector
        if (!this.page) {
            throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        }
        await this.page.click(selector);
    }

    async waitForElement(selector) {

        // // Wait for an element identified by the provided selector to appear
        // if (!this.page) {
        //     throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        // }
        try {
            await this.page.waitForSelector(selector);
        } catch (e) {
            console.log(e);
        }
    }

    async typeText(selector, text) {
        // Type text into an input element identified by the provided selector
        if (!this.page) {
            throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        }
        await this.page.type(selector, text);
    }

    async getElementText(selector) {
        // Get the text content of an element identified by the provided selector
        if (!this.page) {
            throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        }
        return await this.page.$eval(selector, element => element.textContent);
    }

    async getElementProperty(selector, property) {
        // Get a property of an element identified by the provided selector
        if (!this.page) {
            throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        }
        return await this.page.$eval(selector, (element, property) => element[property], property);
    }

    async screenshot(options) {
        // Take a screenshot of the current page
        if (!this.page) {
            throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        }
        await this.page.screenshot(options);
    }

    async setViewport(width, height) {
        // Set the viewport of the current page
        if (!this.page) {
            throw new Error('Puppeteer page not initialized. Did you forget to call init()?');
        }
        await this.page.setViewport({ width, height });
    }

    async fillForm(selectorMap) {
        const firstSelector = Object.keys(selectorMap)[0];
        console.log(firstSelector);
        await this.waitForElement(firstSelector);
        for (let [selector, value] of Object.entries(selectorMap)) {
            await this.page.type(selector, value);
        }
    }
}

module.exports = PuppeteerWrapper;
