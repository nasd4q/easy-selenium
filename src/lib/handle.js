const { By } = require("selenium-webdriver");

/**
 * Easily find an element or get selenium locator from cssSelector or xpath
 */
class Handle {
    /** **private**, use static method from________ */
    constructor(cssSelector, xpath) {
        if (cssSelector) {
            this.cssSelector = cssSelector;
        }
        if (xpath) {
            this.xpath = xpath;
        }
    }

    /**
     * Returns the html element matching, if any. 
     * 
     * Searches from the 'document' element and returns the first match.
     * 
     * @returns {(Node|Element|HTMLElement)}
     */
    getElement() {
        if (this.cssSelector) {
            return document.querySelector(this.cssSelector);
        } else if (this.xpath) {
            let v = document.evaluate(this.xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            return v.snapshotItem(0);
        } else {
            throw new Error('No cssSelector nor xpath found to search element');
        }
    }

    getSeleniumLocator() {
        if (this.cssSelector) {
            return By.css(this.cssSelector);
        } else if (this.xpath) {
            return By.xpath(this.xpath);
        } else {
            throw new Error('No cssSelector nor xpath found to locate element');
        }
    }

    /**
     * 
     * @param {String} cssSelector 
     */
    static fromCssSelector(cssSelector) {
        return new Handle(cssSelector, null);
    }

    /**
     * 
     * @param {String} xpath 
     */
    static fromXpath(xpath) {
        return new Handle(null, xpath);
    }
}

module.exports = Handle;