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

describe('PHP Parser grammar global variable import statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'importing one variable in the global scope (useful for includes inside functions)': {
            code: '<?php global $myVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_GLOBAL_STATEMENT',
                    variables: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }]
                }]
            }
        },
        'importing two variables in the global scope': {
            code: '<?php global $myVar, $anotherVar;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_GLOBAL_STATEMENT',
                    variables: [{
                        name: 'N_VARIABLE',
                        variable: 'myVar'
                    }, {
                        name: 'N_VARIABLE',
                        variable: 'anotherVar'
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
