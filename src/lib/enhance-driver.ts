import { WebDriver, WebElement } from 'selenium-webdriver';
import { getModuleLoadingScript } from 'browser-loader';
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
export class EnhancedDriver extends WebDriver {

    /**
     * @param {WebDriver} driver the WebDriver instance to enhance
     * 
     * 
     * Note : Calls super, aka WebDriver's constructor.
     */
    constructor(driver: WebDriver) {
        super(driver.getSession(), driver.getExecutor());
    }

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
    async waitAndFind(handle: Handle, timeout: number, trials: number,
        pretimeout: number): Promise<WebElement> {
        if (typeof pretimeout === 'number' && pretimeout > 0) {
            await new Promise(r => setTimeout(r, pretimeout));
        }

        let found = await this.findElements(handle.getSeleniumLocator());

        while (found.length === 0 && --trials > 0) {
            await new Promise(r => setTimeout(r, timeout));
            found = await this.findElements(handle.getSeleniumLocator());
        }

        if (found.length > 0) {
            return found[0];
        } else {
            throw new Error('Cound not find any element matching handle :' + JSON.stringify(handle));
        }
    }

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
    async waitAndFindByText(text: string, timeout: number, trials: number)
        : Promise<WebElement> {
        let found: WebElement;
        do {
            await new Promise(r => setTimeout(r, timeout))
            found = await this.executeScript(
                function innermostWithText(text) {
                    let v = document.evaluate(
                        `//*[contains(text(), "` + text + `") and not (./*[contains(text(), "` + text + `")])]`,
                        document,
                        null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                        null
                    )
                    if (v.snapshotLength > 0)
                        return v.snapshotItem(0);
                    return null;
                }, text);
        }
        while (!found && --trials > 0);

        if (found) {
            return found;
        } else {
            throw new Error('Cound not find any element containing text :' + text);
        }
    }

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
    async waitAndClick(element: WebElement, timeout: number, trials: number)
        : Promise<void> {
        let retry, lastErr;
        trials = trials || 5;
        timeout = timeout || 30;
        do {
            try {
                await new Promise(r => setTimeout(r, timeout));
                await element.click();
                retry = false;
            } catch (err) {
                retry = true;
                lastErr = err;
            }
        } while (retry && --trials > 0);
        if (trials === 0) {
            throw lastErr;
        }
    }

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
    async repeatWhile(task: ()=>Promise<any>, condition: ()=>Promise<boolean>, 
    timeout: number, trials: number, pretimeout: number): Promise<void> {
        await new Promise(r => setTimeout(r, pretimeout));
        while (!(await condition()) && trials-- > 0) {
            await task();
            await new Promise(r => setTimeout(r, timeout));
        }
        if (trials < 0) {
            throw new Error('task not achieved');
        }
        return;
    }


    /**
     * Only loads something if name not already defined inside window object
     * 
     * Will ignore selenium-webdriver module
     * 
     * @param {string} path 
     */
    async loadModule(path: string, name: string): Promise<void> {
        if (await this.executeScript(function (name) {
            return !window[name];
        }, name)) {

            let s = await getModuleLoadingScript(path, name, ["selenium-webdriver"]);
            await this.executeScript(s + '\nconsole.log("Just loaded ' + name + '");')
        }
    }

    /**
     * Opens a new browser window to current url. Does not switch to it.
     * 
     * @returns {Promise<void>} Resolves once done.  
     * 
     * Note : uses an in-browser js script.
     */
    newWindow(): Promise<void> {
        return this.executeScript(function () {
            window.open(document.URL, '_blank', 'location=yes,height=780,width=1280,scrollbars=yes,status=yes');
            return;
        });
    }

    /**
     * @returns {Promise<void>}
     */
    async switchToFirstWindow(): Promise<void> {
        return this.switchTo().window(await this.getAllWindowHandles().then(ws => ws[0]));
    }

    /**
     * @returns {Promise<void>}
     */
    async switchToLastWindow(): Promise<void> {
        return this.switchTo().window(await this.getAllWindowHandles().then(ws => ws[ws.length - 1]));
    }

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
    async executeScriptWithModule(script: Function | string, 
        args: any, path: string, name, string): Promise<unknown> {
        await this.loadModule(path, name);
        return this.executeScript(script, args);
    }
}