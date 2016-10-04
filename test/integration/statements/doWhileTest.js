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

describe('PHP Parser grammar do...while statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple do...while true with no body statements': {
            code: 'do {} while (true);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_DO_WHILE_STATEMENT',
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
        'simple do...while true with one body statement': {
            code: 'do { echo 4; } while (true);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_DO_WHILE_STATEMENT',
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
        'simple do...while true with one body statement but no surrounding braces': {
            code: 'do echo 4; while (true);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_DO_WHILE_STATEMENT',
                    condition: {
                        name: 'N_BOOLEAN',
                        bool: 'true'
                    },
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }
                }]
            }
        },
        'do...while with assignment in condition': {
            code: 'do {} while ($line = readLine());',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_DO_WHILE_STATEMENT',
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
