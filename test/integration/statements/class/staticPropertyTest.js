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

describe('PHP Parser grammar class statement static property integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'class with a single public static suffixed property with no value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class OneProperty {
        public static $name;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'OneProperty',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'name'
                        }
                    }]
                }]
            }
        },
        'class with a single public static suffixed property with a string value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class OneProperty {
        public static $job = 'Engineer';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'OneProperty',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'job'
                        },
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: 'Engineer'
                        }
                    }]
                }]
            }
        },
        'class with a single public static prefixed property with no value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class OneProperty {
        static public $name;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'OneProperty',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'name'
                        }
                    }]
                }]
            }
        },
        'class with a single public static prefixed property with a string value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class OneProperty {
        static public $job = 'Engineer';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'OneProperty',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'job'
                        },
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: 'Engineer'
                        }
                    }]
                }]
            }
        },
        'class with a single implicitly public static prefixed property with no value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class OneProperty {
        static $name;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'OneProperty',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'name'
                        }
                    }]
                }]
            }
        },
        'class with a single implicitly public static prefixed property with a string value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class OneProperty {
        static $job = 'Engineer';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'OneProperty',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'job'
                        },
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: 'Engineer'
                        }
                    }]
                }]
            }
        },
        'class with one public static property with default value referencing a class constant': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public static $myStaticProp = YourClass::YOUR_CONST;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myStaticProp'
                        },
                        value: {
                            name: 'N_CLASS_CONSTANT',
                            className: {
                                name: 'N_STRING',
                                string: 'YourClass'
                            },
                            constant: 'YOUR_CONST'
                        }
                    }]
                }]
            }
        },
        'class with one public static property with negative integer default value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public static $myStaticProp = -101;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_STATIC_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myStaticProp'
                        },
                        value: {
                            name: 'N_UNARY_EXPRESSION',
                            operator: '-',
                            prefix: true,
                            operand: {
                                name: 'N_INTEGER',
                                number: '101'
                            }
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
