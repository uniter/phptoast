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
    tools = require('../../tools'),
    PHPParseError = phpCommon.PHPParseError,
    Translator = phpCommon.Translator;

describe('PHP Parser custom translator integration', function () {
    var parser,
        translator;

    beforeEach(function () {
        parser = tools.createParser();

        translator = new Translator();
        parser.getState().setPath('/path/to/my_module.php');
        parser.getState().setTranslator(translator);

        translator.addTranslation('en_GB', 'core.syntax_error', 'Oh dear, I did not expect a ${what}!');
    });

    it('should use the custom syntax error translation provided on error', function () {
        expect(function () {
            parser.parse('<?php \n\n $a @ = 1');
        }).to.throw(
            PHPParseError,
            'PHP Parse error: Oh dear, I did not expect a \'@\'! in /path/to/my_module.php on line 3'
        );
    });
});
