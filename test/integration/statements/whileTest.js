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

describe('PHP Parser grammar while statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple while true with no body statements': {
            code: 'while (true) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_BOOLEAN',
                        bool: 'true'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'simple while true with one body statement': {
            code: 'while (true) { echo 4; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_BOOLEAN',
                        bool: 'true'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_INTEGER',
                                number: '4'
                            }]
                        }]
                    }
                }]
            }
        },
        'while with assignment in condition': {
            code: 'while ($line = readLine()) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'line'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'readLine'
                                },
                                args: []
                            }
                        }]
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
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
