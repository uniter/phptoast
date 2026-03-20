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

describe('PHP Parser grammar alternative foreach loop statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple alternative foreach loop': {
            code: '<?php foreach ($array as $value): echo $value; endforeach;',
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
                        variable: 'value'
                    },
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_VARIABLE',
                            variable: 'value'
                        }]
                    }
                }]
            }
        },
        'alternative foreach loop with key': {
            code: '<?php foreach ($array as $key => $value): echo $key . \' => \' . $value; endforeach;',
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
                        variable: 'value'
                    },
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'key'
                                },
                                right: [{
                                    operator: '.',
                                    operand: {
                                        name: 'N_STRING_LITERAL',
                                        string: ' => '
                                    }
                                }]
                            },
                            right: [{
                                operator: '.',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'value'
                                }
                            }]
                        }]
                    }
                }]
            }
        },
        'alternative foreach loop with inline HTML and PHP closing tag on previous line': {
            code: nowdoc(function () {/*<<<EOS
<?php foreach ($array as $key => $value): ?>
    my item
<?php endforeach; ?>
EOS
*/;}), // jshint ignore:line
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
                        variable: 'value'
                    },
                    body: {
                        name: 'N_INLINE_HTML_STATEMENT',
                        html: '    my item\n'
                    }
                }]
            }
        },
        'alternative foreach loop with redundant inline HTML whitespace': {
            code: nowdoc(function () {/*<<<EOS
<?php foreach ($array as $key => $value): ?>
<?php echo $key . ' => ' . $value; ?>
<?php endforeach; ?>
EOS
*/;}), // jshint ignore:line
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
                        variable: 'value'
                    },
                    body: {
                        name: 'N_ECHO_STATEMENT',
                        expressions: [{
                            name: 'N_EXPRESSION',
                            left: {
                                name: 'N_EXPRESSION',
                                left: {
                                    name: 'N_VARIABLE',
                                    variable: 'key'
                                },
                                right: [{
                                    operator: '.',
                                    operand: {
                                        name: 'N_STRING_LITERAL',
                                        string: ' => '
                                    }
                                }]
                            },
                            right: [{
                                operator: '.',
                                operand: {
                                    name: 'N_VARIABLE',
                                    variable: 'value'
                                }
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
