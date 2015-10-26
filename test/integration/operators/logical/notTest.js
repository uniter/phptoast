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

describe('PHP Parser grammar logical Not "! <value>" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assigning Not of variable value to another variable': {
            code: '$inverse = !$value;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'inverse'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_UNARY_EXPRESSION',
                                operator: '!',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'value'
                                },
                                prefix: true
                            }
                        }]
                    }
                }]
            }
        },
        'assigning Not of integer to object property': {
            code: '$object->inverse = !7;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'object'
                            },
                            properties: [{
                                property: {
                                    name: 'N_STRING',
                                    string: 'inverse'
                                }
                            }]
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_UNARY_EXPRESSION',
                                operator: '!',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '7'
                                },
                                prefix: true
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
