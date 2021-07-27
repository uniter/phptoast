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

describe('PHP Parser grammar object access operator "->" instance property integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'assignment to statically referenced property of object': {
            code: '$anObject->prop = 7;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'anObject'
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'prop'
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '7'
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to statically referenced property of object stored at array index': {
            code: '$anArray[3]->aProp = 6;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_ARRAY_INDEX',
                                array: {
                                    name: 'N_VARIABLE',
                                    variable: 'anArray'
                                },
                                index: {
                                    name: 'N_INTEGER',
                                    number: '3'
                                }
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'aProp'
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '6'
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to dynamically referenced property of object with key in variable': {
            code: '$anObject->$propName = 4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'anObject'
                            },
                            property: {
                                name: 'N_VARIABLE',
                                variable: 'propName'
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '4'
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to dynamically referenced property of object with expression for key': {
            code: '$anObject->{$propName . "a"} = 4;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'anObject'
                            },
                            property: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'propName'
                                },
                                right: [{
                                    operator: '.',
                                    operand: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'a'
                                    }
                                }]
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '4'
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to statically referenced property of statically referenced property': {
            code: '$anObject->prop1->prop2 = 3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_OBJECT_PROPERTY',
                                object: {
                                    name: 'N_VARIABLE',
                                    variable: 'anObject'
                                },
                                property: {
                                    name: 'N_STRING',
                                    string: 'prop1'
                                }
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'prop2'
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '3'
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to statically referenced property of method call result': {
            code: '$anObject->getIt()->prop1 = 3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_METHOD_CALL',
                                object: {
                                    name: 'N_VARIABLE',
                                    variable: 'anObject'
                                },
                                method: {
                                    name: 'N_STRING',
                                    string: 'getIt'
                                },
                                args: []
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'prop1'
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '3'
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to statically referenced property of array index method call result': {
            code: '$anArray[2]->getIt()->prop1 = 3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_METHOD_CALL',
                                object: {
                                    name: 'N_ARRAY_INDEX',
                                    array: {
                                        name: 'N_VARIABLE',
                                        variable: 'anArray'
                                    },
                                    index: {
                                        name: 'N_INTEGER',
                                        number: '2'
                                    }
                                },
                                method: {
                                    name: 'N_STRING',
                                    string: 'getIt'
                                },
                                args: []
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'prop1'
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '3'
                            }
                        }]
                    }
                }]
            }
        },
        'assignment to variable->prop->index->prop': {
            code: '$anObject->prop[2]->prop1 = 3;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_ARRAY_INDEX',
                                array: {
                                    name: 'N_OBJECT_PROPERTY',
                                    object: {
                                        name: 'N_VARIABLE',
                                        variable: 'anObject'
                                    },
                                    property: {
                                        name: 'N_STRING',
                                        string: 'prop'
                                    }
                                },
                                index: {
                                    name: 'N_INTEGER',
                                    number: '2'
                                }
                            },
                            property: {
                                name: 'N_STRING',
                                string: 'prop1'
                            }
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '3'
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
