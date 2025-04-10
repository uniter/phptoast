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

describe('PHP Parser grammar instance method return-by-reference integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty method definition with one parameter that returns by reference': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass
    {
        public function &myMethod($myParam): int {}
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
                                variable: 'myParam'
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        },
                        returnByReference: true,
                        returnType: {
                            name: 'N_SCALAR_TYPE',
                            type: 'int'
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
