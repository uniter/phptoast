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
    tools = require('../../../tools');

describe('PHP Parser grammar class definition statement instance method default argument value integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty method definition with argument with no type hint but a default value of null': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Thing {
        public function doNothing($items = null) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Thing',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'items'
                            },
                            value: {
                                name: 'N_NULL'
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
        'empty method definition with "array" type hinted argument with a default value of 7': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Thing {
        public function doNothing(array $items = 7) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Thing',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_ARRAY_TYPE'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'items'
                            },
                            value: {
                                name: 'N_INTEGER',
                                number: '7'
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
        'method definition with untyped parameter default value that references a class constant': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Thing {
        const MY_CONST = 21;

        public function doNothing($myParam = self::MY_CONST) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Thing',
                    members: [{
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'MY_CONST',
                            value: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }]
                    }, {
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myParam'
                            },
                            value: {
                                name: 'N_CLASS_CONSTANT',
                                className: {
                                    name: 'N_SELF'
                                },
                                constant: 'MY_CONST'
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
        'method definition with typed parameter default value that references a class constant': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Thing {
        const MY_CONST = 21;

        public function doNothing(MyClass $myParam = self::MY_CONST) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Thing',
                    members: [{
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'MY_CONST',
                            value: {
                                name: 'N_INTEGER',
                                number: '21'
                            }
                        }]
                    }, {
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: 'MyClass'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myParam'
                            },
                            value: {
                                name: 'N_CLASS_CONSTANT',
                                className: {
                                    name: 'N_SELF'
                                },
                                constant: 'MY_CONST'
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
            // Pretty-print the code strings so any non-printable characters are readable
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
