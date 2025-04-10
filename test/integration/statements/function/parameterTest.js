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

describe('PHP Parser grammar function parameter integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty function definition with one by-reference untyped parameter': {
            code: '<?php function myFunc(&$myParam) : void {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myParam'
                            }
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_VOID_TYPE'
                    }
                }]
            }
        },
        'empty function definition with one by-reference typed parameter': {
            code: '<?php function myFunc(bool &$myParam) : void {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_SCALAR_TYPE',
                            type: 'bool'
                        },
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myParam'
                            }
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_VOID_TYPE'
                    }
                }]
            }
        },
        'empty function definition with one by-value and one by-reference typed parameter': {
            code: '<?php function myFunc(int $yourParam, bool &$myParam) : void {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myFunc'
                    },
                    args: [{
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_SCALAR_TYPE',
                            type: 'int'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'yourParam'
                        }
                    }, {
                        name: 'N_ARGUMENT',
                        type: {
                            name: 'N_SCALAR_TYPE',
                            type: 'bool'
                        },
                        variable: {
                            name: 'N_REFERENCE',
                            operand: {
                                name: 'N_VARIABLE',
                                variable: 'myParam'
                            }
                        }
                    }],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    },
                    returnType: {
                        name: 'N_VOID_TYPE'
                    }
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
