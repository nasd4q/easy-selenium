const fetch = require('node-fetch');
const childProcess = require('child_process');
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
     * Constructs, but does not check or start the server
     * 
     * @param {string} jar path to jar
     * @param {string} chromedriver path to chromedriver
     * @param {string} geckodriver path to geckodriver
     * @param {number} port 
     * @param {number?} sessionTimeout in seconds. Defaults to `5782349` (~ 70 days)
     */
    constructor(jar, chromedriver, geckodriver, port, sessionTimeout) {
        this._jar = jar;
        this._chromedriver = chromedriver;
        this._geckodriver = geckodriver;
        this.port = port ? port : 4444
        this.sessionTimeout = sessionTimeout ? sessionTimeout : 5782349;
        this.url = "http://localhost:" + port + "/wd/hub";
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
     * Spawns a new process to start up a selenium server. 
     * 
     * (Except if some selenium server is alive at `this.port`)
     * 
     * @returns {Promise<boolean>} whether a selenium server at this.port is now ready or not
     */
    async start() {
        let notSpawnedYet = true;
        let remainingTrials = 12;
        while (!(await this.isAlive()) && remainingTrials-- > 0) {
            if (notSpawnedYet) {
                let path = __dirname + '/tmp_script_' + this.port;
                this._writeLaunchScriptToFile(path);
                //TODO - this works ?
                //childProcess.spawn(path);
                childProcess.spawn('bash', [path]);
                notSpawnedYet = false;
            }
            await new Promise(res => setTimeout(res, 600));
        }
        return this.isAlive();
    }

    /**
     * Quits every running session and shuts down the server
     */
    async stop() {
        await this.killAll();

        let buffer = await new Promise(
            res => fs.readFile(
                __dirname + '/tmp_process_id_' + this.port,
                (err, data) => res(data)));
        let idS = buffer.toString();

        let cp = childProcess.exec('kill -9 ' + idS);
        await new Promise(res => cp.on("exit", () => res()));
        cp = childProcess.exec('rm ' + __dirname + '/tmp_process_id_' + this.port);
        await new Promise(res => cp.on("exit", () => res()));
        cp = childProcess.exec('rm ' + __dirname + '/tmp_script_' + this.port);
        await new Promise(res => cp.on("exit", () => res()));
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
     * @returns {Promise<void>} a promise that resolves once its done
     * @param {Session[]} sessions 
     */
    kill(sessions) {
        return Promise.all(sessions.map(async(s) => {
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



    async _writeLaunchScriptToFile(path) {
        let script =
            '#!/bin/bash' + '\n' +
            '\n' +
            'java -Dwebdriver.gecko.driver=' + this._geckodriver +
            ' -Dwebdriver.chrome.driver=' + this._chromedriver +
            ' -jar ' + this._jar +
            ' -port ' + this.port +
            ' -sessionTimeout ' + this.sessionTimeout + ' &\n' +
            'echo "$!" > ' + __dirname + '/tmp_process_id_' + this.port;

        await new Promise((res, rej) => fs.writeFile(
            path,
            script,
            (err) => err ? rej() : res()));

        childProcess.execSync("chmod +x " + path);
        return;
    }
}

module.exports = SeleniumServer;