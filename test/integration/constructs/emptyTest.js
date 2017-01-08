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

describe('PHP Parser grammar empty(...) construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'with one variable': {
            code: '$is_empty = empty($a_var);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'is_empty'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EMPTY',
                                variable: {
                                    name: 'N_VARIABLE',
                                    variable: 'a_var'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'with array index': {
            code: '$is_empty = empty($an_array[8]);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'is_empty'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EMPTY',
                                variable: {
                                    name: 'N_ARRAY_INDEX',
                                    array: {
                                        name: 'N_VARIABLE',
                                        variable: 'an_array'
                                    },
                                    indices: [{
                                        index: {
                                            name: 'N_INTEGER',
                                            number: '8'
                                        }
                                    }]
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'with object property': {
            code: '$is_empty = empty($an_object->prop);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'is_empty'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EMPTY',
                                variable: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'an_object'
                                    },
                                    properties: [{
                                        property: {
                                            name: 'N_STRING',
                                            string: 'prop'
                                        }
                                    }]
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'with non-variable expression (PHP 5.5+)': {
             code: '$is_empty = empty(myFunc());',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'is_empty'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EMPTY',
                                variable: {
                                    name: 'N_FUNCTION_CALL',
                                    func: {
                                        name: 'N_STRING',
                                        string: 'myFunc'
                                    },
                                    args: []
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
