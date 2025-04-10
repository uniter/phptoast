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

describe('PHP Parser grammar trait statement integration', function () {
    var parser;

    beforeEach(function () {
        parser = phpTools.createParser();
    });

    _.each({
        'empty trait that does not define any member nor use any other trait': {
            code: '<?php trait MyTrait {}',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'MyTrait',
                    members: []
                }]
            }
        },
        'trait that uses another': {
            code: nowdoc(function () {/*<<<EOS
<?php
trait MyTrait {
    use Yours\YourTrait;
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'MyTrait',
                    members: [{
                        name: 'N_USE_TRAIT_STATEMENT',
                        traitNames: ['Yours\\YourTrait']
                    }]
                }]
            }
        },
        'trait with one public instance property with no value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    trait OnePub {
        public $aPublicProp;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'OnePub',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'aPublicProp'
                        }
                    }]
                }]
            }
        },
        'trait with one public instance property with string value': {
            code: nowdoc(function () {/*<<<EOS
<?php
    trait OnePub {
        public $aPublicProp = 'yep';
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'OnePub',
                    members: [{
                        name: 'N_INSTANCE_PROPERTY_DEFINITION',
                        visibility: 'public',
                        variable: {
                            name: 'N_VARIABLE',
                            variable: 'aPublicProp'
                        },
                        value: {
                            name: 'N_STRING_LITERAL',
                            string: 'yep'
                        }
                    }]
                }]
            }
        },
        'trait with one public instance method': {
            code: nowdoc(function () {/*<<<EOS
<?php
    trait OneMethod {
        public function printIt($what) {
            echo $what;
        }
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'OneMethod',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        visibility: 'public',
                        func: {
                            name: 'N_STRING',
                            string: 'printIt'
                        },
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'what'
                            }
                        }],
                        body: {
                            name: 'N_COMPOUND_STATEMENT',
                            statements: [{
                                name: 'N_ECHO_STATEMENT',
                                expressions: [{
                                    name: 'N_VARIABLE',
                                    variable: 'what'
                                }]
                            }]
                        }
                    }]
                }]
            }
        },
        'trait with one public instance method with one body statement not wrapped in braces': {
            code: nowdoc(function () {/*<<<EOS
<?php
    trait OneMethod {
        public function printIt($what) echo $what;
    }
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'OneMethod',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        visibility: 'public',
                        func: {
                            name: 'N_STRING',
                            string: 'printIt'
                        },
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'what'
                            }
                        }],
                        body: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_VARIABLE',
                                variable: 'what'
                            }]
                        }
                    }]
                }]
            }
        },
        'trait with one implicitly public instance method': {
            code: nowdoc(function () {/*<<<EOS
<?php
trait OneMethod {
    function printIt($msg) echo $msg;
}
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_TRAIT_STATEMENT',
                    traitName: 'OneMethod',
                    members: [{
                        name: 'N_METHOD_DEFINITION',
                        visibility: 'public',
                        func: {
                            name: 'N_STRING',
                            string: 'printIt'
                        },
                        args: [{
                            name: 'N_ARGUMENT',
                            variable: {
                                name: 'N_VARIABLE',
                                variable: 'msg'
                            }
                        }],
                        body: {
                            name: 'N_ECHO_STATEMENT',
                            expressions: [{
                                name: 'N_VARIABLE',
                                variable: 'msg'
                            }]
                        }
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            describe(description, function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
