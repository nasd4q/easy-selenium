const SeleniumServer = require("../../lib/selenium-server");
const SessionFactory = require("../../lib/session-factory");
const SessionPool = require("../../lib/session-pool");
const UddStore = require("../../lib/udd-store");
const { goToPlatform } = require('ig-related');




const SELENIUM_JAR = '/Users/apple/dev/projects/scalping2/res/selenium-server-standalone-3.141.59.jar';
const CHROMEDRIVER = '/Users/apple/dev/projects/scalping2/res/chromedriver_86.0.4240.22';
const GECKODRIVER = '/Users/apple/dev/projects/scalping2/res/geckodriver-v0.27.0';
const SELENIUM_PORT = 4567;
const TEST_DATA_UDDS_DIR = '/Users/apple/dev/projects/scalping2/test-data/ig-sessions';
const REF_UDD = '/Users/apple/dev/projects/scalping2/res/reference-ig-sessions/user-data-dirs/one';
describe("Session factory", () => {
    test("create() method returns a well customized version", async(done) => {
        //start a selenium server
        let server = new SeleniumServer(SELENIUM_JAR, CHROMEDRIVER, GECKODRIVER, SELENIUM_PORT, null);
        //a storing facility
        let store = new UddStore(TEST_DATA_UDDS_DIR, REF_UDD);
        //a factory
        let customize = async(s) => goToPlatform(s.driver()).then(() => s);
        let factory = new SessionFactory(customize);

        //a pool
        let pool = new SessionPool(server, store, factory, 2, 6, async(s) => true);
        await pool.init();

        //Lets play

        let one = pool.getOne();

        await one.driver().get('https://www.npmjs.com/package/generic-pool');

        pool.release(one);

        await new Promise(r => setTimeout(r, 1500));

        one = pool.getOne();
        let two = pool.getOne()

        await one.driver().get('https://www.npmjs.com/package/generic-pool');
        await two.driver().get('https://github.com/babel/babel/issues/2243');


        pool.release(one);

        await new Promise(r => setTimeout(r, 1500));

        pool.release(two);

        await new Promise(r => setTimeout(r, 1500));

        //await server.killAll();

        done();
    }, 5 * 60 * 1000);
});