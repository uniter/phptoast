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

describe('PHP Parser grammar assignment on rhs of binary operation integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'addition': {
            code: '21 + $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '+',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'subtraction': {
            code: '21 - $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '-',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'multiplication': {
            code: '21 * $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '*',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'division': {
            code: '21 / $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '/',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'modulo': {
            code: '21 % $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '%',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'bitwise AND': {
            code: '21 & $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '&',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'bitwise OR': {
            code: '21 | $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '|',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'bitwise XOR': {
            code: '21 ^ $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '^',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'bitwise left-shift': {
            code: '21 << $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '<<',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'bitwise right-shift': {
            code: '21 >> $myVar = 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: '>>',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'myVar'
                                },
                                right: [{
                                    operator: '=',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '22'
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
