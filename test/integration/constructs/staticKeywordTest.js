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
    tools = require('../../tools');

describe('PHP Parser grammar "static" (late static bindings) keyword construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        '"static" should be safe to use as a function name': {
            code: '<?php function static() {} static();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'static'
                    },
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }, {
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'static'
                        },
                        args: []
                    }
                }]
            }
        },
        '"static" used to dereference a static class property with no whitespace before the "::" operator': {
            code: nowdoc(function () {/*<<<EOS
<?php
    echo static::$something;
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STATIC_PROPERTY',
                        className: {
                            name: 'N_STATIC'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'something'
                        }
                    }]
                }]
            }
        },
        '"static" used to dereference a static class property with mixed case and whitespace before the "::" operator': {
            code: nowdoc(function () {/*<<<EOS
<?php
    echo sTATic ::$something;
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STATIC_PROPERTY',
                        className: {
                            name: 'N_STATIC'
                        },
                        property: {
                            name: 'N_STRING',
                            string: 'something'
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
