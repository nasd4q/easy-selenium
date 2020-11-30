import { By } from "selenium-webdriver";
/**
 * Easily find an element or get selenium locator from cssSelector or xpath
 */
export declare class Handle {
    cssSelector: string;
    xpath: string;
    /** **private**, use static method from________ */
    private constructor();
    /**
     * Returns the html element matching, if any.
     *
     * Searches from the 'document' element and returns the first match.
     */
    getElement(): Node | Element | HTMLElement;
    getSeleniumLocator(): By;
    /**
     *
     * @param {String} cssSelector
     */
    static fromCssSelector(cssSelector: string): Handle;
    /**
     *
     * @param {String} xpath
     */
    static fromXpath(xpath: string): Handle;
}
