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

describe('PHP Parser grammar number literal expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'return of positive integer literal': {
            code: 'return 21;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '21'
                    }
                }]
            }
        },
        'return of negative integer literal': {
            code: 'return -27;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_UNARY_EXPRESSION',
                        operator: '-',
                        prefix: true,
                        operand: {
                            name: 'N_INTEGER',
                            number: '27'
                        }
                    }
                }]
            }
        },
        'return of integer literal that is outside the range JavaScript/IEEE 754 can handle': {
            code: 'return 10000000000000001;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '10000000000000001'
                    }
                }]
            }
        },
        'return of hexadecimal literal with lowercase x': {
            code: 'return 0x21;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '33'
                    }
                }]
            }
        },
        'return of hexadecimal literal with uppercase x and letter digits of mixed case': {
            code: 'return 0XAbCD;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '43981'
                    }
                }]
            }
        },
        'return of octal literal': {
            code: 'return 034;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_INTEGER',
                        number: '28'
                    }
                }]
            }
        },
        'return of float literal': {
            code: 'return 1002.7;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_FLOAT',
                        number: '1002.7'
                    }
                }]
            }
        },
        'return of float literal with leading zero omitted': {
            code: 'return .7654;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_FLOAT',
                        number: '.7654'
                    }
                }]
            }
        },
        'return of positive lowercase float exponent literal': {
            code: 'return 5e-3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_FLOAT',
                        number: '5e-3'
                    }
                }]
            }
        },
        'return of negative uppercase float exponent literal': {
            code: 'return -5E-3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_UNARY_EXPRESSION',
                        operator: '-',
                        prefix: true,
                        operand: {
                            name: 'N_FLOAT',
                            number: '5E-3'
                        }
                    }
                }]
            }
        },
        'return of positive lowercase explicitly integer exponent literal': {
            code: 'return 5e+3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_FLOAT',
                        number: '5e+3'
                    }
                }]
            }
        },
        'return of negative uppercase explicitly integer exponent literal': {
            code: 'return -5E+3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_UNARY_EXPRESSION',
                        operator: '-',
                        prefix: true,
                        operand: {
                            name: 'N_FLOAT',
                            number: '5E+3'
                        }
                    }
                }]
            }
        },
        'return of positive lowercase implicitly integer exponent literal': {
            code: 'return 5e3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_FLOAT',
                        number: '5e3'
                    }
                }]
            }
        },
        'return of negative uppercase implicitly integer exponent literal': {
            code: 'return -5E3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_UNARY_EXPRESSION',
                        operator: '-',
                        prefix: true,
                        operand: {
                            name: 'N_FLOAT',
                            number: '5E3'
                        }
                    }
                }]
            }
        },
        'return of float literal with exponent in addition to dot': {
            code: 'return 1.2e4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_FLOAT',
                        number: '1.2e4'
                    }
                }]
            }
        },
        'return of negative float literal with uppercase exponent in addition to dot': {
            code: 'return -7.2E6;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_UNARY_EXPRESSION',
                        operator: '-',
                        prefix: true,
                        operand: {
                            name: 'N_FLOAT',
                            number: '7.2E6'
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
