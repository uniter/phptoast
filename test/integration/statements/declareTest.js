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

describe('PHP Parser grammar "declare" statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'declaring strict_types as on': {
            code: '<?php declare(strict_types=1);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_DECLARE_STATEMENT',
                    directives: [{
                        name: 'N_STRICT_TYPES_DIRECTIVE',
                        value: {
                            name: 'N_INTEGER',
                            number: '1'
                        }
                    }]
                }]
            }
        },
        'declaring strict_types as off with erratic whitespace': {
            code: '<?php declare(strict_types  =    0 )   ;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_DECLARE_STATEMENT',
                    directives: [{
                        name: 'N_STRICT_TYPES_DIRECTIVE',
                        value: {
                            name: 'N_INTEGER',
                            number: '0'
                        }
                    }]
                }]
            }
        },
        'declaring strict_types as off with mixed case': {
            code: '<?php dEClarE(strict_types=0);',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_DECLARE_STATEMENT',
                    directives: [{
                        name: 'N_STRICT_TYPES_DIRECTIVE',
                        value: {
                            name: 'N_INTEGER',
                            number: '0'
                        }
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            // Pretty-print the code strings so any non-printable characters are readable.
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
