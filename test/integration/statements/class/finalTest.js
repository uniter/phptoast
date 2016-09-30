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

describe('PHP Parser grammar final class statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'final empty class': {
            code: '<?php final class MyPerfectClass {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'final',
                    className: 'MyPerfectClass',
                    members: []
                }]
            }
        },
        'final empty class with comments, erratic whitespace and case': {
            code: '<?php    fInAL    /* stuff */    class /* more stuff */  MyPerfectClass{   }  ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'final',
                    className: 'MyPerfectClass',
                    members: []
                }]
            }
        },
        'final instance method with implicit visibility': {
            code: '<?php class MyPerfectClass { final function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'public',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'final instance method with explicit prefixed visibility': {
            code: '<?php class MyPerfectClass { protected final function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'protected',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'final instance method with explicit suffixed visibility': {
            code: '<?php class MyPerfectClass { final protected function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'protected',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'final static method with implicit visibility': {
            code: '<?php class MyPerfectClass { final static function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'public',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'final static method with explicit prefixed visibility': {
            code: '<?php class MyPerfectClass { protected final static function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'protected',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'final static method with explicit suffixed visibility': {
            code: '<?php class MyPerfectClass { final protected static function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'protected',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'final static method with static modifier after final': {
            code: '<?php class MyPerfectClass { final static protected function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'protected',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'final static method with static modifier before final': {
            code: '<?php class MyPerfectClass { static final protected function myMethod() {} }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyPerfectClass',
                    members: [{
                        name: 'N_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        modifier: 'final',
                        visibility: 'protected',
                        args: [],
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
