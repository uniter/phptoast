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

describe('PHP Parser grammar closure variadic parameter integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty closure with one variadic parameter': {
            code: '<?php function (...$args) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [{
                            name: 'N_ARGUMENT',
                            variadic: true,
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'args'
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
        'empty closure with one regular parameter and one variadic parameter': {
            code: '<?php function ($first, ...$args) {};',
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
                                variable: 'first'
                            }
                        }, {
                            name: 'N_ARGUMENT',
                            variadic: true,
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'args'
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
        'empty closure with typed variadic parameter': {
            code: '<?php function (array ...$args) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_ARRAY_TYPE'
                            },
                            variadic: true,
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'args'
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
        'empty closure with variadic parameter passed by reference': {
            code: '<?php function (...&$args) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [{
                            name: 'N_ARGUMENT',
                            variadic: true,
                            variable: {
                                name: 'N_REFERENCE',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'args'
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
        }
    }, function (scenario, description) {
        describe(description, function () {
            it('should return the expected AST', function () {
                expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
            });
        });
    });
});
