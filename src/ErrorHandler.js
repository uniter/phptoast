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
}

_.extend(ErrorHandler.prototype, {
    /**
     * Throws a PHPParseError from the provided parser error from Parsing
     *
     * @param {ParseException} parseException
     * @throws {PHPParseError}
     */
    handle: function (parseException) {
        var handler = this,
            message,
            text = parseException.getText(),
            translator = handler.state.getTranslator();

        if (parseException.unexpectedEndOfInput()) {
            message = translator.translate('core.unexpected_end_of_input');
        } else {
            message = translator.translate('core.syntax_error', {
                'what': '\'' + text.substr(parseException.getFurthestMatchEnd(), 1) + '\''
            });
        }

        throw new PHPParseError(
            message,
            handler.state.getPath(),
            parseException.getLineNumber()
        );
    }
});

module.exports = ErrorHandler;
