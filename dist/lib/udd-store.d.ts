export = UddStore;
declare class UddStore {
    /**
     * @param {string} path
     */
    static _deleteTrailingSlash(path: string): string;
    /**
     *
     * @param {String} path an absolute path to the directory storing sessions data, no trailing slash
     * @param {String} reference an absolute path to a reference udd, no trailing slash
     *
     */
    constructor(path: string, reference: string);
    /**
     * the absolute path to the directory storing sessions data
     * @type {String}
     * @public
     */
    public path: string;
    reference: string;
    /**
     * TODO test it (not too much slashes etc)
     *
     * Looks up this.path for udds : subfolders starting with `PREFIX`.
     * If found some, resolves to an array containing folder full paths.
     * Else, resolves to an empty array.
     * @returns {Promise<String[]>}
     */
    list(): Promise<string[]>;
    /**
     * Creates a new udd from reference into `this.path` and returns full path to
     * newly created udd
     */
    create(): Promise<string>;
}
