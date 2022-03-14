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

describe('PHP Parser grammar bitwise XOR "^" operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'calculating bitwise XOR of 15 and 21': {
            code: 'return 15 ^ 21;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '15'
                        },
                        right: [{
                            operator: '^',
                            operand: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }]
                    }
                }]
            }
        },
        'calculating bitwise XOR of 21, 10 and 99': {
            code: 'return 21 ^ 10 ^ 99;',
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
                                number: '21'
                            },
                            right: [{
                                operator: '^',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '10'
                                }
                            }]
                        },
                        right: [{
                            operator: '^',
                            operand: {
                                name: 'N_INTEGER',
                                number: '99'
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
