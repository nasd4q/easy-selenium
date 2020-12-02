"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
/**
 * A container for an id (string), a udd (string) and access to a driver
 * (selenium Webdriver).
 *
 * Modelizes a running selenium browsing session.
 */
class Session {
    /**
     * @param {string} id
     * @param {string} udd the full path to user-data-directory, no trailing slash
     * @param {() => WebDriver} getDriver
     */
    constructor(id, udd, getDriver) {
        this.id = id;
        this.udd = udd.endsWith('/') ? udd.slice(0, -1) : udd;
        this._getDriver = getDriver;
    }
    driver() {
        if (!this._driver && this._getDriver) {
            this._driver = this._getDriver();
            this._getDriver = null;
        }
        return this._driver;
    }
    setDriver(driver) {
        if (!driver) {
            throw new Error('Refusing to set internal driver to falsy value.');
        }
        this._driver = driver;
    }
}
exports.Session = Session;
