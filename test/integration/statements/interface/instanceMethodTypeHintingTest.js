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

describe('PHP Parser grammar interface definition statement instance method type hinting integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'method definition with one "array" type hinted arg but no statements': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public function doNothing(array $items);
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_INTERFACE_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_ARRAY_TYPE'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'items'
                            }
                        }]
                    }]
                }]
            }
        },
        'method definition with one unnamespaced interface type hinted arg but no statements': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public function doNothing(ItemList $items);
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_INTERFACE_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: 'ItemList'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'items'
                            }
                        }]
                    }]
                }]
            }
        },
        'method definition with one namespaced interface type hinted arg but no statements': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Thing {
        public function doNothing(\Creator\Framework\Request $items);
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Thing',
                    members: [{
                        name: 'N_INTERFACE_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'doNothing'
                        },
                        visibility: 'public',
                        args: [{
                            name: 'N_ARGUMENT',
                            type: {
                                name: 'N_CLASS_TYPE',
                                className: '\\Creator\\Framework\\Request'
                            },
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'items'
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
