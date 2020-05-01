/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    parserMessages = require('./builtin/messages/parser'),
    Translator = require('phpcommon').Translator;

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
    /**
     * @type {Translator|null}
     */
    this.translator = null;
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
     * Provides the current Translator - either the default one created on demand,
     * or one provided by an external library such as PHPCore after being set via .setTranslator(...)
     *
     * @return {Translator}
     */
    getTranslator: function () {
        var state = this;

        if (state.translator === null) {
            state.translator = new Translator();

            // Add our parsing-related messages to the custom translator
            // (note that these may be overridden later by an external library)
            state.translator.addTranslations(parserMessages);
        }

        return state.translator;
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
    },

    /**
     * Allows an external library (such as PHPCore) to provide its own translator -
     * otherwise, we will create our own parsing-specific one here
     *
     * @param {Translator} translator
     */
    setTranslator: function (translator) {
        this.translator = translator;

        // Add our parsing-related messages to the provided translator
        // (note that these may be overridden later by an external library)
        translator.addTranslations(parserMessages);
    }
});

module.exports = State;
