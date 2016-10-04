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

describe('PHP Parser grammar multiplication "*" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'multiplying an integer by a variable': {
            code: 'return 20 * $myMultiplier;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '20'
                        },
                        right: [{
                            operator: '*',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myMultiplier'
                            }
                        }]
                    }
                }]
            }
        },
        'multiplying an integer by two variables': {
            code: 'return 20 * $firstMultiplier * $secondMultiplier;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_INTEGER',
                                number: '20'
                            },
                            right: [{
                                operator: '*',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'firstMultiplier'
                                }
                            }]
                        },
                        right: [{
                            operator: '*',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'secondMultiplier'
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
