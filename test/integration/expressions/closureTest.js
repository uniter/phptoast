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

describe('PHP Parser grammar closure expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty closure in void context': {
            code: 'function () {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }
                }]
            }
        },
        'empty static closure in void context': {
            code: 'static function () {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: true,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }
                }]
            }
        },
        'empty closure in void context with two bound variables': {
            code: 'function () use ($a, $b) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [{
                            name: 'N_VARIABLE',
                            variable: 'a'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'b'
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }
                }]
            }
        },
        'empty closure in void context with two bound variables, second passed by reference': {
            code: 'function () use ($a, &$b) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [{
                            name: 'N_VARIABLE',
                            variable: 'a'
                        }, {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'b'
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }
                }]
            }
        },
        'empty closure in void context with two parameters': {
            code: 'function ($a, $b) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            }
                        }, {
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'b'
                            }
                        }],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }
                }]
            }
        },
        'empty closure in void context with two parameters, second passed by reference': {
            code: 'function ($a, &$b) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            }
                        }, {
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_REFERENCE',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'b'
                                }
                            }
                        }],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }
                }]
            }
        },
        'closure with one parameter and one body statement assigned to variable': {
            code: '$a = function ($a) echo 1;;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'a'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_CLOSURE',
                                static: false,
                                args: [{
                                    name: 'N_ARGUMENT',
                                    variable: {
                                        name: 'N_VARIABLE',
                                        variable: 'a'
                                    }
                                }],
                                bindings: [],
                                body: {
                                    name: 'N_ECHO_STATEMENT',
                                    expressions: [{
                                        name: 'N_INTEGER',
                                        number: '1'
                                    }]
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'closure with one parameter, one bound variable and one body statement assigned to variable': {
            code: '$a = function ($a) use ($b) echo 1;;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'a'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_CLOSURE',
                                static: false,
                                args: [{
                                    name: 'N_ARGUMENT',
                                    variable: {
                                        name: 'N_VARIABLE',
                                        variable: 'a'
                                    }
                                }],
                                bindings: [{
                                    name: 'N_VARIABLE',
                                    variable: 'b'
                                }],
                                body: {
                                    name: 'N_ECHO_STATEMENT',
                                    expressions: [{
                                        name: 'N_INTEGER',
                                        number: '1'
                                    }]
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
