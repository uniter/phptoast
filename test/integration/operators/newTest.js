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

describe('PHP Parser grammar new operator integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'creating instance of class with name specified statically and no argument brackets': {
            code: '$object = new Worker;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: 'Worker'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'creating instance of class with name specified statically and with argument brackets': {
            code: '$object = new Worker();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: 'Worker'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'creating instance of class with name specified statically and one positional argument': {
            code: '$object = new Worker(21);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: 'Worker'
                                },
                                args: [{
                                    name: 'N_INTEGER',
                                    number: '21'
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'creating instance of class with name specified statically and two positional arguments': {
            code: '$object = new Worker(21, 42);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: 'Worker'
                                },
                                args: [{
                                    name: 'N_INTEGER',
                                    number: '21'
                                }, {
                                    name: 'N_INTEGER',
                                    number: '42'
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'creating instance of class with name specified statically and one named argument': {
            code: '$object = new Worker(myParam: 21);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: 'Worker'
                                },
                                args: [],
                                namedArgs: {
                                    myParam: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'creating instance of class with name specified statically, one positional and one named argument': {
            code: '$object = new Worker(21, myParam: 21);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: 'Worker'
                                },
                                args: [{
                                    name: 'N_INTEGER',
                                    number: '21'
                                }],
                                namedArgs: {
                                    myParam: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'referring to class in global namespace from sub-namespace': {
            code: 'namespace Fun; $object = new \\stdClass;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Fun',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_VARIABLE',
                                variable: 'object'
                            },
                            right: [{
                                operator: '=',
                                operand: {
                                    name: 'N_NEW_EXPRESSION',
                                    className: {
                                        name: 'N_STRING',
                                        string: '\\stdClass'
                                    },
                                    args: []
                                }
                            }]
                        }
                    }]
                }]
            }
        },
        'referring to class in global namespace with parentheses': {
            code: '$object = new \\stdClass();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: '\\stdClass'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'referring to class in global namespace with "new" keyword touching namespace path and with parentheses': {
            code: '$object = new\\stdClass();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STRING',
                                    string: '\\stdClass'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating class from variable': {
            code: '$object = new $className;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_VARIABLE',
                                    variable: 'className'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating class from object property': {
            code: '$object = new $myObject->className;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'myObject'
                                    },
                                    property: {
                                        name: 'N_STRING',
                                        string: 'className'
                                    }
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating class from object property with arguments': {
            code: '$object = new $myObject->className(21);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'myObject'
                                    },
                                    property: {
                                        name: 'N_STRING',
                                        string: 'className'
                                    }
                                },
                                args: [{
                                    name: 'N_INTEGER',
                                    number: '21'
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating class from static name inside addition': {
            code: '$object = new MyClass + 21;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_NEW_EXPRESSION',
                                    className: {
                                        name: 'N_STRING',
                                        string: 'MyClass'
                                    },
                                    args: []
                                },
                                right: [{
                                    operator: '+',
                                    operand: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }]
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating the current class': {
            code: '$object = new self();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_SELF'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating the current class with no argument list': {
            code: '$object = new self;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_SELF'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating the called class': {
            code: '$object = new static();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STATIC'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        },
        'instantiating the called class with no argument list': {
            code: '$object = new static;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'object'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_NEW_EXPRESSION',
                                className: {
                                    name: 'N_STATIC'
                                },
                                args: []
                            }
                        }]
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            var code = '<?php ' + scenario.code;

            // Pretty-print the code strings so any non-printable characters are readable.
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
            parser.parse('<?php \n\n\n$myVar = new MyClass(firstArg: "one", "two");');
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('Cannot use positional argument after named argument');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(4);
    });
});
