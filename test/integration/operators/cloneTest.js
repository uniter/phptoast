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

describe('PHP Parser grammar clone operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'returning a clone of a variable': {
            code: 'return clone $sourceVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_CLONE_EXPRESSION',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'sourceVar'
                        }
                    }
                }]
            }
        },
        'assigning a clone of a variable to another variable': {
            code: '$targetVar = clone $sourceVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'targetVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_CLONE_EXPRESSION',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'sourceVar'
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
