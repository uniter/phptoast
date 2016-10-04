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

describe('PHP Parser grammar function definition statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple empty function definition with no args or statements': {
            code: 'function gogo() {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'gogo'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'simple empty function definition with one arg but no statements': {
            code: 'function doNothing($a) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'doNothing'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'a'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'function definition with one arg and one body statement not wrapped in braces': {
            code: 'function printIt($string) echo $string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'printIt'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'string'
                        }
                    }],
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_VARIABLE',
                            variable: 'string'
                        }]
                    }
                }]
            }
        },
        'function definition with two args and two statements': {
            code: 'function add($number1, $number2) { $result = $number1 + $number2; return $result; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'add'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'number1'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'number2'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'result'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_EXPRESSION',
                                        left: {
                                            name: 'N_VARIABLE',
                                            variable: 'number1'
                                        },
                                        right: [{
                                            operator: '+',
                                            operand: {
                                                name: 'N_VARIABLE',
                                                variable: 'number2'
                                            }
                                        }]
                                    }
                                }]
                            }
                        }, {
                            name: 'N_RETURN_STATEMENT',
                            expression: {
                                name: 'N_VARIABLE',
                                variable: 'result'
                            }
                        }]
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
