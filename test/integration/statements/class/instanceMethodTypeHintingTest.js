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

describe('PHP Parser grammar class definition statement instance method type hinting integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty method definition with one "array" type hinted arg but no statements': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Thing {
        public function doNothing(array $items) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Thing',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
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
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'empty method definition with one unnamespaced class type hinted arg but no statements': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Thing {
        public function doNothing(ItemList $items) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Thing',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
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
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }]
            }
        },
        'empty method definition with one namespaced class type hinted arg but no statements': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Thing {
        public function doNothing(\Creator\Framework\Request $items) {}
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Thing',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
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
                        }],
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
