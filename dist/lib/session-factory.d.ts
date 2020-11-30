export = SessionFactory;
declare class SessionFactory {
    /**
     * @param { (session : Session) => Promise<Session> } [customize] prepare the session for specific tasks
     */
    constructor(customize?: (session: Session) => Promise<Session>);
    _customize: (session: Session) => Promise<Session>;
    /**
     *
     * @param {string} udd path to user data dir (absolute, no trailing slash)
     * @param {string} url url of selenium server
     * @returns {Promise<Session>}
     */
    create(url: string, udd: string): Promise<Session>;
    /**
     *
     * @params {Session} session
     * @returns {Promise<Session>}
     */
    customize(session: any): Promise<Session>;
}
import Session = require("./session");
