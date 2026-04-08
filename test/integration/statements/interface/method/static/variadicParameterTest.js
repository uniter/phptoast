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

describe('PHP Parser grammar interface definition statement static method variadic parameter integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'interface static method with one variadic parameter': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public static function myMethod(...$args);
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                        method: {
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
                        }]
                    }]
                }]
            }
        },
        'interface static method with one regular parameter and one variadic parameter': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public static function myMethod($first, ...$args);
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                        method: {
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
                        }]
                    }]
                }]
            }
        },
        'interface static method with typed variadic parameter': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public static function myMethod(array ...$args);
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                        method: {
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
                        }]
                    }]
                }]
            }
        },
        'interface static method with variadic parameter passed by reference': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public static function myMethod(...&$args);
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                        method: {
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
                        }]
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
