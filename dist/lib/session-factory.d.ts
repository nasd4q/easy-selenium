import { Session } from './session';
/**
 * Exposes instance method `create(...)` to generate new selenium browsing sessions
 */
export declare class SessionFactory {
    private _customize;
    headless: boolean;
    /**
     * @param customize Prepares the session for specific tasks. Will be called
     * right before returning freshly created session by `this.create(...)` method
     * @param headless Defaults to `false`
     */
    constructor(customize: (session: Session) => Promise<Session>, headless?: boolean);
    /**
     * @param udd path to user data dir (absolute, no trailing slash)
     * @param url url of selenium server
     */
    create(url: string, udd: string): Promise<Session>;
    customize(session: Session): Promise<Session>;
}
