import * as fetch from 'node-fetch';
import * as child_process from 'child_process';
import { WebDriver } from 'selenium-webdriver';
import { Executor, HttpClient } from "selenium-webdriver/http";
import { Session } from './session';
import { UddStore } from './udd-store';

/**
 * Interfaces with a selenium standalone server version 3.141.59 for basic operations
 * including starting the server, listing sessions, and killing them
 */
export class SeleniumServer {
    port: number;
    url: string;
    _pid: any;
    /**
     * Stores port into `this.port` and creates convenience field `this.url`
     * @param {number} [port] Defaults to 4444 
     */
    constructor(port: number) {
        this.port = port ? port : 4444
        this.url = "http://localhost:" + this.port + "/wd/hub";
    }

    /**
     * @returns {Promise<boolean>} whether a selenium server at this.port responds or not
     */
    isAlive(): Promise<boolean> {
        return fetch.default(this.url + '/status')
            .then(res => res.json())
            .then(json => json.status === 0 && json.value.ready && json.value.message === 'Server is running')
            .catch(() => false);
    }

    /**
     * Spawns a new java process to set up a selenium server.   
     * (Except if some selenium server is already alive at `this.port`)
     * 
     * @param session_timeout in seconds. Defaults to 5782349 (~ 70 days)
     * @returns {Promise<boolean>} whether succesful or not
     */
    async start(jar: string, chromedriver: string, geckodriver: string, 
        session_timeout?: number): Promise<boolean> {
        if (await this.isAlive()) {
            return true;
        }
        //retrive commmand
        let cmd = SeleniumServer._getJavaLaunchServerCommand(jar, chromedriver, 
            geckodriver, session_timeout, this.port);
        //launch it
        let subprocess = child_process.spawn(cmd.command, cmd.args, 
            { detached: true, cwd: __dirname });
        //examine whether succesful
        let launched = new Promise((res) => {
            subprocess.stderr.on("data", (data) => {
                let hasFailed = /Exception in thread "main" java.lang.RuntimeException/g.test(data.toString());
                let hasSucceeded = new RegExp("Selenium Server is up and running on port " + this.port).test(data.toString());
                if (hasFailed) {
                    res(false);
                }
                if (hasSucceeded) {
                    res(true);
                }
                //console.log('java launching command : - stderr: ' + data.toString());
            });
            subprocess.on('exit', () => {
                res(false);
            });
        });
        //either unreference the process to let it running after this node program exits
        //  (and stores pid for stopping purposes)
        //or kills the unsuccessful java process
        return launched.then(success => {
            if (success) {
                this._pid = subprocess.pid;
                subprocess.unref();
                subprocess.stdio.forEach(s => s.destroy());
                return true;
            } else {
                subprocess.kill();
                return false;
            }
        })
    }

    /**
     * Quits every running session, and shuts down the server __if this SeleniumServer instance
     * previously effectively started one__
     */
    async stop(): Promise<void> {
        await this.killAll();

        let p = Promise.resolve();
        if (this._pid !== undefined) {
            let cp = child_process.exec('kill -9 ' + this._pid);
            p = p.then(() => new Promise(res => cp.on("exit", res)));
        }
        return p;
    }

    /**
     * 
     * @param {number} port 
     * @returns {Promise<boolean>} whether has killed anything or not
     */
    //TODO? - this method might bug if multiple java processes found listening on same port ?
    static _stopJavaProcessesOccupyingPort(port: number): Promise<boolean> {
        //command : that gets tcp connections, who 'LISTEN', on port `port` ($4 corresponds PORT), where ps -o comm= -p du pid as procname, where procname contient java, affiche $2, aka $9 ----> pid
        let command = `netstat -anvp tcp | grep LISTEN | awk '$4 ~ /\\.${port}/' | awk '{"ps -o comm= -p " $9 | getline procname; print $4 " " $9 " " procname}'| awk  '$3 ~ /java/' | awk '{print $2}'`

        let cp = child_process.exec(command);
        let p = new Promise(res => {
            cp.stdout.on('data', (data) => {
                let s = data.toString();
                //console.log(s);
                if (s) {
                    let k = null;
                    try {
                        k = Number(data.toString());
                    } catch (err) {
                        console.log("Error while trying to parse process pid from this data (received from command) : " + data.toString());
                    }
                    res(k);
                } else {
                    res(null);
                }
            });
            cp.on('exit', () => {
                res(null);
            });
        });
        return p.then(pid => {
            if (pid !== null) {
                return new Promise(res => {
                    cp = child_process.exec("kill -9 " + pid);
                    cp.on("exit", () =>
                        res(true));
                })
            } else {
                return false;
            }
        })
    }

    /**
     * List sessions alive by questioning selenium server.
     * 
     * Will throw FetchError inside returned promise if selenium server is not alive.
     * @returns {Promise<Session[]>} 
     */
    async list(): Promise<Session[]> {
        /** @type {Session[]} */
        let sessions = await fetch.default(this.url + '/sessions')
            .then(res => res.json())
            .then(res => res.value)
            .then(res => res.map(el => new Session(
                el.id,
                UddStore._deleteTrailingSlash(el.capabilities.chrome.userDataDir),
                () => new WebDriver(el.id, new Executor(new HttpClient(this.url)))
            )));

        return sessions;
    }


    /**
     * Kills sessions.
     * 
     * Will throw FetchError inside returned promise if selenium server is not alive.
     * 
     * @returns {Promise<void[]>} a promise that resolves once its done
     * @param {Session[]} sessions 
     */
    kill(sessions: Session[]): Promise<void[]> {
        return Promise.all(sessions.map(async (s) => {
            return s.driver().quit();
        }));
    }

    /**
     * List sessions alive and kills them all.
     * 
     * Will throw FetchError inside returned promise if selenium server is not alive.
     * @returns {Promise<void[]>} a promise that resolves once its done
     */
    async killAll(): Promise<void[]> {
        return this.kill(await this.list());
    }


    // Private

    /**
     * @param {*} jar path to jar
     * @param {*} chromedriver path to chromedriver, can be null
     * @param {*} geckodriver path to geckodriver, can be null
     * @param {number?} [session_timeout] in seconds. Defaults to `5782349` (~ 70 days)
     * @param {number} [port] the port on which to expose selenium server, defaults to 4444 
     */
    private static _getJavaLaunchServerCommand(jar: string, chromedriver: string, 
        geckodriver: string, session_timeout?: number, port?: number) {
        if (session_timeout === undefined || session_timeout === null) {
            session_timeout = 5782349;
        }
        if (port === undefined || port === null) {
            port = 4444;
        }
        let command = 'java';
        let args = []
        if (chromedriver) {
            args.push('-Dwebdriver.chrome.driver=' + chromedriver);
        }
        if (geckodriver) {
            args.push('-Dwebdriver.gecko.driver=' + geckodriver);
        }
        args.push(...[
            '-jar', jar,
            '-port', port,
            '-sessionTimeout', session_timeout
        ]);

        return { command, args };
    }
}