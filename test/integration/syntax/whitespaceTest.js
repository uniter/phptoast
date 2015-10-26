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
    engineTools = require('../tools'),
    phpTools = require('../../tools');

describe('PHP Parser syntax whitespace handling integration', function () {
    var parser;

    function check(scenario) {
        engineTools.check(function () {
            return {
                parser: parser
            };
        }, scenario);
    }

    beforeEach(function () {
        parser = phpTools.createParser();
    });

    _.each({
        'function call followed by a single space': {
            code: '<?php open(); ',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_EXPRESSION_STATEMENT',
                    expression: {
                        name: 'N_FUNCTION_CALL',
                        func: {
                            name: 'N_STRING',
                            string: 'open'
                        },
                        args: []
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            check(scenario);
        });
    });
});
