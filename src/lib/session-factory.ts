import * as webdriver from 'selenium-webdriver';
import { Session } from './session';

/**
 * Exposes instance method `create(...)` to generate new selenium browsing sessions
 */
export class SessionFactory {
    private _customize: (session : Session) => Promise<Session>;
    headless: boolean;
    /**
     * @param customize Prepares the session for specific tasks. Will be called
     * right before returning freshly created session by `this.create(...)` method
     * @param headless Defaults to `false`
     */
    constructor(customize: (session : Session) => Promise<Session>, headless?: boolean) {
            if (customize) {
                this._customize = customize;
            }
            if (headless === null || headless === undefined) {
                headless = false;
            } 
            this.headless = headless
        }
        /**
         * @param udd path to user data dir (absolute, no trailing slash)
         * @param url url of selenium server
         */
    public async create(url: string, udd: string): Promise<Session> {
        //Create capabilities and options obj
        var chromeCapabilities = webdriver.Capabilities.chrome();
        var chromeOptions = {
            'args': [
                '--user-data-dir=' + udd + '/',
                "--auto-open-console-for-tabs=" + udd + '/'
            ],
            'w3c': false,

        };
        if (this.headless) {
            chromeOptions.args.push(...['--headless', '--disable-gpu']);
        }
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
        } catch (err) {
            console.log(err);
        }
        return customized;
    }

    customize(session: Session): Promise<Session> {
        if (this._customize) {
            return this._customize(session);
        } else {
            return Promise.resolve(session);
        }
    }
}