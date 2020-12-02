import { WebDriver, WebElement } from 'selenium-webdriver';
import { Handle } from './handle';
/**
 * Enhances selenium's Webdriver class : provides additional methods with
 * respect to certain particular tasks such as :
 * + trying repeatedly to wait and click on an element (`waitAndClick(...)`)
 * + trying repeatedly a task (`repeatWhile(...)`)
 * + loading a browserified js module for in-browser use (`loadModule(...)`)
 * + opening a new window (`newWindow()`)
 * + etc.
  */
export declare class EnhancedDriver extends WebDriver {
    /**
     * @param {WebDriver} driver the WebDriver instance to enhance
     *
     *
     * Note : Calls super, aka WebDriver's constructor.
     */
    constructor(driver: WebDriver);
    /**
     * Tries repeatedly to find element by handle using
     * `this.findElements(handle.getSeleniumLocator())`.
     * If anything is found, returns first result.
     *
     * Throws error if has not found anything after `trials` attempts.
     *
     * @param {Handle} handle
     * @param {number} timeout in ms between trials
     * @param {number} trials
     * @param {number} [pretimeout] in ms to wait before anything else
     *
     * @returns {Promise<WebElement>}
     */
    waitAndFind(handle: Handle, timeout: number, trials: number, pretimeout: number): Promise<WebElement>;
    /**
     * Tries repeatedly to find element by text using `this.executeScript()`,
     * and `document.evaluate()` inside browser to match any element
     * whose `text()` contains passed `text`.
     * If anything is found, returns the first (among innermost) results.
     *
     * Throws error if has not found anything after `trials` attempts.
     *
     * @param {Handle} handle
     * @param {number} timeout in ms between trials
     * @param {number} trials
     *
     * @returns {Promise<WebElement>}
     */
    waitAndFindByText(text: string, timeout: number, trials: number): Promise<WebElement>;
    /**
     * Tries `element.click()` repeatedly while error are thrown. If no success
     * after `trials` attempts, then rethrow last thrown error.
     *
     * @param {WebElement} element
     * @param {number} [timeout] in ms to wait between trials. Defaults to 30 ms.
     * @param {number} [trials] Defaults to 5.
     *
     * Note : 0 value for timeout or trials should be changed to default values.
     */
    waitAndClick(element: WebElement, timeout: number, trials: number): Promise<void>;
    /**
     * Evaluates condition, then attempts task, until condition resolves to
     * `true`. It no success after `trials` attempts, throws an error.
     *
     * @param {()=>Promise<any>} task
     * @param {()=>Promise<boolean>} condition
     * @param {number} timeout in ms, to wait between task() and subsequent condition() calls.
     * @param {number} trials max number of attempts
     * @param {number} pretimeout ms to wait before anything else
     *
     * @returns {Promise<void>} resolves in case of success
     */
    repeatWhile(task: () => Promise<any>, condition: () => Promise<boolean>, timeout: number, trials: number, pretimeout: number): Promise<void>;
    /**
     * Only loads something if name not already defined inside window object
     *
     * Will ignore selenium-webdriver module
     *
     * @param {string} path
     */
    loadModule(path: string, name: string): Promise<void>;
    /**
     * Opens a new browser window to current url. Does not switch to it.
     *
     * @returns {Promise<void>} Resolves once done.
     *
     * Note : uses an in-browser js script.
     */
    newWindow(): Promise<void>;
    /**
     * @returns {Promise<void>}
     */
    switchToFirstWindow(): Promise<void>;
    /**
     * @returns {Promise<void>}
     */
    switchToLastWindow(): Promise<void>;
    /**
     * Calls `this.executeScript(script, args)` _after_ having called
     * `this.loadModule(path, name)`.
     *
     * Note : Will ignore selenium-webdriver module
     *
     * @param {Function | string} script
     * @param {any} args
     * @param {string} path
     * @param {string} name
     */
    executeScriptWithModule(script: Function | string, args: any, path: string, name: any, string: any): Promise<unknown>;
}
