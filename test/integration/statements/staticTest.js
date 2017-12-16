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
    tools = require('../../tools');

describe('PHP Parser grammar static variable scope statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'declaring in the global scope with no initial value (null)': {
            code: '<?php static $myVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_STATIC_STATEMENT',
                    variables: [{
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        }
                    }]
                }]
            }
        },
        'declaring in the global scope with an initialiser': {
            code: '<?php static $myVar = 4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_STATIC_STATEMENT',
                    variables: [{
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        initialiser: {
                            name: 'N_INTEGER',
                            number: '4'
                        }
                    }]
                }]
            }
        },
        'declaring two variables in the global scope': {
            code: '<?php static $myVar = 21, $anotherVar = 104;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_STATIC_STATEMENT',
                    variables: [{
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        },
                        initialiser: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    }, {
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'anotherVar'
                        },
                        initialiser: {
                            name: 'N_INTEGER',
                            number: '104'
                        }
                    }]
                }]
            }
        },
        'declaring inside a function with an initialiser': {
            code: '<?php function myFunc() { static $myVar = 21; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [
                    {
                        name: 'N_FUNCTION_STATEMENT',
                        func: {
                            name: 'N_STRING',
                            string: 'myFunc'
                        },
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [
                                {
                                    name: 'N_STATIC_STATEMENT',
                                    variables: [
                                        {
                                            initialiser: {
                                                name: 'N_INTEGER',
                                                number: '21'
                                            },
                                            variable: {
                                                name: 'N_VARIABLE',
                                                variable: 'myVar'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
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
