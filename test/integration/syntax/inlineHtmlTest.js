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

describe('PHP Parser grammar inline HTML syntax integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty document': {
            code: '',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: []
            }
        },
        'simple HTML-only document': {
            code: '<a>42</a><b />',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '<a>42</a><b />'
                }]
            }
        },
        'HTML-only document that contains text resembling PHP code': {
            code: 'echo "this should not be treated as PHP";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: 'echo "this should not be treated as PHP";'
                }]
            }
        },
        'standalone empty opening PHP tag': {
            code: '<?php',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: []
            }
        },
        'standalone empty opening and closing PHP tags': {
            code: '<?php ?>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: []
            }
        },
        'just whitespace before the first `<?php` tag': {
            code: '  <?php ?>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '  '
                }]
            }
        },
        'just whitespace before and after the last `?>` tag': {
            code: '<?php echo 21;  ?>  ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '21'
                    }]
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '  '
                }]
            }
        },
        'empty PHP tag followed immediately by non-empty PHP tag': {
            code: '<?php     ?><?php echo 21;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '21'
                    }]
                }]
            }
        },
        'HTML with PHP code in-between': {
            code: ' first <?php echo 21; ?> second ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: ' first '
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '21'
                    }]
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: ' second '
                }]
            }
        },
        'HTML with multiple PHP code blocks in-between': {
            code: ' first <?php echo 21; ?> second <?php echo 1001; ?> third ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: ' first '
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '21'
                    }]
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: ' second '
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_INTEGER',
                        number: '1001'
                    }]
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: ' third '
                }]
            }
        },
        'HTML before the first PHP tag': {
            code: 'before<?php ?>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: 'before'
                }]
            }
        },
        'whitespace before and after the last PHP tag': {
            code: '<?php ?>    <?php echo "hello"; ',
            expectedAST: {
                name: 'N_PROGRAM',
                // Whitespace should be preserved.
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '    '
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'hello'
                    }]
                }]
            }
        },
        'single newline between PHP tags should be ignored': {
            code: '<?php ?>\n<?php echo "hello"; ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'hello'
                    }]
                }]
            }
        },
        'subsequent newlines after the first between PHP tags should be preserved': {
            code: '<?php ?>\n\n<?php echo "hello"; ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '\n' // Only the first newline should be ignored.
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'hello'
                    }]
                }]
            }
        },
        'PHP code surrounded by HTML tags': {
            code: '<html><?php $b = 2; ?></html>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '<html>'
                }, {
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_EXPRESSION',
                        left: {
                            name: 'N_VARIABLE',
                            variable: 'b'
                        },
                        right: [{
                            operator: '=',
                            operand: {
                                name: 'N_INTEGER',
                                number: '2'
                            }
                        }]
                    }
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '</html>'
                }]
            }
        },
        'echo statement with valid omitted semi-colon in favour of closing PHP tag instead': {
            code: '<html><?php echo "No requirement for semi-colon here" ?></html>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '<html>'
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'No requirement for semi-colon here'
                    }]
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '</html>'
                }]
            }
        },
        'function call with valid omitted semi-colon in favour of closing PHP tag instead': {
            code: '<html><?php go("No requirement for semi-colon here") ?></html>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '<html>'
                }, {
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'go'
                        },
                        args: [{
                            name: 'N_STRING_LITERAL',
                            string: 'No requirement for semi-colon here'
                        }]
                    }
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '</html>'
                }]
            }
        },
        'valid omitted semi-colon followed by redundant PHP tags': {
            code: '<div><?php echo "No requirement for semi-colon here" ?></div><?php ?>\n<?php ?>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '<div>'
                }, {
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'No requirement for semi-colon here'
                    }]
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: '</div>'
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
