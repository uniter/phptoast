/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    expect = require('chai').expect,
    tools = require('../../../tools');

describe('PHP Parser grammar __DIR__ magic constant expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple echo of current file\'s directory using correct case': {
            code: 'echo __DIR__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expression: {
                        name: 'N_MAGIC_DIR_CONSTANT'
                    }
                }]
            }
        },
        'simple echo of current file\'s directory using weird case': {
            code: 'echo __Dir__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expression: {
                        name: 'N_MAGIC_DIR_CONSTANT'
                    }
                }]
            }
        },
        'assignment of current file\'s directory to variable using correct case': {
            code: '$dir = __DIR__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'dir'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_MAGIC_DIR_CONSTANT'
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
