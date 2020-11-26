const SeleniumServer = require("./selenium-server");
const Session = require("./session");
const SessionFactory = require("./session-factory");
const UddStore = require("./udd-store");
const { EventEmitter } = require('events');

const EVENTS = {
    refreshed: "Pool just refreshed"
};

/**
 * Manages sessions associated with a SeleniuServer and a UddStorage.
 */
class SessionPool extends EventEmitter {
    /**
     * Just assigns construction params to instance fields.
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
        super();
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
     * 
     * Ensures the selenium server is on, retrieves opened sessions if any and 
     * customizes them, then checks them, and kills those that do not check, 
     * collect those that check. Finally, calls `this._ensureMin`.
     */
    async init() {
        await this.server.start().then(ready => {
            if (!ready) {
                throw new Error("Couldn't start the selenium server.");
            }
        });
        //TODO delete this reuse of existing session if not for testing...
        await this.server.list().then(sessions => Promise.all(sessions.map(async(s) => {
            let checked = false;
            try {
                s = await this.factory.customize(s);
                checked = await this.check(s)
            } catch (err) {
                checked = false;
            }
            if (checked) {
                this.sessions.push(s);
            } else {
                await s.driver().quit();
            }
        })));

        let p = this._ensureMin();
        return p;
    }

    /**
     * Returns a checked and ready Session if one available, else returns undefined.
     * @returns { Session }
     */
    getOne() {
        let s = this.sessions.shift();
        if (s) {
            if (!this.__ensuringMin) {
                this.__ensuringMin = true;
                setTimeout(() => this._ensureMin(), 5000);
            }
            this._onLoanCount++;
        }
        return s;
    }

    giveBack(session) {
        this.returnedSessions.push(session);
        this._onLoanCount--;
        if (!this.__ensuringMin) {
            this.__ensuringMin = true;
            setTimeout(() => this._ensureMin(), 5000);
        }
    }

    /* ****************************************************************************** *
     *                              PRIVATE   METHODS                                 *
     * ****************************************************************************** */

    async _ensureMin() {
        await this._recycle();
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
        return Promise.all(promises).finally(() => {
            this.__ensuringMin = false;
            this.emit(EVENTS.refreshed);
        });
    }

    async _recycle() {
        /** @type {Session[]} */
        let deadSessions = [];
        /** @type {Session[]} */
        let beingWorkedOnSessions = [];

        //1.drain returned_sessions into being worked on
        beingWorkedOnSessions.push(...this.returnedSessions.splice(0, this.returnedSessions.length));

        //2.sort into dead or leave those that pass the check
        await Promise.all(beingWorkedOnSessions.map(async(s, i) => {
            if (!(await this.check(s))) {
                deadSessions.push(...beingWorkedOnSessions.splice(i, 1));
            }
        }));

        //3.kill and discard dead sessions, recycle checked sessions
        this.sessions.push(...beingWorkedOnSessions);
        return this.server.kill(deadSessions);
    }
}


module.exports = SessionPool;