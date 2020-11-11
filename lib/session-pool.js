const SeleniumServer = require("./selenium-server");
const Session = require("./session");
const SessionFactory = require("./session-factory");
const UddStore = require("./udd-store");

/**
 * Manages sessions associated with a SeleniuServer and a UddStorage.
 */
class SessionPool {
    /**
     * private
     * 
     * @param {SeleniumServer} server 
     * @param {UddStore} store 
     * @param {SessionFactory} factory 
     * @param {number} min the min number of available ready sessions to have 
     * @param {number} max the max number of sessions allowed
     * @param {(session: Session) => Promise<boolean> } check a function that asserts if a session is deemed 
     * acceptable and can be made available or not
     */
    constructor(server, store, factory, min, max, check) {
        this.server = server;
        this.store = store;
        this.factory = factory;
        this.min = min;
        this.max = max;
        /** @type {(Session) => Promise<boolean> } asserts if a session is deemed acceptable and 
         * can be made available or not */
        this.check = check;
        /** @type {Session[]} only checked sessions*/
        this.sessions = [];
        /** @type {Session[]} */
        this.returnedSessions = [];
        this._onLoanCount = 0;
        this.__ensuringMin = false;
    }

    /**
     * Gets the pool ready with at least `this.min` sessions in place
     */
    async init() {
        await this.server.start().then(ready => {
            if (!ready) {
                throw new Error("Couldn't start the selenium server.");
            }
        });
        //TODO delete this reuse of existing session if not for testing...
        await this.server.list().then(sessions => Promise.all(sessions.map(async(s) => {
            if (await this.check(s)) {
                this.sessions.push(s);
            } else {
                await s.driver().quit();
            }
        })));

        await this._ensureMin();
    }

    /**
     * Should return an available session if possible, 
     * TODO or throw an error / or put on queue ?
     * @returns { Session }
     */
    getOne() {
        if (!this.__ensuringMin) {
            this.__ensuringMin = true;
            setImmediate(() => this._ensureMin());
        }
        this._onLoanCount++;
        return this.sessions.shift();
    }

    release(session) {
        this.returnedSessions.push(session);
        this._onLoanCount--;
        if (!this.__ensuringMin) {
            this.__ensuringMin = true;
            setImmediate(() => this._ensureMin());
        }
    }

    /**
     * private
     */
    async _ensureMin() {

        //1.Check all returned sessions and remove those that do not pass
        /** @type {Session[]} */
        let deadSessions = [];
        //drain returned_sessions into being worked on
        /** @type {Session[]} */
        let beingWorkedOnSessions = [];
        beingWorkedOnSessions.push(...this.returnedSessions.splice(0, this.returnedSessions.length));
        //sort into dead or leave those that pass the check
        await Promise.all(beingWorkedOnSessions.map(async(s, i) => {
            if (!(await this.check(s))) {
                deadSessions.push(...beingWorkedOnSessions.splice(i, 1));
            }
        }));
        //schedule deletion of unfit sessions
        let killingPromise = this.server.kill(deadSessions);
        //2. recycle checked sessions
        this.sessions.push(...beingWorkedOnSessions);

        //ensure mininum
        let neededCount = this.min > this.sessions.length ? this.min - this.sessions.length : 0;
        let existing = this.sessions.length + this.returnedSessions.length + this._onLoanCount;
        let makeCount = 0
        for (; makeCount + existing < this.max && makeCount < neededCount; makeCount++);

        //todo construct and customize makeCount session
        //list sessions alive and existing udds to reuse existing udds with no session live
        let alivesP = this.server.list();
        let uddsP = this.store.list();
        let alives = await alivesP;
        let found = (await uddsP).filter(folder =>
            alives.every(ses =>
                UddStore._deleteTrailingSlash(ses.udd) !==
                UddStore._deleteTrailingSlash(folder))
        );
        let promises = found.map(async(folder) => {
            if (makeCount-- > 0) {
                let s = await this.factory.create(this.server.url, folder);
                if (await this.check(s)) {
                    this.sessions.push(s)
                } else {
                    throw new Error("Factory's output session not checking!");
                }
            }
        });
        while (makeCount-- > 0) {
            promises.push(
                this.store.create()
                .then(async(folder) => {
                    let s = await this.factory.create(this.server.url, folder);
                    if (await this.check(s)) {
                        this.sessions.push(s)
                    } else {
                        throw new Error("Factory's output session not checking!");
                    }
                }));
        }
        return Promise.all(promises).finally(
            () => { this.__ensuringMin = false; }
        );
    }
}


module.exports = SessionPool;