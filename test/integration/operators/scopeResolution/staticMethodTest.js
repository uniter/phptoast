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

describe('PHP Parser grammar scope resolution operator "::" static method integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'calling statically referenced static method of statically referenced class without namespace prefix': {
            code: 'MyClass::myMethod(7);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '7'
                        }]
                    }
                }]
            }
        },
        'calling static method with one named argument': {
            code: 'MyClass::myMethod(myParam: "my value");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [],
                        namedArgs: {
                            'myParam': {
                                name: 'N_STRING_LITERAL',
                                string: 'my value'
                            }
                        }
                    }
                }]
            }
        },
        'calling static method with multiple named arguments': {
            code: 'MyClass::myMethod(first: "one", second: "two");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [],
                        namedArgs: {
                            'first': {
                                name: 'N_STRING_LITERAL',
                                string: 'one'
                            },
                            'second': {
                                name: 'N_STRING_LITERAL',
                                string: 'two'
                            }
                        }
                    }
                }]
            }
        },
        'calling statically referenced static method of statically referenced class with namespace prefix': {
            code: '\\My\\Awesome\\Stuff::myMethod(6);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: '\\My\\Awesome\\Stuff'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '6'
                        }]
                    }
                }]
            }
        },
        'calling static method with one positional and one named argument': {
            code: '\\My\\Awesome\\Stuff::myMethod(21, myParam: "my value");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: '\\My\\Awesome\\Stuff'
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
                                string: 'my value'
                            }
                        }
                    }
                }]
            }
        },
        'calling statically referenced static method of dynamically referenced class stored in variable': {
            code: '$myClassName::myMethod(5);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClassName'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '5'
                        }]
                    }
                }]
            }
        },
        'calling static method of dynamically referenced class with named arguments': {
            code: '$myClassName::myMethod(myParam: "my value");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClassName'
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [],
                        namedArgs: {
                            'myParam': {
                                name: 'N_STRING_LITERAL',
                                string: 'my value'
                            }
                        }
                    }
                }]
            }
        },
        'calling statically referenced static method of dynamically referenced class stored at array index': {
            code: '$classes[7]::myMethod(5);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'classes'
                            },
                            index: {
                                name: 'N_INTEGER',
                                number: '7'
                            }
                        },
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '5'
                        }]
                    }
                }]
            }
        },
        'calling dynamically ($...) referenced static method of dynamically referenced class stored in variable': {
            code: '$myClass::$myMethodName(4);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClass'
                        },
                        method: {
                            name: 'N_VARIABLE',
                            variable: 'myMethodName'
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }
                }]
            }
        },
        'calling dynamically (${$...}) referenced static method with name referenced by variable variable': {
            code: '$myClass::${$myMethodVariableName}(4);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClass'
                        },
                        method: {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_VARIABLE',
                                variable: 'myMethodVariableName'
                            }
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }
                }]
            }
        },
        'calling dynamically (${...}) referenced static method with name referenced by variable variable': {
            code: '$myClass::${"variable name"}(4);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClass'
                        },
                        method: {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_STRING_LITERAL',
                                string: 'variable name'
                            }
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }
                }]
            }
        },
        'calling dynamically (${<expr>}) referenced static method with name referenced by variable variable': {
            code: '$myClass::${"my" . "variable"}(4);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_VARIABLE',
                            variable: 'myClass'
                        },
                        method: {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'my'
                                },
                                right: [{
                                    operator: '.',
                                    operand: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'variable'
                                    }
                                }]
                            }
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }
                }]
            }
        },
        'calling dynamically ({<expr>}) referenced static method with name referenced by expression': {
            code: 'MyClass::{"my" . "StaticMethod"}(4);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        },
                        method: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_STRING_LITERAL',
                                string: 'my'
                            },
                            right: [{
                                operator: '.',
                                operand: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'StaticMethod'
                                }
                            }]
                        },
                        args: [{
                            name: 'N_INTEGER',
                            number: '4'
                        }]
                    }
                }]
            }
        },
        'calling dynamically referenced static method with named arguments': {
            code: 'MyClass::{"myMethod"}(myParam: "my value");',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
                        },
                        method: {
                            name: 'N_STRING_LITERAL',
                            string: 'myMethod'
                        },
                        args: [],
                        namedArgs: {
                            'myParam': {
                                name: 'N_STRING_LITERAL',
                                string: 'my value'
                            }
                        }
                    }
                }]
            }
        },
        'calling static method with complex expression as named argument': {
            code: 'MyClass::myMethod(myParam: 10 + 5);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_STATIC_METHOD_CALL',
                        className: {
                            name: 'N_STRING',
                            string: 'MyClass'
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
            parser.parse('<?php \n\nMyClass::myMethod(firstArg: "one", "two");');
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
