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

describe('PHP Parser grammar print expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'printing integer value': {
            code: 'print 2;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_PRINT_EXPRESSION',
                        operand: {
                            name: 'N_INTEGER',
                            number: '2'
                        }
                    }
                }]
            }
        },
        'print has lower precedence than assignment "=" operator': {
            code: 'print $a = 4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        // Assignment has higher precedence so binds the $a and '4'
                        name: 'N_PRINT_EXPRESSION',
                        operand: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '4'
                                }
                            }]
                        }
                    }
                }]
            }
        },
        'print has higher precedence than logical "and" operator': {
            code: 'print 2 and 4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            // Print has higher precedence so binds to the '2'
                            name: 'N_PRINT_EXPRESSION',
                            operand: {
                                name: 'N_INTEGER',
                                number: '2'
                            }
                        },
                        right: [{
                            operator: 'and',
                            operand: {
                                name: 'N_INTEGER',
                                number: '4'
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
