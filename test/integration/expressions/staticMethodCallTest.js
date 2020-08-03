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

describe('PHP Parser grammar static method call expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple static method call to class in current namespace scope': {
            code: 'MyClass::myMethod();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: []
                    }
                }]
            }
        },
        'static method call to class in global namespace explicitly': {
            code: '\\MyClass::myMethod();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: '\\MyClass'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: []
                    }
                }]
            }
        },
        'static method call of FQCN': {
            code: '\\My\\Space\\MyClass::myMethod();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: '\\My\\Space\\MyClass'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: []
                    }
                }]
            }
        },
        'return of static method call of callable result': {
            code: 'return $myCallable()::myStaticMethod();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_VARIABLE',
                                variable: 'myCallable'
                            },
                            args: []
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myStaticMethod'
                        },
                        args: []
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
