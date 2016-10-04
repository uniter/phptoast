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

describe('PHP Parser grammar division "/" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'dividing an integer by a variable': {
            code: 'return 20 / $myDivisor;',
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
                            operator: '/',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myDivisor'
                            }
                        }]
                    }
                }]
            }
        },
        'dividing an integer by two variables': {
            code: 'return 20 / $firstDivisor / $secondDivisor;',
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
                                operator: '/',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'firstDivisor'
                                }
                            }]
                        },
                        right: [{
                            operator: '/',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'secondDivisor'
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
