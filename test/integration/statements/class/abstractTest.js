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

describe('PHP Parser grammar abstract class statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'abstract empty class': {
            code: '<?php abstract class MyBase {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'abstract',
                    className: 'MyBase',
                    members: []
                }]
            }
        },
        'abstract empty class with comments, erratic whitespace and case': {
            code: '<?php    aBstRACt /* rem */       class /* more comments */  MyBase{   }  ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    type: 'abstract',
                    className: 'MyBase',
                    members: []
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
