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

describe('PHP Parser grammar variable-variable construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'fetching the value of a variable whose name is inside another variable (unbraced syntax)': {
            code: 'return $$myVariableName;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE_EXPRESSION',
                        expression: {
                            name: 'N_VARIABLE',
                            variable: 'myVariableName'
                        }
                    }
                }]
            }
        },
        'fetching the value of a variable whose name is inside another variable (braced syntax)': {
            code: 'return ${$myVariableName};',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_VARIABLE_EXPRESSION',
                        expression: {
                            name: 'N_VARIABLE',
                            variable: 'myVariableName'
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
