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

describe('PHP Parser grammar list(...) construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple assignment to list with one variable of array with one element': {
            code: 'list($value) = array(1);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_LIST',
                            elements: [{
                                name: 'N_VARIABLE',
                                variable: 'value'
                            }]
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_LITERAL',
                                elements: [{
                                    name: 'N_VALUE',
                                    value: {
                                        name: 'N_INTEGER',
                                        number: '1'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to list with three variables of array with three elements': {
            code: 'list($value1, $value2, $value3) = array(3, "me", 6);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_LIST',
                            elements: [{
                                name: 'N_VARIABLE',
                                variable: 'value1'
                            }, {
                                name: 'N_VARIABLE',
                                variable: 'value2'
                            }, {
                                name: 'N_VARIABLE',
                                variable: 'value3'
                            }]
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_LITERAL',
                                elements: [{
                                    name: 'N_VALUE',
                                    value: {
                                        name: 'N_INTEGER',
                                        number: '3'
                                    }
                                }, {
                                    name: 'N_VALUE',
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'me'
                                    }
                                }, {
                                    name: 'N_VALUE',
                                    value: {
                                        name: 'N_INTEGER',
                                        number: '6'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to list with one variable (after skipping first value) of array with two elements': {
            code: 'list(, $value) = array(1);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_LIST',
                            elements: [{
                                name: 'N_VOID',
                                value: ''
                            }, {
                                name: 'N_VARIABLE',
                                variable: 'value'
                            }]
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_LITERAL',
                                elements: [{
                                    name: 'N_VALUE',
                                    value: {
                                        name: 'N_INTEGER',
                                        number: '1'
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
