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
    phpCommon = require('phpcommon'),
    tools = require('../../tools'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('PHP Parser grammar function call expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple function call': {
            code: 'now();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'now'
                        },
                        args: []
                    }
                }]
            }
        },
        'call to callable': {
            code: '$myCallable();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_VARIABLE',
                            variable: 'myCallable'
                        },
                        args: []
                    }
                }]
            }
        },
        'function call as term in expression with arguments including an expression': {
            code: '$a = doSomething(1, 4 + 2, "test");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'a'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_FUNCTION_CALL',
                                func: {
                                    name: 'N_STRING',
                                    string: 'doSomething'
                                },
                                args: [{
                                    name: 'N_INTEGER',
                                    number: '1'
                                }, {
                                    name: 'N_EXPRESSION',
                                    left: {
                                        name: 'N_INTEGER',
                                        number: '4'
                                    },
                                    right: [{
                                        operator: '+',
                                        operand: {
                                            name: 'N_INTEGER',
                                            number: '2'
                                        }
                                    }]
                                }, {
                                    name: 'N_STRING_LITERAL',
                                    string: 'test'
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'calling function in global namespace with prefixed path': {
            code: '\\now();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: '\\now'
                        },
                        args: []
                    }
                }]
            }
        },
        'function call with one named argument only': {
            code: 'now(myArg: "one");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'now'
                        },
                        args: [],
                        namedArgs: {
                            'myArg': {
                                name: 'N_STRING_LITERAL',
                                string: 'one'
                            }
                        }
                    }
                }]
            }
        },
        'function call with two named arguments only': {
            code: 'now(firstArg: "one", secondArg: "two");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'now'
                        },
                        args: [],
                        namedArgs: {
                            'firstArg': {
                                name: 'N_STRING_LITERAL',
                                string: 'one'
                            },
                            'secondArg': {
                                name: 'N_STRING_LITERAL',
                                string: 'two'
                            }
                        }
                    }
                }]
            }
        },
        'function call with one positional and two named arguments': {
            code: 'now("one", secondArg: "two", thirdArg: "three");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'now'
                        },
                        args: [{
                            name: 'N_STRING_LITERAL',
                            string: 'one'
                        }],
                        namedArgs: {
                            'secondArg': {
                                name: 'N_STRING_LITERAL',
                                string: 'two'
                            },
                            'thirdArg': {
                                name: 'N_STRING_LITERAL',
                                string: 'three'
                            }
                        }
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

    it('should raise a fatal error when a positional argument is provided after a named argument', function () {
        var caughtError;
        parser.getState().setPath('/path/to/my_module.php');

        try {
            parser.parse('<?php \n\nnow(firstArg: "one", "two");');
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('Cannot use positional argument after named argument');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(3);
    });
});
