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

describe('PHP Parser grammar alternative switch statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple alternative switch with two cases': {
            code: '<?php switch ($i): case 0: echo \'i is 0\'; break; case 1: echo \'i is 1\'; break; endswitch;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_SWITCH_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'i'
                    },
                    cases: [{
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '0'
                        },
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is 0'
                            }]
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }, {
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '1'
                        },
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is 1'
                            }]
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }]
                }]
            }
        },
        'simple alternative switch with default case': {
            code: '<?php switch ($i): default: echo \'my text\'; endswitch;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_SWITCH_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'i'
                    },
                    cases: [{
                        name: 'N_DEFAULT_CASE',
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'my text'
                            }]
                        }]
                    }]
                }]
            }
        },
        'simple alternative switch with cases and default case': {
            code: '<?php switch ($i): case 0: echo \'i is 0\'; break; case 1: echo \'i is 1\'; break; default: echo \'i is not 0 or 1\'; endswitch;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_SWITCH_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'i'
                    },
                    cases: [{
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '0'
                        },
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is 0'
                            }]
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }, {
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '1'
                        },
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is 1'
                            }]
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }, {
                        name: 'N_DEFAULT_CASE',
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is not 0 or 1'
                            }]
                        }]
                    }]
                }]
            }
        },
        'alternative switch with inline HTML': {
            code: nowdoc(function () {/*<<<EOS
<?php
    switch ($i):
    case 0:
        ?>i is 0<?php
        break;
    case 1:
        ?>i is 1<?php
        break;
    default:
        ?>i is not 0 or 1<?php
    endswitch;
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_SWITCH_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'i'
                    },
                    cases: [{
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '0'
                        },
                        body: [{
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: 'i is 0'
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }, {
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '1'
                        },
                        body: [{
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: 'i is 1'
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }, {
                        name: 'N_DEFAULT_CASE',
                        body: [{
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: 'i is not 0 or 1'
                        }]
                    }]
                }]
            }
        },
        'alternative switch with redundant inline HTML whitespace': {
            code: nowdoc(function () {/*<<<EOS
<?php switch ($i): ?>
<?php case 0: ?>
<?php echo 'i is 0'; ?>
<?php break; ?>
<?php case 1: ?>
<?php echo 'i is 1'; ?>
<?php break; ?>
<?php default: ?>
<?php echo 'i is not 0 or 1'; ?>
<?php endswitch; ?>
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_SWITCH_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE',
                        variable: 'i'
                    },
                    cases: [{
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '0'
                        },
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is 0'
                            }]
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }, {
                        name: 'N_CASE',
                        expression: {
                            name: 'N_INTEGER',
                            number: '1'
                        },
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is 1'
                            }]
                        }, {
                            name: 'N_BREAK_STATEMENT',
                            levels: {
                                name: 'N_INTEGER',
                                number: '1'
                            }
                        }]
                    }, {
                        name: 'N_DEFAULT_CASE',
                        body: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'i is not 0 or 1'
                            }]
                        }]
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            var code = scenario.code;

            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
