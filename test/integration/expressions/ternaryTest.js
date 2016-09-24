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

describe('PHP Parser grammar ternary expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'ternary with integer operands in void context': {
            code: '21 ? 22 : 23;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        consequent: {
                            name: 'N_INTEGER',
                            number: '22'
                        },
                        alternate: {
                            name: 'N_INTEGER',
                            number: '23'
                        }
                    }
                }]
            }
        },
        'nested ternary inside alternate with integer operands in void context': {
            code: '21 ? 22 : 23 ? 24 : 25;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_TERNARY',
                            condition: {
                                name: 'N_INTEGER',
                                number: '21'
                            },
                            consequent: {
                                name: 'N_INTEGER',
                                number: '22'
                            },
                            alternate: {
                                name: 'N_INTEGER',
                                number: '23'
                            }
                        },
                        consequent: {
                            name: 'N_INTEGER',
                            number: '24'
                        },
                        alternate: {
                            name: 'N_INTEGER',
                            number: '25'
                        }
                    }
                }]
            }
        },
        'nested ternary inside consequent with integer operands in void context': {
            code: '21 ? 22 ? 23 : 24 : 25;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        consequent: {
                            name: 'N_TERNARY',
                            condition: {
                                name: 'N_INTEGER',
                                number: '22'
                            },
                            consequent: {
                                name: 'N_INTEGER',
                                number: '23'
                            },
                            alternate: {
                                name: 'N_INTEGER',
                                number: '24'
                            }
                        },
                        alternate: {
                            name: 'N_INTEGER',
                            number: '25'
                        }
                    }
                }]
            }
        },
        'ternary with comparison in condition': {
            code: '$myVar == 21 ? 22 : 23;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_TERNARY',
                        condition: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'myVar'
                            },
                            right: [{
                                operator: '==',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '21'
                                }
                            }]
                        },
                        consequent: {
                            name: 'N_INTEGER',
                            number: '22'
                        },
                        alternate: {
                            name: 'N_INTEGER',
                            number: '23'
                        }
                    }
                }]
            }
        },
        'shorthand ternary': {
            code: '$myVar = 21 ?: 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_TERNARY',
                                condition: {
                                    name: 'N_INTEGER',
                                    number: '21'
                                },
                                consequent: null,
                                alternate: {
                                    name: 'N_INTEGER',
                                    number: '22'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'shorthand ternary with erratic whitespace': {
            code: '$myVar = 21 ?    : 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_TERNARY',
                                condition: {
                                    name: 'N_INTEGER',
                                    number: '21'
                                },
                                consequent: null,
                                alternate: {
                                    name: 'N_INTEGER',
                                    number: '22'
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
