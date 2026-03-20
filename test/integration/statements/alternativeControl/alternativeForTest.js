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

describe('PHP Parser grammar alternative for loop statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple alternative for loop': {
            code: '<?php for ($i = 0; $i < 10; $i++): echo $i; endfor;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOR_STATEMENT',
                    initializer: {
                        name: 'N_COMMA_EXPRESSION',
                        expressions: [{
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'i'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '0'
                                }
                            }]
                        }]
                    },
                    condition: {
                        name: 'N_COMMA_EXPRESSION',
                        expressions: [{
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'i'
                            },
                            right: [{
                                operator: '<',
                                operand: {
                                    name: 'N_INTEGER',
                                    number: '10'
                                }
                            }]
                        }],
                    },
                    update: {
                        name: 'N_COMMA_EXPRESSION',
                        expressions: [{
                            name: 'N_UNARY_EXPRESSION',
                            operator: '++',
                            prefix: false,
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'i'
                            }
                        }],
                    },
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_VARIABLE',
                            variable: 'i'
                        }]
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            var code = scenario.code;

            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
