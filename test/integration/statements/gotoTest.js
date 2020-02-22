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

describe('PHP Parser grammar goto statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'forward goto immediately followed by label': {
            code: 'goto test; test:',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_GOTO_STATEMENT',
                    label: {
                        name: 'N_STRING',
                        string: 'test'
                    }
                }, {
                    name: 'N_LABEL_STATEMENT',
                    label: {
                        name: 'N_STRING',
                        string: 'test'
                    }
                }]
            }
        },
        'forward goto jumping over first echo to second': {
            code: 'goto secondEcho; echo "first"; secondEcho: echo "second";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_GOTO_STATEMENT',
                    label: {
                        name: 'N_STRING',
                        string: 'secondEcho'
                    }
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'first'
                    }]
                }, {
                    name: 'N_LABEL_STATEMENT',
                    label: {
                        name: 'N_STRING',
                        string: 'secondEcho'
                    }
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'second'
                    }]
                }]
            }
        },
        'backward goto used as infinite loop': {
            code: 'repeat: echo 1; goto repeat;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_LABEL_STATEMENT',
                    label: {
                        name: 'N_STRING',
                        string: 'repeat'
                    }
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1'
                    }]
                }, {
                    name: 'N_GOTO_STATEMENT',
                    label: {
                        name: 'N_STRING',
                        string: 'repeat'
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            var code = '<?php ' + scenario.code;

            // Pretty-print the code strings so any non-printable characters are readable
            describe('when the code is ' + JSON.stringify(code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
