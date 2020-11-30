import SeleniumServer from "./selenium-server";
import Session from "./session";
import SessionFactory from "./session-factory";
import UddStore from "./udd-store";
/**
 * Manages sessions associated with a SeleniuServer and a UddStorage.
 */
export declare class SessionPool {
    private server;
    private store;
    private factory;
    private min;
    private max;
    /** Asserts if a session is deemed acceptable and
     * can be made available or not */
    private check;
    /** Checked sessions only !*/
    private sessions;
    private returnedSessions;
    private _onLoanCount;
    private __ensuringMin;
    private events;
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
    constructor(server: SeleniumServer, store: UddStore, factory: SessionFactory, min: number, max: number, check: (s: Session) => Promise<boolean>);
    /**
     * Gets the pool ready with at least `this.min` sessions in place
     *
     * Ensures the selenium server is on, retrieves opened sessions if any and
     * customizes them, then checks them, and kills those that do not check,
     * collect those that check. Finally, calls `this._ensureMin`.
     */
    init(jar: string, chromedriver: string, geckodriver: string, sessionTimeout: number): Promise<void[]>;
    terminate(): Promise<void>;
    /**
     * Returns a checked and ready Session if one available, else returns undefined.
     * @returns { Session }
     */
    getOne(): Session;
    giveBack(session: Session): void;
    private _ensureMin;
    private _recycle;
}
