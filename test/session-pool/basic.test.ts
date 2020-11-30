import { SELENIUM_3, CHROMEDRIVER, GECKODRIVER, REF_UDDS} from '00_selenium-resources';

import { SeleniumServer, SessionFactory, SessionPool, UddStore } from "../..";

const JAR =  SELENIUM_3;

const TEST_DATA_UDDS_DIR =  __dirname + '/_temp/test-udds';
const REF_UDD = REF_UDDS.one;
 
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