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

describe('PHP Parser grammar __CLASS__ magic constant expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple echo of current class using correct case': {
            code: 'echo __CLASS__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_MAGIC_CLASS_CONSTANT'
                    }]
                }]
            }
        },
        'simple echo of current class using weird case': {
            code: 'echo __Class__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_MAGIC_CLASS_CONSTANT'
                    }]
                }]
            }
        },
        'assignment of current class to variable using correct case': {
            code: '$func = __CLASS__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'func'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_MAGIC_CLASS_CONSTANT'
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
