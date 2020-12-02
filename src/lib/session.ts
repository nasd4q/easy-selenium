import * as webdriver from 'selenium-webdriver';

/**
 * A container for an id (string), a udd (string) and access to a driver 
 * (selenium Webdriver).
 * 
 * Modelizes a running selenium browsing session.
 */
export class Session {
    id: string;
    /** The full path to user-data-directory, no trailing slash */
    udd: string;
    private _getDriver: () => webdriver.WebDriver;
    private _driver: webdriver.WebDriver;

    /**
     * @param {string} id 
     * @param {string} udd the full path to user-data-directory, no trailing slash
     * @param {() => WebDriver} getDriver 
     */
    constructor(id: string, udd: string, getDriver: () => webdriver.WebDriver) {
        this.id = id;
        this.udd = udd.endsWith('/') ? udd.slice(0,-1) : udd;
        this._getDriver = getDriver;
    }

    driver(): webdriver.WebDriver {
        if (!this._driver && this._getDriver) {
            this._driver = this._getDriver();
            this._getDriver = null;
        }
        return this._driver;
    }

    setDriver(driver: webdriver.WebDriver): void {
        if (!driver) {
            throw new Error('Refusing to set internal driver to falsy value.');
        }
        this._driver = driver;
    }
}