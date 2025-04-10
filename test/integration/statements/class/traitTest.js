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
    phpTools = require('../../../tools');

describe('PHP Parser grammar class definition statement using trait integration', function () {
    var parser;

    beforeEach(function () {
        parser = phpTools.createParser();
    });

    _.each({
        'empty class that uses a trait by single bareword with no conflicts': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass {
        use MyTrait;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_USE_TRAIT_STATEMENT',
                        traitNames: ['MyTrait']
                    }]
                }]
            }
        },
        'empty class that uses a trait by namespaced name with no conflicts': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass {
        use My\Stuff\MyTrait;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_USE_TRAIT_STATEMENT',
                        traitNames: ['My\\Stuff\\MyTrait']
                    }]
                }]
            }
        },
        'empty class that uses two traits in one use statement by namespaced name with no conflicts': {
            code: nowdoc(function () {/*<<<EOS
<?php
    class MyClass {
        use My\Stuff\MyTrait, Your\Stuff\YourTrait;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_CLASS_STATEMENT',
                    className: 'MyClass',
                    members: [{
                        name: 'N_USE_TRAIT_STATEMENT',
                        traitNames: ['My\\Stuff\\MyTrait', 'Your\\Stuff\\YourTrait']
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            it('should return the expected AST', function () {
                expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
            });
        });
    });
});
