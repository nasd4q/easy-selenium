/**
 * Interfaces with a file-system (module 'fs') folder for storing selenium browsing
 * sessions "user-data-dirs" and exposes convenience methods such as :
 *
 * + `list()`, which allows to get a list of fs-existing udds,
 * + `create(...)`, which allows to duplicate the 'reference udd'
 * (ie the folder at path `reference`), e.g. for launching a new browsing
 * session from it
 */
export declare class UddStore {
    /**The absolute path to the directory storing sessions data  */
    path: string;
    reference: string;
    /**
     *
     * @param {String} path an absolute path to the directory storing sessions data, no trailing slash
     * @param {String} reference an absolute path to a reference udd, no trailing slash
     *
     */
    constructor(path: string, reference: string);
    /**
     * TODO test it (not too much slashes etc)
     *
     * Looks up this.path for udds : subfolders starting with `PREFIX`.
     * If found some, resolves to an array containing folder full paths.
     * Else, resolves to an empty array.
     * @returns {Promise<string[]>}
     */
    list(): Promise<string[]>;
    /**
     * Creates a new udd from reference into `this.path` and returns full path to
     * newly created udd
     */
    create(): Promise<string>;
    /**
     * @param {string} path
     */
    static _deleteTrailingSlash(path: string): string;
}
