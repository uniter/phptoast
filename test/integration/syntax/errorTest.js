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
    engineTools = require('../tools'),
    nowdoc = require('nowdoc'),
    phpTools = require('../../tools'),
    PHPParseError = require('phpcommon').PHPParseError;

describe('PHP Parser syntax error handling integration', function () {
    var parser;

    function check(scenario) {
        engineTools.check(function () {
            return {
                parser: parser
            };
        }, scenario);
    }

    beforeEach(function () {
        parser = phpTools.createParser();
    });

    _.each({
        'function call missing end semicolon': {
            code: '<?php open()',
            expectedException: {
                instanceOf: PHPParseError,
                match: /^PHP Parse error: syntax error, unexpected end of file in \(program\) on line 1$/
            }
        },
        'echo missing argument or end semicolon': {
            code: '<?php echo',
            expectedException: {
                instanceOf: PHPParseError,
                match: /^PHP Parse error: syntax error, unexpected end of file in \(program\) on line 1$/
            }
        },
        'function call missing end semicolon and followed by whitespace': {
            code: '<?php open() ',
            expectedException: {
                instanceOf: PHPParseError,
                match: /^PHP Parse error: syntax error, unexpected end of file in \(program\) on line 1$/
            }
        },
        'concatenation expression with superfluous dot preceded by whitespace': {
            code: nowdoc(function () {/*<<<EOS
<?php
    print 'hello and ';

    print 'welcome to ' .
          .'my website!';

EOS
*/;}), // jshint ignore:line
            expectedException: {
                instanceOf: PHPParseError,
                match: /^PHP Parse error: syntax error, unexpected '.' in \(program\) on line 5$/
            }
        },
        'concatenation with invalid comma before dot operator and followed by whitespace': {
            code: '<?php $a = 1 ,. 2; ',
            expectedException: {
                instanceOf: PHPParseError,
                match: /^PHP Parse error: syntax error, unexpected ',' in \(program\) on line 1$/
            }
        },
        'concatenation with invalid comma after dot operator and followed by whitespace': {
            code: '<?php $a = 1 ., 2; ',
            expectedException: {
                instanceOf: PHPParseError,
                match: /^PHP Parse error: syntax error, unexpected ',' in \(program\) on line 1$/
            }
        },
        // Ensure the invalid token's line is referred to, not the last valid token's line
        'concatenation with invalid comma after dot operator preceded by newlines': {
            code: nowdoc(function () {/*<<<EOS
<?php
    print 'hello and ' .

    ,
EOS
*/;}), // jshint ignore:line
            expectedException: {
                instanceOf: PHPParseError,
                match: /^PHP Parse error: syntax error, unexpected ',' in \(program\) on line 4$/
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            check(scenario);
        });
    });
});
