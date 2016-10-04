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

describe('PHP Parser grammar foreach statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple foreach over variable with no body statements': {
            code: 'foreach ($array as $item) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOREACH_STATEMENT',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'array'
                    },
                    value: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'simple foreach over variable with key with no body statements': {
            code: 'foreach ($array as $key => $item) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOREACH_STATEMENT',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'array'
                    },
                    key: {
                        name: 'N_VARIABLE',
                        variable: 'key'
                    },
                    value: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'simple foreach over variable with one body statement not wrapped in braces': {
            code: 'foreach ($array as $item) echo 1;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOREACH_STATEMENT',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'array'
                    },
                    value: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    },
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_INTEGER',
                            number: '1'
                        }]
                    }
                }]
            }
        },
        'simple foreach over variable by reference with key': {
            code: 'foreach ($array as $key => &$item) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOREACH_STATEMENT',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'array'
                    },
                    key: {
                        name: 'N_VARIABLE',
                        variable: 'key'
                    },
                    value: {
                        name: 'N_REFERENCE',
                        operand: {
                            name: 'N_VARIABLE',
                            variable: 'item'
                        }
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'simple foreach over variable with list for value and no body statements': {
            code: 'foreach ($array as list($first, $second)) {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOREACH_STATEMENT',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'array'
                    },
                    value: {
                        name: 'N_LIST',
                        elements: [{
                            name: 'N_VARIABLE',
                            variable: 'first'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'second'
                        }]
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: []
                    }
                }]
            }
        },
        'simple foreach over variable with key with one body statement': {
            code: 'foreach ($array as $key => $item) { echo 3; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOREACH_STATEMENT',
                    array: {
                        name: 'N_VARIABLE',
                        variable: 'array'
                    },
                    key: {
                        name: 'N_VARIABLE',
                        variable: 'key'
                    },
                    value: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_INTEGER',
                                number: '3'
                            }]
                        }]
                    }
                }]
            }
        },
        'foreach over element of array stored in property': {
            code: 'foreach ($object->array[7] as $key => $item) { echo 3; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FOREACH_STATEMENT',
                    array: {
                        name: 'N_ARRAY_INDEX',
                        array: {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'object'
                            },
                            properties: [{
                                property: {
                                    name: 'N_STRING',
                                    string: 'array'
                                }
                            }]
                        },
                        indices: [{
                            index: {
                                name: 'N_INTEGER',
                                number: '7'
                            }
                        }]
                    },
                    key: {
                        name: 'N_VARIABLE',
                        variable: 'key'
                    },
                    value: {
                        name: 'N_VARIABLE',
                        variable: 'item'
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_INTEGER',
                                number: '3'
                            }]
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
