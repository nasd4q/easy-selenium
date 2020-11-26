export = Handle;
/**
 * Easily find an element or get selenium locator from cssSelector or xpath
 */
declare class Handle {
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
    /** **private**, use static method from________ */
    constructor(cssSelector: any, xpath: any);
    cssSelector: any;
    xpath: any;
    /**
     * Returns the html element matching, if any.
     *
     * Searches from the 'document' element and returns the first match.
     *
     * @returns {(Node|Element|HTMLElement)}
     */
    getElement(): (Node | Element | HTMLElement);
    getSeleniumLocator(): any;
}
