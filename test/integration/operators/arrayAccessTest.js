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

describe('PHP Parser grammar array access operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple numeric index read': {
            code: '$a = $elements[0];',
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
                                name: 'N_ARRAY_INDEX',
                                array: {
                                    name: 'N_VARIABLE',
                                    variable: 'elements'
                                },
                                indices: [{
                                    index: {
                                        name: 'N_INTEGER',
                                        number: '0'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'simple numeric index assignment': {
            code: '$elements[2] = 4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'elements'
                            },
                            indices: [{
                                index: {
                                    name: 'N_INTEGER',
                                    number: '2'
                                }
                            }]
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '4'
                            }
                        }]
                    }
                }]
            }
        },
        'numeric index assignment to array in property': {
            code: '$object->prop[2] = 4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_OBJECT_PROPERTY',
                                object: {
                                    name: 'N_VARIABLE',
                                    variable: 'object'
                                },
                                properties: [{
                                    property: {
                                        name: 'N_STRING',
                                        string: 'prop'
                                    }
                                }]
                            },
                            indices: [{
                                index: {
                                    name: 'N_INTEGER',
                                    number: '2'
                                }
                            }]
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '4'
                            }
                        }]
                    }
                }]
            }
        },
        'pushing integer onto array variable': {
            code: '$array[] = 6;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'array'
                            },
                            indices: true
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '6'
                            }
                        }]
                    }
                }]
            }
        },
        'pushing integer onto array variable with comment embedded in brackets': {
            code: '$array[/* I should be ignored */] = 5;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'array'
                            },
                            indices: true
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '5'
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
