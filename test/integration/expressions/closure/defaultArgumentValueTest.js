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
    tools = require('../../../tools');

describe('PHP Parser grammar closure expression default argument value integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty closure in void context with parameter with default value': {
            code: 'function ($a = 4) {};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_CLOSURE',
                        static: false,
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'a'
                            },
                            value: {
                                name: 'N_INTEGER',
                                number: '4'
                            }
                        }],
                        bindings: [],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: []
                        }
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
