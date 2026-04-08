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

describe('PHP Parser grammar interface definition statement static method return type integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'method declaration with "array" return type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public static function doNothing() : array;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [],
                        returnType: {
                            name: 'N_ARRAY_TYPE'
                        }
                    }]
                }]
            }
        },
        'method declaration with unnamespaced class return type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public static function doNothing() : ItemList;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [],
                        returnType: {
                            name: 'N_CLASS_TYPE',
                            className: 'ItemList'
                        }
                    }]
                }]
            }
        },
        'method declaration with namespaced class return type': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public static function doNothing() : \Creator\Framework\Request;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_STATIC_INTERFACE_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [],
                        returnType: {
                            name: 'N_CLASS_TYPE',
                            className: '\\Creator\\Framework\\Request'
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
