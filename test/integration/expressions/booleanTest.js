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

describe('PHP Parser grammar boolean expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assigning boolean true with non-lower case to variable': {
            code: '$myBoolean = tRue;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myBoolean'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_BOOLEAN',
                                bool: true
                            }
                        }]
                    }
                }]
            }
        },
        'assigning boolean false with non-lower case to variable': {
            code: '$myBoolean = fAlse;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'myBoolean'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_BOOLEAN',
                                bool: false
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
