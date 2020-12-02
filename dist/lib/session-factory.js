"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionFactory = void 0;
const webdriver = __importStar(require("selenium-webdriver"));
const session_1 = require("./session");
/**
 * Exposes instance method `create(...)` to generate new selenium browsing sessions
 */
class SessionFactory {
    /**
     * @param customize Prepares the session for specific tasks. Will be called
     * right before returning freshly created session by `this.create(...)` method
     * @param headless Defaults to `false`
     */
    constructor(customize, headless) {
        if (customize) {
            this._customize = customize;
        }
        if (headless === null || headless === undefined) {
            headless = false;
        }
        this.headless = headless;
    }
    /**
     * @param udd path to user data dir (absolute, no trailing slash)
     * @param url url of selenium server
     */
    async create(url, udd) {
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
        let s = new session_1.Session((await driver.getSession()).getId(), udd, () => driver);
        let customized;
        try {
            customized = this.customize(s);
        }
        catch (err) {
            console.log(err);
        }
        return customized;
    }
    customize(session) {
        if (this._customize) {
            return this._customize(session);
        }
        else {
            return Promise.resolve(session);
        }
    }
}
exports.SessionFactory = SessionFactory;
