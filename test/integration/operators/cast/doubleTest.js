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
    tools = require('../../../tools');

describe('PHP Parser grammar double cast "(double) <value>" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assigning (double) cast of variable value to another variable': {
            code: '$myDouble = (double)$string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myDouble'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_DOUBLE_CAST',
                                value: {
                                    name: 'N_VARIABLE',
                                    variable: 'string'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'assigning (float) cast of variable value to another variable': {
            code: '$myDouble = (float)$string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myDouble'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_DOUBLE_CAST',
                                value: {
                                    name: 'N_VARIABLE',
                                    variable: 'string'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'assigning (real) cast of variable value to another variable': {
            code: '$myDouble = (real)$string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myDouble'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_DOUBLE_CAST',
                                value: {
                                    name: 'N_VARIABLE',
                                    variable: 'string'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'assigning cast of variable value with addition to another variable': {
            code: '$myFloat = (float)$num1 + $num2;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myFloat'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_DOUBLE_CAST',
                                    value: {
                                        name: 'N_VARIABLE',
                                        variable: 'num1'
                                    }
                                },
                                right: [{
                                    operator: '+',
                                    operand: {
                                        name: 'N_VARIABLE',
                                        variable: 'num2'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'assigning cast of cast to another variable': {
            code: '$myFloat = (float)(int)$string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myFloat'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_DOUBLE_CAST',
                                value: {
                                    name: 'N_INTEGER_CAST',
                                    value: {
                                        name: 'N_VARIABLE',
                                        variable: 'string'
                                    }
                                }
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
