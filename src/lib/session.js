const { WebDriver } = require("selenium-webdriver");

class Session {
    /**
     * 
     * @param {string} id 
     * @param {string} udd the full path to user-data-directory, no trailing slash
     * @param {() => WebDriver} getDriver 
     */
    constructor(id, udd, getDriver) {
        this.id = id;
        /** @type {string} udd the full path to user-data-directory, no trailing slash */
        this.udd = udd;
        /** @type {() => WebDriver} */
        this._getDriver = getDriver;
    }

    driver() {
        if (!this._driver) {
            this._driver = this._getDriver();
        }
        return this._driver;
    }
}

module.exports = Session;