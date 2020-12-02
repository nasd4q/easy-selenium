import * as webdriver from 'selenium-webdriver';
/**
 * A container for an id (string), a udd (string) and access to a driver
 * (selenium Webdriver).
 *
 * Modelizes a running selenium browsing session.
 */
export declare class Session {
    id: string;
    /** The full path to user-data-directory, no trailing slash */
    udd: string;
    private _getDriver;
    private _driver;
    /**
     * @param {string} id
     * @param {string} udd the full path to user-data-directory, no trailing slash
     * @param {() => WebDriver} getDriver
     */
    constructor(id: string, udd: string, getDriver: () => webdriver.WebDriver);
    driver(): webdriver.WebDriver;
    setDriver(driver: webdriver.WebDriver): void;
}
