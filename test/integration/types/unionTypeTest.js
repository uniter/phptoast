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

describe('PHP Parser grammar union type integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        // Note that technically this program will always be invalid as the function would return null.
        'empty function definition with union of both "array" and "iterable" return types': {
            code: 'function myFunc() : array|iterable {}',
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
                        name: 'N_UNION_TYPE',
                        types: [
                            { name: 'N_ARRAY_TYPE' },
                            { name: 'N_ITERABLE_TYPE' }
                        ]
                    }
                }]
            }
        },
        'empty function definition with union of both "callable" and a namespaced class return types': {
            code: 'function myFunc() : callable|My\\Stuff\\MyClass {}',
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
                        name: 'N_UNION_TYPE',
                        types: [
                            { name: 'N_CALLABLE_TYPE' },
                            {
                                name: 'N_CLASS_TYPE',
                                className: 'My\\Stuff\\MyClass'
                            }
                        ]
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
