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

describe('PHP Parser grammar abstract class statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'abstract empty class': {
            code: '<?php abstract class MyBase {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'abstract',
                    className: 'MyBase',
                    members: []
                }]
            }
        },
        'abstract empty class with comments, erratic whitespace and case': {
            code: '<?php    aBstRACt /* rem */       class /* more comments */  MyBase{   }  ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'abstract',
                    className: 'MyBase',
                    members: []
                }]
            }
        },
        'abstract class with abstract instance method': {
            code: nowdoc(function () {/*<<<EOS
<?php
abstract class AbstractMyClass {
    abstract protected function myMethod(MyArg $arg1, YourArg $arg2);
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'abstract',
                    className: 'AbstractMyClass',
                    members: [{
                        name: 'N_ABSTRACT_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        visibility: 'protected',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: 'MyArg'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'arg1'
                            }
                        }, {
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: 'YourArg'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'arg2'
                            }
                        }]
                    }]
                }]
            }
        },
        'abstract class with abstract static method': {
            code: nowdoc(function () {/*<<<EOS
<?php
abstract class AbstractMyClass {
    abstract protected static function myMethod(MyArg $arg1, YourArg $arg2);
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'abstract',
                    className: 'AbstractMyClass',
                    members: [{
                        name: 'N_ABSTRACT_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        visibility: 'protected',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: 'MyArg'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'arg1'
                            }
                        }, {
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: 'YourArg'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'arg2'
                            }
                        }]
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
