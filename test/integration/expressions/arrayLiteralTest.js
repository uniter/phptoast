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

describe('PHP Parser grammar array literal expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'array with one associative element': {
            code: '$array = array("a" => "b");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'array'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_LITERAL',
                                elements: [{
                                    name: 'N_KEY_VALUE_PAIR',
                                    key: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'a'
                                    },
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'b'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'short array syntax with one associative element assigned to variable': {
            code: '$array = ["a" => "b"];',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'array'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_LITERAL',
                                elements: [{
                                    name: 'N_KEY_VALUE_PAIR',
                                    key: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'a'
                                    },
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'b'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'dereferencing element of short array literal': {
            code: '$value = [21][0];',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'value'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_INDEX',
                                array: {
                                    name: 'N_ARRAY_LITERAL',
                                    elements: [{
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }]
                                },
                                indices: [{index: {
                                    name: 'N_INTEGER',
                                    number: '0'
                                }}]
                            }
                        }]
                    }
                }]
            }
        },
        'short array syntax with one indexed element using variable reference': {
            code: '$array = [&$myVar];',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'array'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_LITERAL',
                                elements: [{
                                    name: 'N_REFERENCE',
                                    operand: {
                                        name: 'N_VARIABLE',
                                        variable: 'myVar'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'short array syntax with one indexed element using instance property reference': {
            code: '$array = [&$myObj->myProp];',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'array'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_ARRAY_LITERAL',
                                elements: [{
                                    name: 'N_REFERENCE',
                                    operand: {
                                        name: 'N_OBJECT_PROPERTY',
                                        object: {
                                            name: 'N_VARIABLE',
                                            variable: 'myObj'
                                        },
                                        properties: [{
                                            property: {
                                                name: 'N_STRING',
                                                string: 'myProp'
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
