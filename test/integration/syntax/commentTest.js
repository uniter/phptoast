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

describe('PHP Parser grammar comment syntax integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'line-comment at beginning of module': {
            code: '<?php // My comment\nreturn "done";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'done'
                    }
                }]
            }
        },
        'line-comment at end of module': {
            code: '<?php return "done";\n// My comment',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'done'
                    }
                }]
            }
        },
        // Line-comments cannot contain PHP closing tags.
        'line-comment terminated by PHP closing tag': {
            code: '<?php echo "first ";\n// My comment ?>second',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'first '
                    }]
                }, {
                    name: 'N_INLINE_HTML_STATEMENT',
                    html: 'second'
                }]
            }
        },
        // Block-comments can contain PHP closing tags.
        'block-comment terminated by PHP closing tag': {
            code: '<?php echo "first ";\n/* My comment ?>second */',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_ECHO_STATEMENT',
                    expressions: [{
                        name: 'N_STRING_LITERAL',
                        string: 'first '
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            var code = scenario.code;

            // Pretty-print the code strings so any non-printable characters are readable
            describe('when the code is ' + JSON.stringify(code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
