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

describe('PHP Parser grammar class definition statement interface "implements" integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'class implementing a single interface': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Planet implements Rotatable {
        const SHAPE = 'sphere';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Planet',
                    implement: ['Rotatable'],
                    members: [{
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'SHAPE',
                            value: {
                                name: 'N_STRING_LITERAL',
                                string: 'sphere'
                            }
                        }]
                    }]
                }]
            }
        },
        'class implementing two interfaces': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class Planet implements Rotatable, Orbitable {
        const SHAPE = 'sphere';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'Planet',
                    implement: ['Rotatable', 'Orbitable'],
                    members: [{
                        name: 'N_CONSTANT_DEFINITION',
                        constants: [{
                            constant: 'SHAPE',
                            value: {
                                name: 'N_STRING_LITERAL',
                                string: 'sphere'
                            }
                        }]
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
