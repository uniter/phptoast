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

describe('PHP Parser grammar error control operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'suppressing errors for the read part of a variable copy': {
            code: '$otherVar = @$myVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'otherVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_SUPPRESSED_EXPRESSION',
                                expression: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'suppressing errors for a function call inside addition operand': {
            code: '$myResult = @myFunc() + $myVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myResult'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_SUPPRESSED_EXPRESSION',
                                    expression: {
                                        name: 'N_FUNCTION_CALL',
                                        func: {
                                            name: 'N_STRING',
                                            string: 'myFunc'
                                        },
                                        args: []
                                    }
                                },
                                right: [{
                                    operator: '+',
                                    operand: {
                                        name: 'N_VARIABLE',
                                        variable: 'myVar'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'suppressing errors for the target of an assignment': {
            code: '@$result = $undefVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_SUPPRESSED_EXPRESSION',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'result'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'undefVar'
                                }
                            }]
                        }
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
