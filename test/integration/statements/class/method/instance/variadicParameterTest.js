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
    nowdoc = require('nowdoc'),
    tools = require('../../../../../tools');

describe('PHP Parser grammar instance method variadic parameter integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty method definition with one variadic parameter': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function myMethod(...$args) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            variadic: true,
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'args'
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'empty method definition with one regular parameter and one variadic parameter': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function myMethod($first, ...$args) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'first'
                            }
                        }, {
                            name: 'N_ARGUMENT',
                            variadic: true,
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'args'
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'empty method definition with typed variadic parameter': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function myMethod(array ...$args) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_ARRAY_TYPE'
                            },
                            variadic: true,
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'args'
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'empty method definition with variadic parameter passed by reference': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function myMethod(...&$args) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            variadic: true,
                            variable: {
                                name: 'N_REFERENCE',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'args'
                                }
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
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