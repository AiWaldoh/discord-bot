const puppeteer = require('puppeteer-extra')
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

class WebScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init() {
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();
    }

    async goToPage(url) {
        await this.page.goto(url, { waitUntil: 'networkidle0' });
    }

    async scrapeForImportantStuff() {
        try {
            return await this.page.evaluate(() => {
                const isVisible = (element) => {
                    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
                };

                const extractTextFromChild = (childNode) => {

                    // Only allow p, span, h1, h2, h3, h4, h5, h6 and other tags that contain text.
                    const allowedTags = ['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'b', 'i', 'big', 'cite', 'details', 'summary', 'caption', 'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'form', 'input', 'label', 'legend', 'option', 'output', 'select', 'textarea'];
                    if (!allowedTags.includes(childNode.tagName.toLowerCase())) {
                        return null;
                    }

                    if (childNode.children.length === 0) {  // Limit text processing to leaf nodes
                        let textArray = childNode.innerText ? childNode.innerText.trim().split(' ') : [];
                        return textArray.length >= 4 ? textArray.slice(0, 4).join(' ') : null;
                    }
                    return null;
                };

                const getChildren = (node) => {
                    return Array.from(node.children).map(childNode => {
                        let text = extractTextFromChild(childNode);

                        return ({
                            tag: childNode.tagName.toLowerCase(),
                            id: childNode.id,
                            class: childNode.className,
                            text: text !== null && isVisible(childNode) ? text : null,
                            children: getChildren(childNode)
                        });
                    }).filter(child => child.text !== null || (Array.isArray(child.children) && child.children.length > 0));
                }

                return getChildren(document.body);
            });
        } catch (error) {
            console.error(error);
            throw error; // propagate the error
        }
    }

    async getTextFromXPath(url, xpaths) {
        await this.page.goto(url, { waitUntil: 'networkidle0' });
        const results = [];
        for (const xpath of xpaths) {
            const elements = await this.page.$x(xpath);
            for (const element of elements) {
                const tagName = await this.page.evaluate((el) => el.tagName, element);
                let value;
                if (tagName === 'A') {
                    value = await this.page.evaluate((el) => el.getAttribute('href'), element);
                } else {
                    value = await this.page.evaluate((el) => el.textContent, element);
                }
                results.push({ xpath, value });
            }
        }

        // Sort the results based on the original order of the XPath expressions
        results.sort((a, b) => {
            const indexA = xpaths.indexOf(a.xpath);
            const indexB = xpaths.indexOf(b.xpath);
            return indexA - indexB;
        });

        // Extract the values in the desired order
        const values = results.map((result) => result.value);

        return values.join(' '); // join the values into a single string with spaces in between
    }


    async getXpathValue(url, xpaths) {
        await this.page.goto(url, { waitUntil: 'networkidle0' });
        const values = [];
        for (const xpath of xpaths) {
            const elements = await this.page.$x(xpath);
            for (const element of elements) {
                const tagName = await this.page.evaluate((el) => el.tagName, element);
                if (tagName === 'A') {
                    const href = await this.page.evaluate((el) => el.getAttribute('href'), element);
                    values.push(href);
                } else {
                    const text = await this.page.evaluate((el) => el.textContent, element);
                    values.push(text);
                }
            }
        }

        return values.join(' '); // join the values into a single string with spaces in between
    }


    async close() {
        await this.browser.close();
    }

}

module.exports = WebScraper;

