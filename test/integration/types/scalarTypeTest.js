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

describe('PHP Parser grammar scalar type integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty function definition with boolean return type': {
            code: 'function myFunc() : bool {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_SCALAR_TYPE',
                        type: 'bool'
                    }
                }]
            }
        },
        'empty function definition with float return type': {
            code: 'function myFunc() : float {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_SCALAR_TYPE',
                        type: 'float'
                    }
                }]
            }
        },
        'empty function definition with integer return type': {
            code: 'function myFunc() : int {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_SCALAR_TYPE',
                        type: 'int'
                    }
                }]
            }
        },
        'empty function definition with string return type': {
            code: 'function myFunc() : string {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_SCALAR_TYPE',
                        type: 'string'
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            var code = '<?php ' + scenario.code;

            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
