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

describe('PHP Parser grammar __LINE__ magic constant expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple echo of current line using correct case': {
            code: 'echo __LINE__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_MAGIC_LINE_CONSTANT',
                        bounds: {
                            start: {
                                offset: 6 + 5,
                                line: 1,
                                column: 7 + 5
                            },
                            end: {
                                offset: 6 + 13,
                                line: 1,
                                column: 7 + 13
                            }
                        }
                    }]
                }]
            }
        },
        'simple echo of current line using weird case': {
            code: 'echo __LinE__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_MAGIC_LINE_CONSTANT',
                        bounds: {
                            start: {
                                offset: 6 + 5,
                                line: 1,
                                column: 7 + 5
                            },
                            end: {
                                offset: 6 + 13,
                                line: 1,
                                column: 7 + 13
                            }
                        }
                    }]
                }]
            }
        },
        'assignment of current line to variable using correct case': {
            code: '$line = __LINE__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'line'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_MAGIC_LINE_CONSTANT',
                                bounds: {
                                    start: {
                                        offset: 6 + 8,
                                        line: 1,
                                        column: 7 + 8
                                    },
                                    end: {
                                        offset: 6 + 16,
                                        line: 1,
                                        column: 7 + 16
                                    }
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
