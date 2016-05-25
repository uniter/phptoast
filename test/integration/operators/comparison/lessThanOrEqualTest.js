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

describe('PHP Parser grammar less-than-or-equal "<value> <= <value>" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assigning yoda condition with assignment inside operand to variable': {
            code: '$result = (4 <= $pos = my_func());',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'result'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_INTEGER',
                                    number: '4'
                                },
                                right: [{
                                    operator: '<=',
                                    operand: {
                                        name: 'N_EXPRESSION',
                                        left: {
                                            name: 'N_VARIABLE',
                                            variable: 'pos'
                                        },
                                        right: [{
                                            operator: '=',
                                            operand: {
                                                name: 'N_FUNCTION_CALL',
                                                func: {
                                                    name: 'N_STRING',
                                                    string: 'my_func'
                                                },
                                                args: []
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
