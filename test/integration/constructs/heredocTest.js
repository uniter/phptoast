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

describe('PHP Parser grammar heredoc construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty unquoted heredoc': {
            code: '<?php return <<<EOS\n\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: ''
                        }]
                    }
                }]
            }
        },
        'unquoted heredoc containing unescaped quotes': {
            code: '<?php return <<<EOS\ndouble-quote: " and single quote: \'\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'double-quote: " and single quote: \''
                        }]
                    }
                }]
            }
        },
        'quoted heredoc containing only an interpolated variable': {
            code: '<?php return <<<"EOS"\n$myValue\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_VARIABLE',
                            variable: 'myValue'
                        }]
                    }
                }]
            }
        },
        'quoted heredoc with whitespace before identifier containing only an interpolated variable': {
            code: '<?php return <<< "EOS"\n$myValue\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_VARIABLE',
                            variable: 'myValue'
                        }]
                    }
                }]
            }
        },
        'quoted heredoc containing an escaped variable': {
            code: '<?php return <<<"EOS"\nthis is not \\$a variable\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'this is not $a variable'
                        }]
                    }
                }]
            }
        },
        'unquoted heredoc containing some text followed by an interpolated variable': {
            code: '<?php return <<<EOS\nabc$myValue\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'abc'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myValue'
                        }]
                    }
                }]
            }
        },
        'unquoted heredoc with whitespace before identifier containing some text followed by an interpolated variable': {
            code: '<?php return <<< EOS\nabc$myValue\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'abc'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myValue'
                        }]
                    }
                }]
            }
        },
        'unquoted heredoc with identifier nested inside by being incorrectly formatted': {
            code: '<?php return <<<EOS\nabc$myValue\nEOS)\nand some text\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'abc'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myValue'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: '\nEOS)\nand some text'
                        }]
                    }
                }]
            }
        },
        'quoted heredoc containing two interpolated variables touching': {
            code: '<?php return <<<"MYHEREDOC"\n$value1$value2\nMYHEREDOC;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_VARIABLE',
                            variable: 'value1'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'value2'
                        }]
                    }
                }]
            }
        },
        'quoted heredoc containing interpolation with ${...}': {
            code: '<?php return <<<"EOT"\n${value}\nEOT;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_VARIABLE',
                            variable: 'value'
                        }]
                    }
                }]
            }
        },
        'quoted heredoc containing interpolation with whitespace surrounding variable': {
            code: '<?php return <<<"MYHEREDOC"\nIncrease $what with $control\nMYHEREDOC;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'Increase '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'what'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: ' with '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'control'
                        }]
                    }
                }]
            }
        },
        'unquoted heredoc containing interpolation with double dollar (NOT valid variable variable syntax in strings)': {
            code: '<?php return <<<EOS\nThe number is $$myVar.\nEOS;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            // Note that the leading dollar is parsed as plain text
                            string: 'The number is $'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: '.'
                        }]
                    }
                }]
            }
        },
        'unquoted heredoc containing interpolation with text surrounding variable variable': {
            code: '<?php return <<<EOT\nThe number is ${$myVar}.\nEOT;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_HEREDOC',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'The number is '
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_VARIABLE',
                                variable: 'myVar'
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: '.'
                        }]
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
