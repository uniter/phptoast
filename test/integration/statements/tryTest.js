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
    tools = require('../../tools');

describe('PHP Parser grammar try statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'try without catch or finally': {
            code: 'try { $a = 21; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRY_STATEMENT',
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
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
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }]
                            }
                        }]
                    },
                    catches: [],
                    finalizer: null
                }]
            }
        },
        'try with two catches': {
            code: nowdoc(function () {/*<<<EOS
try {
    $a = 1;
} catch (My\Exception\Type $ex1) {
    $a = 2;
} catch (YourExceptionType $ex2) {
    $a = 3;
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRY_STATEMENT',
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
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
                                        name: 'N_INTEGER',
                                        number: '1'
                                    }
                                }]
                            }
                        }]
                    },
                    catches: [{
                        type: {
                            name: 'N_STRING',
                            string: 'My\\Exception\\Type'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'ex1'
                        },
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
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
                                            name: 'N_INTEGER',
                                            number: '2'
                                        }
                                    }]
                                }
                            }]
                        }
                    }, {
                        type: {
                            name: 'N_STRING',
                            string: 'YourExceptionType'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'ex2'
                        },
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
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
                                            name: 'N_INTEGER',
                                            number: '3'
                                        }
                                    }]
                                }
                            }]
                        }
                    }],
                    finalizer: null
                }]
            }
        },
        'try with one catch and a finally clause': {
            code: nowdoc(function () {/*<<<EOS
try {
    $a = 1;
} catch (My\Exception\Type $ex) {
    $a = 2;
} finally {
    $a = 3;
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRY_STATEMENT',
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
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
                                        name: 'N_INTEGER',
                                        number: '1'
                                    }
                                }]
                            }
                        }]
                    },
                    catches: [{
                        type: {
                            name: 'N_STRING',
                            string: 'My\\Exception\\Type'
                        },
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'ex'
                        },
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
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
                                            name: 'N_INTEGER',
                                            number: '2'
                                        }
                                    }]
                                }
                            }]
                        }
                    }],
                    finalizer: {
                        name: 'N_COMPOUND_STATEMENT',
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
                                        name: 'N_INTEGER',
                                        number: '3'
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
