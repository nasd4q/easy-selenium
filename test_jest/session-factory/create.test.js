const SeleniumServer = require("../../lib/selenium-server");
const SessionFactory = require("../../lib/session-factory");
const UddStore = require("../../lib/udd-store");

describe("Session factory", () => {
    it("create() method returns a well customized version", async() => {
        let server = new SeleniumServer(
            '/Users/apple/dev/projects/scalping2/res/selenium-server-standalone-3.141.59.jar',
            '/Users/apple/dev/projects/scalping2/res/chromedriver_86.0.4240.22',
            '/Users/apple/dev/projects/scalping2/res/geckodriver-v0.27.0',
            4567,
            null);
        let startedP = server.start();

        let store = new UddStore(
            '/Users/apple/dev/projects/scalping2/test-data/ig-sessions',
            '/Users/apple/dev/projects/scalping2/res/reference-ig-sessions/user-data-dirs/one'
        );

        let customize = x => x;

        let factory = new SessionFactory(customize);

        await startedP;

        let s = await factory.create(server.url, await store.create());


        console.dir(s);
        console.dir(s.driver());


        await s.driver().quit();

        return;
    }, 5 * 60 * 1000);
});