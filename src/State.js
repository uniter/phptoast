/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

/**
 * Represents the current state of the PHP parser
 *
 * @constructor
 */
function State() {
    /**
     * Path to the PHP file currently being parsed
     *
     * @type {string|null}
     */
    this.path = null;
}

_.extend(State.prototype, {
    /**
     * Fetches the path to the PHP file being parsed
     *
     * @returns {string}
     */
    getPath: function () {
        var path = this.path;

        return path === null ? '(program)' : path;
    },

    /**
     * Returns true if the PHP file being parsed is the main/entrypoint program
     * and not an included/required module
     *
     * @returns {boolean}
     */
    isMainProgram: function () {
        return this.path === null;
    },

    /**
     * Sets the path to the PHP file being parsed
     *
     * @param {string} path
     */
    setPath: function (path) {
        this.path = path;
    }
});

module.exports = State;
