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

describe('PHP Parser grammar alternative while loop statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple alternative while': {
            code: '<?php while (true): echo \'yes\'; endwhile; ?>',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_BOOLEAN',
                        bool: true
                    },
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_STRING_LITERAL',
                            string: 'yes'
                        }]
                    }
                }]
            }
        },
        'multi-line alternative while': {
            code: nowdoc(function () {/*<<<EOS
<?php
    while (true):
        echo 'yes';
        echo 'no';
    endwhile;
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_BOOLEAN',
                        bool: true
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        }, {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'no'
                            }]
                        }]
                    }
                }]
            }
        },
        'alternative while with inline HTML': {
            code: nowdoc(function () {/*<<<EOS
<?php
    while (true):
        ?>yes<?php
        ?>no<?php
    endwhile;
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_BOOLEAN',
                        bool: true
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: 'yes'
                        }, {
                            name: 'N_INLINE_HTML_STATEMENT',
                            html: 'no'
                        }]
                    }
                }]
            }
        },
        'alternative while with redundant inline HTML whitespace': {
            code: nowdoc(function () {/*<<<EOS
<?php while (true): ?>
<?php echo 'yes'; ?>
<?php echo 'no'; ?>
<?php endwhile; ?>
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_WHILE_STATEMENT',
                    condition: {
                        name: 'N_BOOLEAN',
                        bool: true
                    },
                    body: {
                        name: 'N_COMPOUND_STATEMENT',
                        statements: [{
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'yes'
                            }]
                        }, {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_STRING_LITERAL',
                                string: 'no'
                            }]
                        }]
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
