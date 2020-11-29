import * as path from 'path';
import { SeleniumServer, SessionFactory, SessionPool, UddStore } from "../..";

const root = path.dirname(path.dirname(__dirname));
const scalping2 = path.dirname(path.dirname(root));

const JAR =  path.dirname(__dirname) + '/_resources/selenium-server-standalone-3.141.59.jar';
const CHROMEDRIVER = path.dirname(__dirname) + '/_resources/chromedriver_86.0.4240.22';
const GECKODRIVER = path.dirname(__dirname) + '/_test/resources/geckodriver-v0.27.0';

const TEST_DATA_UDDS_DIR =  scalping2 + '/test-data/ig-sessions';
const REF_UDD = scalping2 + '/res/reference-ig-sessions/user-data-dirs/one';
 
describe("SessionPool", () => {
    it("initialize(), getOne(), giveBack(), terminate() - all seems fine", async() => {
        //creates a selenium server
        let server = new SeleniumServer();
        //a storing facility
        let store = new UddStore(TEST_DATA_UDDS_DIR, REF_UDD);
        //a factory
        let factory = new SessionFactory();
        //a pool
        let pool = new SessionPool(server, store, factory, 3, 3, async(s) => true);
        //initialization
        await pool.init(JAR, CHROMEDRIVER, GECKODRIVER, null);

        //Lets play
        let one = pool.getOne();

        await one.driver().get('https://www.npmjs.com/package/generic-pool');

        pool.giveBack(one);

        await new Promise(r => setTimeout(r, 1500));

        one = pool.getOne();
        let two = pool.getOne()

        await one.driver().get('https://www.tektutorialshub.com/typescript/typescript-number/#number-vs-number');
        await two.driver().get('https://github.com/babel/babel/issues/2243');

        pool.giveBack(one);

        await new Promise(r => setTimeout(r, 1500));

        pool.giveBack(two);

        await new Promise(r => setTimeout(r, 1500));

        await pool.terminate();
        return;
    });
});