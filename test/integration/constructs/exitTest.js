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

describe('PHP Parser grammar exit(...)/die(...) construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'exit with no status or message, no parentheses': {
            code: 'exit;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXIT'
                    }
                }]
            }
        },
        'exit with no status or message, with parentheses': {
            code: 'exit();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXIT'
                    }
                }]
            }
        },
        'exit with status': {
            code: 'exit(21);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXIT',
                        status: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    }
                }]
            }
        },
        'die with status': {
            code: 'die(21);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXIT',
                        status: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    }
                }]
            }
        },
        'exit with message': {
            code: 'exit("We had to stop.");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXIT',
                        message: {
                            name: 'N_STRING_LITERAL',
                            string: 'We had to stop.'
                        }
                    }
                }]
            }
        },
        'exit inside expression': {
            code: '21 and exit(7);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_INTEGER',
                            number: '21'
                        },
                        right: [{
                            operator: 'and',
                            operand: {
                                name: 'N_EXIT',
                                status: {
                                    name: 'N_INTEGER',
                                    number: '7'
                                }
                            }
                        }]
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
