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

describe('PHP Parser grammar __TRAIT__ magic constant expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple echo of current trait using correct case': {
            code: '<?php echo __TRAIT__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_MAGIC_TRAIT_CONSTANT'
                    }]
                }]
            }
        },
        'simple echo of current trait using weird case': {
            code: '<?php echo __Trait__;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_MAGIC_TRAIT_CONSTANT'
                    }]
                }]
            }
        },
        'assignment of current trait to variable using correct case': {
            code: '<?php $func = __TRAIT__;',
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
                                name: 'N_MAGIC_TRAIT_CONSTANT'
                            }
                        }]
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            it('should return the expected AST', function () {
                expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
            });
        });
    });
});
