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

describe('PHP Parser grammar class typed instance property integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'public property with scalar int type and no default value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public int $count;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'public',
                        type: {
                            name: 'N_SCALAR_TYPE',
                            type: 'int'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'count'
                        }
                    }]
                }]
            }
        },
        'private property with scalar string type and default value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        private string $name = '';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'private',
                        type: {
                            name: 'N_SCALAR_TYPE',
                            type: 'string'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'name'
                        },
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: ''
                        }
                    }]
                }]
            }
        },
        'protected property with class type and no default value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        protected MyDependency $dep;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'protected',
                        type: {
                            name: 'N_CLASS_TYPE',
                            className: 'MyDependency'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'dep'
                        }
                    }]
                }]
            }
        },
        'public readonly property with scalar int type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public readonly int $id;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
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
                    }]
                }]
            }
        },
        'readonly-first property with scalar string type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        readonly public string $label;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'public',
                        readonly: true,
                        type: {
                            name: 'N_SCALAR_TYPE',
                            type: 'string'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'label'
                        }
                    }]
                }]
            }
        },
        'public property with nullable class type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public ?MyDependency $dep;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'public',
                        type: {
                            name: 'N_UNION_TYPE',
                            types: [
                                {
                                    name: 'N_CLASS_TYPE',
                                    className: 'MyDependency'
                                },
                                {
                                    name: 'N_NULL_TYPE'
                                }
                            ]
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'dep'
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
