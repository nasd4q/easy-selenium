const SeleniumServer = require("../../lib/selenium-server");
const fs = require('fs');


const SELENIUM_JAR = '/Users/apple/dev/projects/scalping2/res/selenium-server-standalone-3.141.59.jar';
const CHROMEDRIVER = '/Users/apple/dev/projects/scalping2/res/chromedriver_86.0.4240.22';
const GECKODRIVER = '/Users/apple/dev/projects/scalping2/res/geckodriver-v0.27.0';
const SELENIUM_PORT = 4567;
describe('selenium-server', () => {
    test('_writeLaunchScriptToFile', async(done) => {
        let selenium = new SeleniumServer(SELENIUM_JAR, CHROMEDRIVER, GECKODRIVER, SELENIUM_PORT, null);
        await selenium._writeLaunchScriptToFile(__dirname + '/tmp_script_4567');
        let buffer = await new Promise(
            res => fs.readFile(__dirname + '/tmp_script_4567', (err, data) => res(data)));
        //todo rewrite
        //expect(buffer.toString()).toBe("#!/bin/bash" + "\n\n" + "java -Dwebdriver.gecko.driver=/Users/apple/dev/projects/scalping2/resources/geckodriver-v0.27.0 -Dwebdriver.chrome.driver=/Users/apple/dev/projects/scalping2/resources/chromedriver_86.0.4240.22 -jar /Users/apple/dev/projects/scalping2/resources/selenium-server-standalone-3.141.59.jar -port 4567 -sessionTimeout 2347895");
        done();
    }, 1 * 60 * 1000);
});