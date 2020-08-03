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
    expect = require('chai').expect,
    tools = require('../../tools');

describe('PHP Parser grammar nowdoc construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty nowdoc': {
            code: '<?php return <<<\'EOS\'\n\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_NOWDOC',
                        string: ''
                    }
                }]
            }
        },
        'nowdoc containing plain text': {
            code: '<?php return <<<\'EOS\'\nMy text goes here!\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_NOWDOC',
                        string: 'My text goes here!'
                    }
                }]
            }
        },
        'nowdoc containing plain text with whitespace before identifier': {
            code: '<?php return <<< \'EOS\'\nMy text goes here!\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_NOWDOC',
                        string: 'My text goes here!'
                    }
                }]
            }
        },
        'nowdoc containing unescaped quotes': {
            code: '<?php return <<<\'EOS\'\ndouble-quote: " and single quote: \'\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_NOWDOC',
                        string: 'double-quote: " and single quote: \''
                    }
                }]
            }
        },
        'nowdoc containing a string that could be interpreted as an interpolated variable': {
            code: '<?php return <<<\'EOS\'\nhere is my text with $myValue\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_NOWDOC',
                        string: 'here is my text with $myValue'
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            // Pretty-print the code strings so any non-printable characters are readable
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
