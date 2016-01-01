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

describe('PHP Parser grammar custom statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser({
            rules: {
                'N_CUSTOM_TRAP_IT': {
                    components: [/trap_it/, /@/, {name: 'arg', rule: 'N_EXPRESSION'}, /;/]
                },
                'N_NAMESPACE_SCOPED_STATEMENT': {
                    components: {oneOf: ['N_CUSTOM_TRAP_IT', 'N_NAMESPACE_SCOPED_STATEMENT']}
                }
            }
        });
    });

    _.each({
        'custom trap statement between function calls': {
            code: 'firstFunc(); trap_it @ 21; secondFunc();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'firstFunc'
                        },
                        args: []
                    }
                }, {
                    name: 'N_CUSTOM_TRAP_IT',
                    arg: {
                        name: 'N_INTEGER',
                        number: '21'
                    }
                }, {
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'secondFunc'
                        },
                        args: []
                    }
                }]
            }
        },
        'custom trap statement nested inside namespace statement': {
            code: 'myFunc(); namespace A\\B { trap_it @ 22; }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'myFunc'
                        },
                        args: []
                    }
                }, {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'A\\B',
                    statements: [{
                        name: 'N_CUSTOM_TRAP_IT',
                        arg: {
                            name: 'N_INTEGER',
                            number: '22'
                        }
                    }]
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
