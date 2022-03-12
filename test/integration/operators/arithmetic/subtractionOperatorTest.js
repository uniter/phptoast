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

describe('PHP Parser grammar subtraction "-" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'subtracting a variable from an integer': {
            code: 'return 20 - $mySubtrahend;',
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
                            operator: '-',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'mySubtrahend'
                            }
                        }]
                    }
                }]
            }
        },
        'subtracting two variables from an integer': {
            code: 'return 20 - $firstSubtrahend - $secondSubtrahend;',
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
                                operator: '-',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'firstSubtrahend'
                                }
                            }]
                        },
                        right: [{
                            operator: '-',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'secondSubtrahend'
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
