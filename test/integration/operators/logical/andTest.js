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

describe('PHP Parser grammar logical And "<value> && <value>" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assigning And of variable values to another variable': {
            code: '$result = $value1 && $value2;',
            expectedAST: {
                name: 'N_PROGRAM',
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
                                    variable: 'value1'
                                },
                                right: [{
                                    operator: '&&',
                                    operand: {
                                        name: 'N_VARIABLE',
                                        variable: 'value2'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'assigning word-And of variable values to another variable': {
            code: '$result = $value1 aNd $value2;', // Test cae-insensitivity
            expectedAST: {
                name: 'N_PROGRAM',
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
                                    variable: 'value1'
                                },
                                right: [{
                                    operator: 'and',
                                    operand: {
                                        name: 'N_VARIABLE',
                                        variable: 'value2'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'assigning condition with assignment inside operand to variable': {
            code: '$result = (first_func() && $pos = second_func());',
            expectedAST: {
                name: 'N_PROGRAM',
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
                                    name: 'N_FUNCTION_CALL',
                                    func: {
                                        name: 'N_STRING',
                                        string: 'first_func'
                                    },
                                    args: []
                                },
                                right: [{
                                    operator: '&&',
                                    operand: {
                                        name: 'N_EXPRESSION',
                                        left: {
                                            name: 'N_VARIABLE',
                                            variable: 'pos'
                                        },
                                        right: [{
                                            operator: '=',
                                            operand: {
                                                name: 'N_FUNCTION_CALL',
                                                func: {
                                                    name: 'N_STRING',
                                                    string: 'second_func'
                                                },
                                                args: []
                                            }
                                        }]
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'assigning two chained Ands to another variable': {
            // "&&" is left-associative, so equivalent to `$result = ($value1 && $value2) && $value3;`
            code: '$result = $value1 && $value2 && $value3;',
            expectedAST: {
                name: 'N_PROGRAM',
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
                                    name: 'N_EXPRESSION',
                                    left: {
                                        name: 'N_VARIABLE',
                                        variable: 'value1'
                                    },
                                    right: [{
                                        operator: '&&',
                                        operand: {
                                            name: 'N_VARIABLE',
                                            variable: 'value2'
                                        }
                                    }]
                                },
                                right: [{
                                    operator: '&&',
                                    operand: {
                                        name: 'N_VARIABLE',
                                        variable: 'value3'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'precedence should be higher than a logical AND': {
            code: '$result = $value1 && $value2 & $mask;',
            expectedAST: {
                name: 'N_PROGRAM',
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
                                    variable: 'value1'
                                },
                                right: [{
                                    operator: '&&',
                                    operand: {
                                        name: 'N_EXPRESSION',
                                        left: {
                                            name: 'N_VARIABLE',
                                            variable: 'value2'
                                        },
                                        right: [{
                                            operator: '&',
                                            operand: {
                                                name: 'N_VARIABLE',
                                                variable: 'mask'
                                            }
                                        }]
                                    }
                                }]
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
