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
    nowdoc = require('nowdoc'),
    tools = require('../../../tools');

describe('PHP Parser grammar generator function statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'declaring a generator function that yields only values': {
            code: '<?php function myGenerator() { yield "first"; print "middle"; yield "last"; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_FUNCTION_STATEMENT',
                    func: {
                        name: 'N_STRING',
                        string: 'myGenerator'
                    },
                    generator: true,
                    args: [],
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_YIELD_EXPRESSION',
                                key: null,
                                value: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'first'
                                }
                            }
                        }, {
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_PRINT_EXPRESSION',
                                operand: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'middle'
                                }
                            }
                        }, {
                            name: 'N_EXPRESSION_STATEMENT',
                            expression: {
                                name: 'N_YIELD_EXPRESSION',
                                key: null,
                                value: {
                                    name: 'N_STRING_LITERAL',
                                    string: 'last'
                                }
                            }
                        }]
                    }
                }]
            }
        },
        'declaring a generator closure that yields only values': {
            code: '<?php return function () { yield "first"; print "middle"; yield "last"; };',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        generator: true,
                        static: false,
                        args: [],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_YIELD_EXPRESSION',
                                    key: null,
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'first'
                                    }
                                }
                            }, {
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_PRINT_EXPRESSION',
                                    operand: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'middle'
                                    }
                                }
                            }, {
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_YIELD_EXPRESSION',
                                    key: null,
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'last'
                                    }
                                }
                            }]
                        }
                    }
                }]
            }
        },
        'declaring a generator instance method that yields only values': {
            code: nowdoc(function () {/*<<<EOS
<?php

class MyClass
{
    public function myMethod()
    {
        yield "first";

        print "middle";

        yield "last";
    }
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        func: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        generator: true,
                        visibility: 'public',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_YIELD_EXPRESSION',
                                    key: null,
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'first'
                                    }
                                }
                            }, {
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_PRINT_EXPRESSION',
                                    operand: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'middle'
                                    }
                                }
                            }, {
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_YIELD_EXPRESSION',
                                    key: null,
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'last'
                                    }
                                }
                            }]
                        }
                    }]
                }]
            }
        },
        'declaring a generator static method that yields only values': {
            code: nowdoc(function () {/*<<<EOS
<?php

class MyClass
{
    public static function myMethod()
    {
        yield "first";

        print "middle";

        yield "last";
    }
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_STATIC_METHOD_DEFINITION',
                        method: {
                            name: 'N_STRING',
                            string: 'myMethod'
                        },
                        generator: true,
                        visibility: 'public',
                        args: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_YIELD_EXPRESSION',
                                    key: null,
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'first'
                                    }
                                }
                            }, {
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_PRINT_EXPRESSION',
                                    operand: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'middle'
                                    }
                                }
                            }, {
                                name: 'N_EXPRESSION_STATEMENT',
                                expression: {
                                    name: 'N_YIELD_EXPRESSION',
                                    key: null,
                                    value: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'last'
                                    }
                                }
                            }]
                        }
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
