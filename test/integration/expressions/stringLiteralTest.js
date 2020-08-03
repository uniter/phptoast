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

describe('PHP Parser grammar string literal expression integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty single-quoted string literal': {
            code: nowdoc(function () {/*<<<EOS
<?php
return '';
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: ''
                    }
                }]
            }
        },
        'empty double-quoted string literal': {
            code: nowdoc(function () {/*<<<EOS
<?php
return "";
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: ''
                    }
                }]
            }
        },
        // Check that whitespace/comment-skipping does not apply inside a double-quoted string
        'double-quoted string literal that just contains whitespace': {
            code: nowdoc(function () {/*<<<EOS
<?php
return "  ";
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: '  '
                    }
                }]
            }
        },
        'single-quoted string literal with one double-quote embedded': {
            code: nowdoc(function () {/*<<<EOS
<?php
return 'My str"ing contents';
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'My str"ing contents'
                    }
                }]
            }
        },
        'single-quoted string literal with escaped single-quote embedded': {
            code: nowdoc(function () {/*<<<EOS
<?php
return 'My str\'ing contents';
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'My str\'ing contents'
                    }
                }]
            }
        },
        'single-quoted string literal with escaped backslash embedded': {
            code: nowdoc(function () {/*<<<EOS
<?php
return 'My str\\ing contents';
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'My str\\ing contents'
                    }
                }]
            }
        },
        'single-quoted string literal with unescaped backslash embedded before special and non-special chars': {
            code: nowdoc(function () {/*<<<EOS
<?php
return 'My str\ing conte\nts';
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'My str\\ing conte\\nts'
                    }
                }]
            }
        },
        'double-quoted string literal with escaped double-quote embedded': {
            code: nowdoc(function () {/*<<<EOS
<?php
return "My str\"ing contents";
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'My str"ing contents'
                    }
                }]
            }
        },
        'double-quoted string whose contents look like an embedded hash line-comment followed by interpolated var': {
            code: nowdoc(function () {/*<<<EOS
<?php
$firstVar = "# ";
$secondVar = 'done';
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'firstVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_STRING_LITERAL',
                                string: '# '
                            }
                        }]
                    }
                }, {
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'secondVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_STRING_LITERAL',
                                string: 'done'
                            }
                        }]
                    }
                }]
            }
        },
        'double-quoted string whose contents look like an embedded slash line-comment followed by interpolated var': {
            code: nowdoc(function () {/*<<<EOS
<?php
$firstVar = "// ";
$secondVar = 'done';
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'firstVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_STRING_LITERAL',
                                string: '// '
                            }
                        }]
                    }
                }, {
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'secondVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_STRING_LITERAL',
                                string: 'done'
                            }
                        }]
                    }
                }]
            }
        },
        'dual double-quoted strings whose contents look like a spanning block comment followed by interpolated var': {
            code: nowdoc(function () {/*<<<EOS
<?php
$firstVar = "/* ";
$secondVar = ' ${close} after';
EOS
*/;}, {close: '*/'}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'firstVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_STRING_LITERAL',
                                string: '/* '
                            }
                        }]
                    }
                }, {
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'secondVar'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_STRING_LITERAL',
                                string: ' */ after'
                            }
                        }]
                    }
                }]
            }
        },
        'double-quoted string containing a trailing dollar, potentially confused with interpolated variable': {
            code: nowdoc(function () {/*<<<EOS
<?php
return "my string $";
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'my string $'
                    }
                }]
            }
        },
        'double-quoted string containing a trailing opening brace, potentially confused with complex interpolation syntax': {
            code: nowdoc(function () {/*<<<EOS
<?php
return "my string {";
EOS
*/;}), //jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'my string {'
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            // Pretty-print the code strings so any non-printable characters are readable
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
