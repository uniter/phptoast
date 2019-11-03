/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    phpCommon = require('phpcommon'),
    sinon = require('sinon'),
    ErrorHandler = require('../../src/ErrorHandler'),
    ParseException = require('parsing/src/Exception/Parse'),
    PHPParseError = phpCommon.PHPParseError,
    State = require('../../src/State'),
    Translator = phpCommon.Translator;

describe('ErrorHandler', function () {
    var errorHandler,
        parseException,
        state,
        translator;

    beforeEach(function () {
        parseException = sinon.createStubInstance(ParseException);
        state = sinon.createStubInstance(State);
        translator = sinon.createStubInstance(Translator);

        parseException.getFurthestMatchEnd.returns(6);
        parseException.getLineNumber.returns(121);
        parseException.getText.returns('my source text');
        parseException.unexpectedEndOfInput.returns(false);
        state.getPath.returns('/path/to/my_module.php');
        state.getTranslator.returns(translator);
        translator.translate.callsFake(function (key, placeholderVariables) {
            return '[' + key + ']: ' +
                (placeholderVariables ? JSON.stringify(placeholderVariables) : '{}');
        });

        errorHandler = new ErrorHandler(null, state);
    });

    describe('handle()', function () {
        describe('the PHPParseError thrown on unexpected character', function () {
            it('should have the correct message', function () {
                expect(function () {
                    errorHandler.handle(parseException);
                }).to.throw(
                    PHPParseError,
                    // NB: the "r" is a character from the stubbed string above, 'my source text'
                    'PHP Parse error: [core.syntax_error]: {"what":"\'r\'"} in /path/to/my_module.php on line 121'
                );
            });

            it('should have the correct path', function () {
                try {
                    errorHandler.handle(parseException);
                } catch (error) {
                    expect(error.getFilePath()).to.equal('/path/to/my_module.php');
                }
            });

            it('should have the correct line number', function () {
                try {
                    errorHandler.handle(parseException);
                } catch (error) {
                    expect(error.getLineNumber()).to.equal(121);
                }
            });
        });

        describe('the PHPParseError thrown on unexpected end of input', function () {
            beforeEach(function () {
                parseException.unexpectedEndOfInput.returns(true);
            });

            it('should have the correct message', function () {
                expect(function () {
                    errorHandler.handle(parseException);
                }).to.throw(
                    PHPParseError,
                    'PHP Parse error: [core.unexpected_end_of_input]: {} in /path/to/my_module.php on line 121'
                );
            });

            it('should have the correct path', function () {
                try {
                    errorHandler.handle(parseException);
                } catch (error) {
                    expect(error.getFilePath()).to.equal('/path/to/my_module.php');
                }
            });

            it('should have the correct line number', function () {
                try {
                    errorHandler.handle(parseException);
                } catch (error) {
                    expect(error.getLineNumber()).to.equal(121);
                }
            });
        });
    });
});
