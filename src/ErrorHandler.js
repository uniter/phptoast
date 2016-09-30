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
    PHPParseError = require('phpcommon').PHPParseError;

/**
 * @param {Stream} stderr Stream to write error messages to
 * @param {State} state PHP parser state
 * @constructor
 */
function ErrorHandler(stderr, state) {
    /**
     * @type {State}
     */
    this.state = state;
    /**
     * @type {Stream}
     */
    this.stderr = stderr;
}

_.extend(ErrorHandler.prototype, {
    /**
     * Throws a PHPParseError from the provided parser error from Parsing
     *
     * @param {Exception} parseException
     * @throws {PHPParseError}
     */
    handle: function (parseException) {
        var handler = this,
            text = parseException.getText(),
            error,
            what;

        if (parseException.unexpectedEndOfInput()) {
            what = '$end';
        } else {
            what = '\'' + text.substr(parseException.getFurthestMatchEnd(), 1) + '\'';
        }

        error = new PHPParseError(PHPParseError.SYNTAX_UNEXPECTED, {
            'file': handler.state.getPath(),
            'line': parseException.getLineNumber(),
            'what': what
        });

        if (handler.state.isMainProgram() && handler.stderr) {
            handler.stderr.write(error.message);
        }

        throw error;
    }
});

module.exports = ErrorHandler;
