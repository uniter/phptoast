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
    tools = require('../../../tools'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('PHP Parser grammar object access operator "->" instance method call integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'call to statically referenced instance method with no arguments': {
            code: '$obj->doSomething();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'obj'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'doSomething'
                        },
                        args: []
                    }
                }]
            }
        },
        'call to statically referenced instance method called "eval"': {
            code: '$obj->eval("not some PHP code");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'obj'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'eval'
                        },
                        args: [{
                            name: 'N_STRING_LITERAL',
                            string: 'not some PHP code'
                        }]
                    }
                }]
            }
        },
        'call to instance method with one positional and one named argument': {
            code: '$obj->myMethod(21, myParam: "test");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'obj'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '21'
                        }],
                        namedArgs: {
                            'myParam': {
                                name: 'N_STRING_LITERAL',
                                string: 'test'
                            }
                        }
                    }
                }]
            }
        },
        'call to dynamically referenced instance method with no arguments': {
            code: '$obj->$methodName();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'obj'
                        },
                        method: {
                            name: 'N_VARIABLE',
                            variable: 'methodName'
                        },
                        args: []
                    }
                }]
            }
        },
        'call to complex-dynamically referenced instance method with no arguments': {
            code: '$obj->{$firstVar . $secondVar}(21);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'obj'
                        },
                        method: {
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'firstVar'
                            },
                            name: 'N_EXPRESSION',
                            right: [{
                                operator: '.',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'secondVar'
                                }
                            }]
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '21'
                        }]
                    }
                }]
            }
        },
        'call to statically referenced method of object returned by closure call': {
            code: '$getObj()->doSomething();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_VARIABLE',
                                variable: 'getObj'
                            },
                            args: []
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'doSomething'
                        },
                        args: []
                    }
                }]
            }
        },
        'call to statically referenced method of array element': {
            code: '$obj[4]->doSomething();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'obj'
                            },
                            index: {
                                name: 'N_INTEGER',
                                number: '4'
                            }
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'doSomething'
                        },
                        args: []
                    }
                }]
            }
        },
        'call to statically referenced method of statically referenced property': {
            code: '$obj->prop->doSomething();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'obj'
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'prop'
                            }
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'doSomething'
                        },
                        args: []
                    }
                }]
            }
        },
        'call to method of property with named argument': {
            code: '$obj->prop->doSomething(myParam: "my arg");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'obj'
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'prop'
                            }
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'doSomething'
                        },
                        args: [],
                        namedArgs: {
                            'myParam': {
                                name: 'N_STRING_LITERAL',
                                string: 'my arg'
                            }
                        }
                    }
                }]
            }
        },
        'call to method with complex expression as named argument': {
            code: '$obj->myMethod(myParam: 10 + 5);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_METHOD_CALL',
                        object: {
                            name: 'N_VARIABLE',
                            variable: 'obj'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [],
                        namedArgs: {
                            'myParam': {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_INTEGER',
                                    number: '10'
                                },
                                right: [{
                                    operator: '+',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '5'
                                    }
                                }]
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
            parser.parse('<?php \n\n$obj->doSomething(firstArg: "one", "two");');
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
