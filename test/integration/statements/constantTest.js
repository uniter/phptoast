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

describe('PHP Parser grammar "const" declaration statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'declaring a single constant in the global scope for the global namespace': {
            code: '<?php const MY_CONST = 21;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CONSTANT_STATEMENT',
                    constants: [{
                        constant: 'MY_CONST',
                        value: {
                            name: 'N_INTEGER',
                            number: '21'
                        }
                    }]
                }]
            }
        },
        'declaring multiple constants in the global scope for the global namespace': {
            code: '<?php const FIRST_CONST = 101, SECOND_CONST = "hello world!";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CONSTANT_STATEMENT',
                    constants: [{
                        constant: 'FIRST_CONST',
                        value: {
                            name: 'N_INTEGER',
                            number: '101'
                        }
                    }, {
                        constant: 'SECOND_CONST',
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: 'hello world!'
                        }
                    }]
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
