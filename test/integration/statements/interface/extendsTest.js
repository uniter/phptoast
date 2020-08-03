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

describe('PHP Parser grammar interface statement "extends" integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'empty interface followed by derived interface in current namespace': {
            code: '<?php interface Animal {} interface Human extends Animal {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Animal',
                    members: []
                }, {
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Human',
                    extend: ['Animal'],
                    members: []
                }]
            }
        },
        'empty derived interface extending interface in another namespace': {
            code: '<?php interface Drill extends \\Vendor\\Toolbox\\Tool {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Drill',
                    extend: ['\\Vendor\\Toolbox\\Tool'],
                    members: []
                }]
            }
        },
        'derived interface extending multiple other interfaces': {
            code: nowdoc(function () {/*<<<EOS
<?php
    interface Planet extends Rotatable, Orbitable {
        const SHAPE = 'sphere';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_INTERFACE_STATEMENT',
                    interfaceName: 'Planet',
                    extend: ['Rotatable', 'Orbitable'],
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
