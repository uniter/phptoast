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

describe('PHP Parser grammar function definition statement type hinting integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty function definition with one "array" type hinted arg but no statements': {
            code: 'function doNothing(array $a) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'doNothing'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ARRAY_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'a'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'empty function definition with one "callable" type hinted arg but no statements': {
            code: 'function doNothing(callable $c) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'doNothing'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CALLABLE_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'c'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'empty function definition with one "iterable" type hinted arg but no statements': {
            code: 'function doNothing(iterable $i) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'doNothing'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_ITERABLE_TYPE'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'i'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'empty function definition with one unnamespaced class type hinted arg but no statements': {
            code: 'function doNothing(Response $a) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'doNothing'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CLASS_TYPE',
                            className: 'Response'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'a'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'empty function definition with one namespaced class type hinted arg but no statements': {
            code: 'function doNothing(\\Creator\\Framework\\Request $a) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'doNothing'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_CLASS_TYPE',
                            className: '\\Creator\\Framework\\Request'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'a'
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            var code = '<?php ' + scenario.code;

            // Pretty-print the code strings so any non-printable characters are readable
            describe('when the code is ' + JSON.stringify(code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
