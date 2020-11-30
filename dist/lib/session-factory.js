const webdriver = require("selenium-webdriver");
const Session = require("./session");
class SessionFactory {
    /**
     * @param { (session : Session) => Promise<Session> } [customize] prepare the session for specific tasks
     */
    constructor(customize) {
        if (customize) {
            this._customize = customize;
        }
    }
    /**
     *
     * @param {string} udd path to user data dir (absolute, no trailing slash)
     * @param {string} url url of selenium server
     * @returns {Promise<Session>}
     */
    async create(url, udd) {
        //Create capabilities and options obj
        var chromeCapabilities = webdriver.Capabilities.chrome();
        var chromeOptions = {
            'args': [
                '--user-data-dir=' + udd + '/',
                "--auto-open-console-for-tabs=" + udd + '/',
            ],
            'w3c': false,
        };
        chromeCapabilities.set('chromeOptions', chromeOptions);
        chromeCapabilities.set('browserName', 'chrome');
        //builds and returns the driver
        let driver = new webdriver.Builder()
            .forBrowser(webdriver.Browser.CHROME)
            .withCapabilities(chromeCapabilities)
            .usingServer(url)
            .build();
        let s = new Session((await driver.getSession()).getId(), udd, () => driver);
        let customized;
        try {
            customized = this.customize(s);
        }
        catch (err) {
            console.log(err);
        }
        return customized;
    }
    /**
     *
     * @params {Session} session
     * @returns {Promise<Session>}
     */
    customize(session) {
        if (this._customize) {
            return this._customize(session);
        }
        else {
            return Promise.resolve(session);
        }
    }
}
module.exports = SessionFactory;
