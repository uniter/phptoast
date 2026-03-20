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

describe('PHP Parser grammar alternative if statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    describe('when not capturing bounds', function () {
        _.each({
            'simple alternative if with one consequent statement': {
                code: '<?php if (true): echo \'yes\'; endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        }
                    }]
                }
            },
            'alternative if with two consequent statements': {
                code: '<?php if (true): echo \'one\'; echo \'two\'; endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'one'
                                }]
                            }, {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'two'
                                }]
                            }]
                        }
                    }]
                }
            },
            'simple alternative if with no consequent statements': {
                code: '<?php if (true): endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
                    }]
                }
            },
            'alternative if with else': {
                code: '<?php if (true): echo \'yes\'; else: echo \'no\'; endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        },
                        alternateStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'no'
                            }]
                        }
                    }]
                }
            },
            'alternative if with elseif': {
                code: '<?php if (true): echo \'yes\'; elseif (false): echo \'no\'; endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_BOOLEAN',
                                bool: false
                            },
                            consequentStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'no'
                                }]
                            }
                        }
                    }]
                }
            },
            'alternative if with elseif and else': {
                code: '<?php if (true): echo \'yes\'; elseif (false): echo \'no\'; else: echo \'maybe\'; endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_BOOLEAN',
                                bool: false
                            },
                            consequentStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'no'
                                }]
                            },
                            alternateStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'maybe'
                                }]
                            }
                        }
                    }]
                }
            },
            'alternative if with multiple elseif': {
                code: '<?php if (1): echo \'one\'; elseif (2): echo \'two\'; elseif (3): echo \'three\'; endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_INTEGER',
                            number: '1'
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'one'
                            }]
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_INTEGER',
                                number: '2'
                            },
                            consequentStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'two'
                                }]
                            },
                            alternateStatement: {
                                name: 'N_IF_STATEMENT',
                                condition: {
                                    name: 'N_INTEGER',
                                    number: '3'
                                },
                                consequentStatement: {
                                    name: 'N_ECHO_STATEMENT',
                                    expressions: [{
                                        name: 'N_STRING_LITERAL',
                                        string: 'three'
                                    }]
                                }
                            }
                        }
                    }]
                }
            },
            'alternative if with multiple elseif and else': {
                code: '<?php if (1): echo \'one\'; elseif (2): echo \'two\'; elseif (3): echo \'three\'; else: echo \'four\'; endif;',
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_INTEGER',
                            number: '1'
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'one'
                            }]
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_INTEGER',
                                number: '2'
                            },
                            consequentStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'two'
                                }]
                            },
                            alternateStatement: {
                                name: 'N_IF_STATEMENT',
                                condition: {
                                    name: 'N_INTEGER',
                                    number: '3'
                                },
                                consequentStatement: {
                                    name: 'N_ECHO_STATEMENT',
                                    expressions: [{
                                        name: 'N_STRING_LITERAL',
                                        string: 'three'
                                    }]
                                },
                                alternateStatement: {
                                    name: 'N_ECHO_STATEMENT',
                                    expressions: [{
                                        name: 'N_STRING_LITERAL',
                                        string: 'four'
                                    }]
                                }
                            }
                        }
                    }]
                }
            },
            'multi-line alternative if': {
                code: nowdoc(function () {/*<<<EOS
<?php
    if (true):
        echo 'yes';
    elseif (false):
        echo 'no';
    else:
        echo 'maybe';
    endif;
EOS
*/;}), // jshint ignore:line
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_BOOLEAN',
                                bool: false
                            },
                            consequentStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'no'
                                }]
                            },
                            alternateStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'maybe'
                                }]
                            }
                        }
                    }]
                }
            },
            'alternative if with inline HTML': {
                code: nowdoc(function () {/*<<<EOS
<?php
    if (true):
        ?>yes<?php
    elseif (false):
        ?>no<?php
    else:
        ?>maybe<?php
    endif;
EOS
*/;}), // jshint ignore:line
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: 'yes'
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_BOOLEAN',
                                bool: false
                            },
                            consequentStatement: {
                                name: 'N_INLINE_HTML_STATEMENT',
                                html: 'no'
                            },
                            alternateStatement: {
                                name: 'N_INLINE_HTML_STATEMENT',
                                html: 'maybe'
                            }
                        }
                    }]
                }
            },
            'alternative if with inline HTML and PHP closing tag on previous line': {
                code: nowdoc(function () {/*<<<EOS
<?php if (true): ?>
    yes
<?php elseif (false): ?>
    no
<?php else: ?>
    maybe
<?php endif; ?>
EOS
*/;}), // jshint ignore:line
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: '    yes\n'
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_BOOLEAN',
                                bool: false
                            },
                            consequentStatement: {
                                name: 'N_INLINE_HTML_STATEMENT',
                                html: '    no\n'
                            },
                            alternateStatement: {
                                name: 'N_INLINE_HTML_STATEMENT',
                                html: '    maybe\n'
                            }
                        }
                    }]
                }
            },
            'alternative if with redundant inline HTML whitespace': {
                code: nowdoc(function () {/*<<<EOS
<?php if (true): ?>
<?php echo 'yes'; ?>
<?php elseif (false): ?>
<?php echo 'no'; ?>
<?php else: ?>
<?php echo 'maybe'; ?>
<?php endif; ?>
EOS
*/;}), // jshint ignore:line
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_BOOLEAN',
                            bool: true
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_BOOLEAN',
                                bool: false
                            },
                            consequentStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'no'
                                }]
                            },
                            alternateStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'maybe'
                                }]
                            }
                        }
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

    describe('when capturing bounds', function () {
        beforeEach(function () {
            parser = tools.createParser({captureAllBounds: true});
        });

        _.each({
            'multi-line alternative if with elseif, else, inline HTML and PHP closing tag on previous line': {
                code: nowdoc(function () {/*<<<EOS
<?php if (1): ?>
    one
<?php elseif (2): ?>
    two
<?php elseif (3): ?>
    three
<?php else: ?>
    more
<?php endif; ?>
EOS
*/;}), // jshint ignore:line
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_INTEGER',
                            number: '1',
                            bounds: {
                                start: {line: 1, column: 11, offset: 10},
                                end: {line: 1, column: 12, offset: 11}
                            }
                        },
                        consequentStatement: {
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: '    one\n',
                            bounds: {
                                start: {line: 1, column: 15, offset: 14},
                                end: {line: 3, column: 7, offset: 31}
                            }
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_INTEGER',
                                number: '2',
                                bounds: {
                                    start: {line: 3, column: 15, offset: 39},
                                    end: {line: 3, column: 16, offset: 40}
                                }
                            },
                            consequentStatement: {
                                name: 'N_INLINE_HTML_STATEMENT',
                                html: '    two\n',
                                bounds: {
                                    start: {line: 3, column: 19, offset: 43},
                                    end: {line: 5, column: 7, offset: 60}
                                }
                            },
                            alternateStatement: {
                                name: 'N_IF_STATEMENT',
                                condition: {
                                    name: 'N_INTEGER',
                                    number: '3',
                                    bounds: {
                                        start: {line: 5, column: 15, offset: 68},
                                        end: {line: 5, column: 16, offset: 69}
                                    }
                                },
                                consequentStatement: {
                                    name: 'N_INLINE_HTML_STATEMENT',
                                    html: '    three\n',
                                    bounds: {
                                        start: {line: 5, column: 19, offset: 72},
                                        end: {line: 7, column: 7, offset: 91}
                                    }
                                },
                                alternateStatement: {
                                    name: 'N_INLINE_HTML_STATEMENT',
                                    html: '    more\n',
                                    bounds: {
                                        start: {line: 7, column: 13, offset: 97},
                                        end: {line: 9, column: 7, offset: 115}
                                    }
                                },
                                bounds: {
                                    start: {line: 5, column: 7, offset: 60},
                                    end: {line: 9, column: 13, offset: 121}
                                }
                            },
                            bounds: {
                                start: {line: 3, column: 7, offset: 31},
                                end: {line: 9, column: 13, offset: 121}
                            }
                        },
                        bounds: {
                            start: {line: 1, column: 7, offset: 6},
                            end: {line: 9, column: 13, offset: 121}
                        }
                    }],
                    bounds: {
                        start: {line: 1, column: 1, offset: 0},
                        end: {line: 9, column: 16, offset: 124}
                    }
                }
            },
            'multi-line alternative if with else and elseif': {
                code: nowdoc(function () {/*<<<EOS
<?php
    if (1):
        echo 'one';
    elseif (2):
        echo 'two';
    elseif (3):
        echo 'three';
    else:
        echo 'more';
    endif;
EOS
*/;}), // jshint ignore:line
                expectedAST: {
                    name: 'N_PROGRAM',
                    statements: [{
                        name: 'N_IF_STATEMENT',
                        condition: {
                            name: 'N_INTEGER',
                            number: '1',
                            bounds: {
                                start: {line: 2, column: 9, offset: 14},
                                end: {line: 2, column: 10, offset: 15}
                            }
                        },
                        consequentStatement: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'one',
                                bounds: {
                                    start: {line: 3, column: 14, offset: 31},
                                    end: {line: 3, column: 19, offset: 36}
                                }
                            }],
                            bounds: {
                                start: {line: 3, column: 9, offset: 26},
                                end: {line: 3, column: 20, offset: 37}
                            }
                        },
                        alternateStatement: {
                            name: 'N_IF_STATEMENT',
                            condition: {
                                name: 'N_INTEGER',
                                number: '2',
                                bounds: {
                                    start: {line: 4, column: 13, offset: 50},
                                    end: {line: 4, column: 14, offset: 51}
                                }
                            },
                            consequentStatement: {
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_STRING_LITERAL',
                                    string: 'two',
                                    bounds: {
                                        start: {line: 5, column: 14, offset: 67},
                                        end: {line: 5, column: 19, offset: 72}
                                    }
                                }],
                                bounds: {
                                    start: {line: 5, column: 9, offset: 62},
                                    end: {line: 5, column: 20, offset: 73}
                                }
                            },
                            alternateStatement: {
                                name: 'N_IF_STATEMENT',
                                condition: {
                                    name: 'N_INTEGER',
                                    number: '3',
                                    bounds: {
                                        start: {line: 6, column: 13, offset: 86},
                                        end: {line: 6, column: 14, offset: 87}
                                    }
                                },
                                consequentStatement: {
                                    name: 'N_ECHO_STATEMENT',
                                    expressions: [{
                                        name: 'N_STRING_LITERAL',
                                        string: 'three',
                                        bounds: {
                                            start: {line: 7, column: 14, offset: 103},
                                            end: {line: 7, column: 21, offset: 110}
                                        }
                                    }],
                                    bounds: {
                                        start: {line: 7, column: 9, offset: 98},
                                        end: {line: 7, column: 22, offset: 111}
                                    }
                                },
                                alternateStatement: {
                                    name: 'N_ECHO_STATEMENT',
                                    expressions: [{
                                        name: 'N_STRING_LITERAL',
                                        string: 'more',
                                        bounds: {
                                            start: {line: 9, column: 14, offset: 135},
                                            end: {line: 9, column: 20, offset: 141}
                                        }
                                    }],
                                    bounds: {
                                        start: {line: 9, column: 9, offset: 130},
                                        end: {line: 9, column: 21, offset: 142}
                                    }
                                },
                                bounds: {
                                    start: {line: 6, column: 5, offset: 78},
                                    end: {line: 10, column: 11, offset: 153}
                                }
                            },
                            bounds: {
                                start: {line: 4, column: 5, offset: 42},
                                end: {line: 10, column: 11, offset: 153}
                            }
                        },
                        bounds: {
                            start: {line: 2, column: 5, offset: 10},
                            end: {line: 10, column: 11, offset: 153}
                        }
                    }],
                    bounds: {
                        start: {line: 1, column: 1, offset: 0},
                        end: {line: 10, column: 11, offset: 153}
                    }
                }
            }
        }, function (scenario, description) {
            describe(description, function () {
                var code = scenario.code;

                it('should return the expected AST', function () {
                    expect(parser.parse(code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
