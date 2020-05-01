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

describe('PHP Parser grammar scope resolution operator "::" constant integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'reading constant from statically referenced class without namespace prefix': {
            code: 'return MyClass::MY_CONST;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_CLASS_CONSTANT',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        },
                        constant: 'MY_CONST'
                    }
                }]
            }
        },
        'reading constant from instance variable': {
            code: 'return $myObject::MY_CONST;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_CLASS_CONSTANT',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myObject'
                        },
                        constant: 'MY_CONST'
                    }
                }]
            }
        },
        'reading constant from instance method call result': {
            code: 'return $myObject->myMethod()::MY_CONST;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_CLASS_CONSTANT',
                        className: {
                            name: 'N_METHOD_CALL',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'myObject'
                            },
                            calls: [{
                                func: {
                                    name: 'N_STRING',
                                    string: 'myMethod'
                                },
                                args: []
                            }]
                        },
                        constant: 'MY_CONST'
                    }
                }]
            }
        },
        'reading constant from static method call result': {
            code: 'return MyClass::myStaticMethod()::MY_CONST;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_CLASS_CONSTANT',
                        className: {
                            name: 'N_STATIC_METHOD_CALL',
                            className: {
                                name: 'N_STRING',
                                string: 'MyClass'
                            },
                            method: {
                                name: 'N_STRING',
                                string: 'myStaticMethod'
                            },
                            args: []
                        },
                        constant: 'MY_CONST'
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
