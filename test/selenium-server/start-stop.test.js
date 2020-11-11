const SeleniumServer = require("../../lib/selenium-server");
const fs = require('fs');

const SELENIUM_JAR = '/Users/apple/dev/projects/scalping2/res/selenium-server-standalone-3.141.59.jar';
const CHROMEDRIVER = '/Users/apple/dev/projects/scalping2/res/chromedriver_86.0.4240.22';
const GECKODRIVER = '/Users/apple/dev/projects/scalping2/res/geckodriver-v0.27.0';
const SELENIUM_PORT = 4567;

describe('selenium-server', () => {
    test('starts and stops', async(done) => {
        let selenium = new SeleniumServer(SELENIUM_JAR, CHROMEDRIVER, GECKODRIVER, SELENIUM_PORT, null);
        let started = await selenium.start();

        await new Promise(r => setInterval(r, 1000));

        if (started)
            await selenium.stop();

        done();
    }, 5 * 60 * 1000);
});