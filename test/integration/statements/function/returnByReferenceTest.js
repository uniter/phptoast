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

describe('PHP Parser grammar function return-by-reference integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty function definition with one parameter that returns by reference': {
            code: '<?php function &myFunc($myParam) : int {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myParam'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnByReference: true,
                    returnType: {
                        name: 'N_SCALAR_TYPE',
                        type: 'int'
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
