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

describe('PHP Parser grammar closure expression return type integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty closure in void context with "array" return type': {
            code: 'function () : array {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        },
                        returnType: {
                            name: 'N_ARRAY_TYPE'
                        }
                    }
                }]
            }
        },
        'empty closure in void context with "callable" return type': {
            code: 'function () : callable {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        },
                        returnType: {
                            name: 'N_CALLABLE_TYPE'
                        }
                    }
                }]
            }
        },
        'empty closure in void context with "iterable" return type': {
            code: 'function () : iterable {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        },
                        returnType: {
                            name: 'N_ITERABLE_TYPE'
                        }
                    }
                }]
            }
        },
        'empty closure in void context with unnamespaced class return type': {
            code: 'function () : MyClass {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        },
                        returnType: {
                            name: 'N_CLASS_TYPE',
                            className: 'MyClass'
                        }
                    }
                }]
            }
        },
        'empty closure in void context with namespaced class return type': {
            code: 'function () : My\\Stuff\\StorageClass {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        },
                        returnType: {
                            name: 'N_CLASS_TYPE',
                            className: 'My\\Stuff\\StorageClass'
                        }
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
