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

describe('PHP Parser grammar instanceof operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assigning result of <prop> instanceof <bareword> to variable': {
            code: '$isInstance = $myObject->myProp instanceof MyClass;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'isInstance'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INSTANCE_OF',
                                object: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'myObject'
                                    },
                                    properties: [{
                                        property: {
                                            name: 'N_STRING',
                                            string: 'myProp'
                                        }
                                    }]
                                },
                                class: {
                                    name: 'N_STRING',
                                    string: 'MyClass'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'assigning result of nested <prop> instanceof <bareword> instanceof <bareword> to variable': {
            code: '$isInstance = $myObject->myProp instanceof First instanceof Second;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'isInstance'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INSTANCE_OF',
                                object: {
                                    name: 'N_INSTANCE_OF',
                                    object: {
                                        name: 'N_OBJECT_PROPERTY',
                                        object: {
                                            name: 'N_VARIABLE',
                                            variable: 'myObject'
                                        },
                                        properties: [{
                                            property: {
                                                name: 'N_STRING',
                                                string: 'myProp'
                                            }
                                        }]
                                    },
                                    class: {
                                        name: 'N_STRING',
                                        string: 'First'
                                    }
                                },
                                class: {
                                    name: 'N_STRING',
                                    string: 'Second'
                                }
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
