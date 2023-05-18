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

describe('PHP Parser grammar generator function statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'declaring a generator that yields only values': {
            code: '<?php function myGenerator() { yield "first"; print "middle"; yield "last"; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myGenerator'
                    },
                    generator: true,
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_YIELD_EXPRESSION',
                                value: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'first'
                                }
                            }
                        }, {
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_PRINT_EXPRESSION',
                                operand: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'middle'
                                }
                            }
                        }, {
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_YIELD_EXPRESSION',
                                value: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'last'
                                }
                            }
                        }]
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
