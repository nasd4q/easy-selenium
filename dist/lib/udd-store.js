const fs = require('fs');
const makeDir = require("make-dir");
const copydir = require('copy-dir');
const PREFIX = "udd_";
class UddStore {
    /**
     *
     * @param {String} path an absolute path to the directory storing sessions data, no trailing slash
     * @param {String} reference an absolute path to a reference udd, no trailing slash
     *
     */
    constructor(path, reference) {
        /**
         * the absolute path to the directory storing sessions data
         * @type {String}
         * @public
         */
        this.path = path;
        this.reference = reference;
    }
    /**
     * TODO test it (not too much slashes etc)
     *
     * Looks up this.path for udds : subfolders starting with `PREFIX`.
     * If found some, resolves to an array containing folder full paths.
     * Else, resolves to an empty array.
     * @returns {Promise<String[]>}
     */
    async list() {
        /** @type {string[]} */
        let list = [];
        await new Promise(res => {
            fs.readdir(this.path, { withFileTypes: true }, (err, dirents) => {
                if (err) {
                    res();
                    return;
                }
                list.push(...dirents
                    .filter(f => f.isDirectory())
                    .filter(f => f.name.startsWith(PREFIX))
                    .map(f => this.path + '/' + f.name));
                res();
            });
        });
        return list;
    }
    /**
     * Creates a new udd from reference into `this.path` and returns full path to
     * newly created udd
     */
    async create() {
        let getNumber = function () {
            let number = Math.floor(Math.random() * 99 + 1);
            let numberS = (number < 10) ? '0' + number : '' + number;
            return numberS;
        };
        let name;
        let i = 10;
        do {
            name = PREFIX + getNumber();
        } while (await new Promise(res => fs.readdir(this.path, (err, files) => {
            if (err) {
                res(false);
                return;
            }
            if (!files.includes(name)) {
                res(false);
                return;
            }
            res(true);
            return;
        })) && i-- > 0);
        if (i === -1) {
            throw new Error("Unable to generate untaken name while trying to create udd.");
        }
        const udd = this.path + '/' + name;
        await makeDir(udd);
        await new Promise(res => copydir(this.reference, udd, { cover: true }, function (err) {
            if (err) {
                throw err;
            }
            res();
        }));
        return udd;
    }
    /**
     * @param {string} path
     */
    static _deleteTrailingSlash(path) {
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        return path;
    }
}
module.exports = UddStore;
