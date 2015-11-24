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

describe('PHP Parser grammar integer cast "(integer) <value>" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assigning long (integer) cast of variable value to another variable': {
            code: '$myInt = (integer)$string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myInt'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER_CAST',
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
        'assigning short (int) cast of variable value to another variable': {
            code: '$myInt = (int)$string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myInt'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER_CAST',
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
            code: '$myInt = (int)$num1 + $num2;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myInt'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_INTEGER_CAST',
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
            code: '$myInt = (int)(float)$string;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myInt'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER_CAST',
                                value: {
                                    name: 'N_DOUBLE_CAST',
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
