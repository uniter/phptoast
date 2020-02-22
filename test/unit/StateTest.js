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
    State = require('../../src/State'),
    Translator = phpCommon.Translator;

describe('State', function () {
    var state;

    beforeEach(function () {
        state = new State();
    });

    describe('getPath()', function () {
        it('should return "(program)" when the main program is being parsed', function () {
            expect(state.getPath()).to.equal('(program)');
        });
    });

    describe('getTranslator()', function () {
        it('should return an instance of Translator', function () {
            expect(state.getTranslator()).to.be.an.instanceOf(Translator);
        });

        it('should return the same instance of Translator on a second call', function () {
            expect(state.getTranslator()).to.equal(state.getTranslator());
        });

        it('should install the parser messages into the default Translator created', function () {
            var translator = state.getTranslator();

            expect(translator.translate('core.syntax_error', {what: 'something'}))
                .to.equal('syntax error, unexpected something');
        });
    });

    describe('isMainProgram()', function () {
        it('should return true when the main program is being parsed', function () {
            expect(state.isMainProgram()).to.be.true;
        });

        it('should return false when a sub-script is being parsed', function () {
            state.setPath('/some/module.php');

            expect(state.isMainProgram()).to.be.false;
        });
    });

    describe('setPath()', function () {
        it('should allow the path to be set', function () {
            state.setPath('/my/path/to/my/module.php');

            expect(state.getPath()).to.equal('/my/path/to/my/module.php');
        });
    });

    describe('setTranslator()', function () {
        it('should be able to specify the instance to be returned by .getTranslator()', function () {
            var translator = sinon.createStubInstance(Translator);
            state.setTranslator(translator);

            expect(state.getTranslator()).to.equal(translator);
        });

        it('should install the parser messages into the custom Translator provided', function () {
            var translator = new Translator();

            state.setTranslator(translator);

            expect(translator.translate('core.syntax_error', {what: 'something'}))
                .to.equal('syntax error, unexpected something');
        });
    });
});
