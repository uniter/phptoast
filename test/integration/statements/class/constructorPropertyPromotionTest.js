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

describe('PHP Parser grammar class constructor property promotion integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'constructor with one promoted public property with scalar type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function __construct(public string $name) {}
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
                            string: '__construct'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            visibility: 'public',
                            type: {
                                name: 'N_SCALAR_TYPE',
                                type: 'string'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'name'
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
        'constructor with one promoted private property with default value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function __construct(private int $count = 21) {}
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
                            string: '__construct'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            visibility: 'private',
                            type: {
                                name: 'N_SCALAR_TYPE',
                                type: 'int'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'count'
                            },
                            value: {
                                name: 'N_INTEGER',
                                number: '21'
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
        'constructor with one promoted readonly public property': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function __construct(public readonly int $id) {}
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
                            string: '__construct'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            visibility: 'public',
                            readonly: true,
                            type: {
                                name: 'N_SCALAR_TYPE',
                                type: 'int'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'id'
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
        'constructor with one promoted readonly-first public property': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function __construct(readonly public int $id) {}
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
                            string: '__construct'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            visibility: 'public',
                            readonly: true,
                            type: {
                                name: 'N_SCALAR_TYPE',
                                type: 'int'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'id'
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
        'constructor with one promoted public property without type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function __construct(public $value) {}
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
                            string: '__construct'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            visibility: 'public',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'value'
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
        'constructor with mixed promoted and regular parameters': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function __construct(public string $name, int $age, private bool $active = true) {}
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
                            string: '__construct'
                        },
                        visibility: 'public',
                        args: [
                            {
                                name: 'N_ARGUMENT',
                                visibility: 'public',
                                type: {
                                    name: 'N_SCALAR_TYPE',
                                    type: 'string'
                                },
                                variable: {
                                    name: 'N_VARIABLE',
                                    variable: 'name'
                                }
                            },
                            {
                                name: 'N_ARGUMENT',
                                type: {
                                    name: 'N_SCALAR_TYPE',
                                    type: 'int'
                                },
                                variable: {
                                    name: 'N_VARIABLE',
                                    variable: 'age'
                                }
                            },
                            {
                                name: 'N_ARGUMENT',
                                visibility: 'private',
                                type: {
                                    name: 'N_SCALAR_TYPE',
                                    type: 'bool'
                                },
                                variable: {
                                    name: 'N_VARIABLE',
                                    variable: 'active'
                                },
                                value: {
                                    name: 'N_BOOLEAN',
                                    bool: true
                                }
                            }
                        ],
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
            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
