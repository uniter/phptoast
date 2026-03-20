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
    phpTools = require('../../../../../tools');

describe('PHP Parser grammar trait statement abstract static method integration', function () {
    var parser;

    beforeEach(function () {
        parser = phpTools.createParser();
    });

    _.each({
        'trait that defines a protected abstract static method': {
            code: nowdoc(function () {/*<<<EOS
<?php
trait MyTrait {
    abstract protected static function myMethod(MyClass $myArg);
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'MyTrait',
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
                                className: 'MyClass'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myArg'
                            }
                        }]
                    }]
                }]
            }
        },
        'trait with one implicitly public abstract static method': {
            code: nowdoc(function () {/*<<<EOS
<?php
trait OneMethod {
    abstract static function myMethod(MyClass $myArg);
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'OneMethod',
                    members: [{
                        name: 'N_ABSTRACT_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        visibility: 'public', // Implicit visibility is public.
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: 'MyClass'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myArg'
                            }
                        }]
                    }]
                }]
            }
        },
        'trait that defines an abstract static method with return type': {
            code: nowdoc(function () {/*<<<EOS
<?php
trait MyTrait {
    abstract protected static function myMethod(MyClass $myArg): MyReturnType;
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'MyTrait',
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
                                className: 'MyClass'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myArg'
                            }
                        }],
                        returnType: {
                            name: 'N_CLASS_TYPE',
                            className: 'MyReturnType'
                        }
                    }]
                }]
            }
        },
        'trait that defines a return-by-reference abstract static method': {
            code: nowdoc(function () {/*<<<EOS
<?php
trait MyTrait {
    abstract protected static function &myMethod(MyClass $myArg);
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'MyTrait',
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
                                className: 'MyClass'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'myArg'
                            }
                        }],
                        returnByReference: true
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            describe(description, function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
