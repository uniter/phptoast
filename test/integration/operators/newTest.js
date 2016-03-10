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
                                }
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
                                    }
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
                                }
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
                                    properties: [{
                                        property: {
                                            name: 'N_STRING',
                                            string: 'className'
                                        }
                                    }]
                                }
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
                                    properties: [{
                                        property: {
                                            name: 'N_STRING',
                                            string: 'className'
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
                                    }
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
