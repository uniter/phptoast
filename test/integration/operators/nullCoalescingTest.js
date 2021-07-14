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

describe('PHP Parser grammar null coalescing operator (??) integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'coalesce with integer operands in void context': {
            code: '21 ?? 22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_NULL_COALESCE',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: {
                            name: 'N_INTEGER',
                            number: '22'
                        }
                    }
                }]
            }
        },
        'chained coalesce with integer operands in void context': {
            code: '21 ?? 22 ?? 23;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_NULL_COALESCE',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: {
                            name: 'N_NULL_COALESCE',
                            left: {
                                name: 'N_INTEGER',
                                number: '22'
                            },
                            right: {
                                name: 'N_INTEGER',
                                number: '23'
                            }
                        }
                    }
                }]
            }
        },
        'coalesce with erratic whitespace': {
            code: '21         ??      22;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_NULL_COALESCE',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: {
                            name: 'N_INTEGER',
                            number: '22'
                        }
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
