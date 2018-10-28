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

describe('PHP Parser grammar class instance property integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'class with one public instance property with default value referencing a class constant': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public $myProp = YourClass::YOUR_CONST;
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
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myProp'
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
        'class with one public instance property with negative integer default value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public $myProp = -21;
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
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myProp'
                        },
                        value: {
                            name: 'N_UNARY_EXPRESSION',
                            operator: '-',
                            prefix: true,
                            operand: {
                                name: 'N_INTEGER',
                                number: '21'
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
