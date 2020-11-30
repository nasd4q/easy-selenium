const fetch = require('node-fetch');
const child_process = require('child_process');
const fs = require('fs');
const { WebDriver } = require('selenium-webdriver');
const { Executor, HttpClient } = require('selenium-webdriver/http');
const Session = require('./session');
const UddStore = require('./udd-store');
/**
 * Interfaces with a selenium standalone server version 3.141.59 for basic operations
 * including starting the server, listing sessions, and killing them
 */
class SeleniumServer {
    /**
     * Stores port into `this.port` and creates convenience field `this.url`
     * @param {number} [port] defaults to 4444
     */
    constructor(port) {
        this.port = port ? port : 4444;
        this.url = "http://localhost:" + this.port + "/wd/hub";
    }
    /**
     * @returns {Promise<boolean>} whether a selenium server at this.port responds or not
     */
    isAlive() {
        return fetch(this.url + '/status')
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
    async start(jar, chromedriver, geckodriver, session_timeout) {
        if (await this.isAlive()) {
            return true;
        }
        //retrive commmand
        let cmd = SeleniumServer._getJavaLaunchServerCommand(jar, chromedriver, geckodriver, session_timeout, this.port);
        //launch it
        let subprocess = child_process.spawn(cmd.command, cmd.args, { detached: true, cwd: __dirname });
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
            }
            else {
                subprocess.kill();
                return false;
            }
        });
    }
    /**
     * Quits every running session, and shuts down the server __if this SeleniumServer instance
     * previously effectively started one__
     *
     */
    async stop() {
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
    //this method might bug if multiple java processes found listening on same port ?
    static _stopJavaProcessesOccupyingPort(port) {
        //command : that gets tcp connections, who 'LISTEN', on port `port` ($4 corresponds PORT), where ps -o comm= -p du pid as procname, where procname contient java, affiche $2, aka $9 ----> pid
        let command = `netstat -anvp tcp | grep LISTEN | awk '$4 ~ /\\.${port}/' | awk '{"ps -o comm= -p " $9 | getline procname; print $4 " " $9 " " procname}'| awk  '$3 ~ /java/' | awk '{print $2}'`;
        let cp = child_process.exec(command);
        let p = new Promise(res => {
            cp.stdout.on('data', (data) => {
                let s = data.toString();
                //console.log(s);
                if (s) {
                    let k = null;
                    try {
                        k = Number(data.toString());
                    }
                    catch (err) {
                        console.log("Error while trying to parse process pid from this data (received from command) : " + data.toString());
                    }
                    res(k);
                }
                else {
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
                    cp.on("exit", () => res(true));
                });
            }
            else {
                return false;
            }
        });
    }
    /**
     * List sessions alive by questioning selenium server.
     *
     * Will throw FetchError inside returned promise if selenium server is not alive.
     * @returns {Promise<Session[]>}
     */
    async list() {
        /** @type {Session[]} */
        let sessions = await fetch(this.url + '/sessions')
            .then(res => res.json())
            .then(res => res.value)
            .then(res => res.map(el => new Session(el.id, UddStore._deleteTrailingSlash(el.capabilities.chrome.userDataDir), () => new WebDriver(el.id, new Executor(new HttpClient(this.url))))));
        return sessions;
    }
    /**
     * Kills sessions.
     *
     * Will throw FetchError inside returned promise if selenium server is not alive.
     *
     * @returns {Promise<void>} a promise that resolves once its done
     * @param {Session[]} sessions
     */
    kill(sessions) {
        return Promise.all(sessions.map(async (s) => {
            return s.driver().quit();
        }));
    }
    /**
     * List sessions alive and kills them all.
     *
     * Will throw FetchError inside returned promise if selenium server is not alive.
     * @returns {Promise<void>} a promise that resolves once its done
     */
    async killAll() {
        return this.kill(await this.list());
    }
    //TODO method for shutting down the server
    // Private
    /**
     * @param {*} jar path to jar
     * @param {*} chromedriver path to chromedriver, can be null
     * @param {*} geckodriver path to geckodriver, can be null
     * @param {number?} [session_timeout] in seconds. Defaults to `5782349` (~ 70 days)
     * @param {number} [port] the port on which to expose selenium server, defaults to 4444
     */
    static _getJavaLaunchServerCommand(jar, chromedriver, geckodriver, session_timeout, port) {
        if (session_timeout === undefined || session_timeout === null) {
            session_timeout = 5782349;
        }
        if (port === undefined || port === null) {
            port = 4444;
        }
        let command = 'java';
        let args = [];
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
module.exports = SeleniumServer;
