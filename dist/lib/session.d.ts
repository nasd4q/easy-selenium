export = Session;
declare class Session {
    /**
     *
     * @param {string} id
     * @param {string} udd the full path to user-data-directory, no trailing slash
     * @param {() => WebDriver} getDriver
     */
    constructor(id: string, udd: string, getDriver: () => WebDriver);
    id: string;
    /** @type {string} udd the full path to user-data-directory, no trailing slash */
    udd: string;
    /** @type {() => WebDriver} */
    _getDriver: () => WebDriver;
    driver(): WebDriver;
    _driver: WebDriver;
}
import { WebDriver } from "selenium-webdriver";
