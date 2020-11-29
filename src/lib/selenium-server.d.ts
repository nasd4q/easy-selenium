export = SeleniumServer;
/**
 * Interfaces with a selenium standalone server version 3.141.59 for basic operations
 * including starting the server, listing sessions, and killing them
 */
declare class SeleniumServer {
    /**
     *
     * @param {number} port
     * @returns {Promise<boolean>} whether has killed anything or not
     */
    static _stopJavaProcessesOccupyingPort(port: number): Promise<boolean>;
    /**
     * @param {*} jar path to jar
     * @param {*} chromedriver path to chromedriver, can be null
     * @param {*} geckodriver path to geckodriver, can be null
     * @param {number?} [session_timeout] in seconds. Defaults to `5782349` (~ 70 days)
     * @param {number} [port] the port on which to expose selenium server, defaults to 4444
     */
    static _getJavaLaunchServerCommand(jar: any, chromedriver: any, geckodriver: any, session_timeout?: number | null, port?: number): {
        command: string;
        args: any[];
    };
    /**
     * Stores port into `this.port` and creates convenience field `this.url`
     * @param {number} [port] defaults to 4444
     */
    constructor(port?: number);
    port: number;
    url: string;
    /**
     * @returns {Promise<boolean>} whether a selenium server at this.port responds or not
     */
    isAlive(): Promise<boolean>;
    /**
     * Spawns a new java process to set up a selenium server.
     *
     * (Except if some selenium server is already alive at `this.port`)
     *
     * @returns {Promise<boolean>} whether succesful or not
     */
    start(jar: any, chromedriver: any, geckodriver: any, session_timeout: any): Promise<boolean>;
    _pid: number;
    /**
     * Quits every running session, and shuts down the server __if this SeleniumServer instance
     * previously effectively started one__
     *
     */
    stop(): Promise<void>;
    /**
     * List sessions alive by questioning selenium server.
     *
     * Will throw FetchError inside returned promise if selenium server is not alive.
     * @returns {Promise<Session[]>}
     */
    list(): Promise<Session[]>;
    /**
     * Kills sessions.
     *
     * Will throw FetchError inside returned promise if selenium server is not alive.
     *
     * @returns {Promise<void>} a promise that resolves once its done
     * @param {Session[]} sessions
     */
    kill(sessions: Session[]): Promise<void>;
    /**
     * List sessions alive and kills them all.
     *
     * Will throw FetchError inside returned promise if selenium server is not alive.
     * @returns {Promise<void>} a promise that resolves once its done
     */
    killAll(): Promise<void>;
}
import Session = require("./session");
