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

describe('PHP Parser grammar namespace {...} construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'first level namespace definition with no contents': {
            code: '<?php namespace Test;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Test',
                    statements: []
                }]
            }
        },
        'first level namespace definition with one expression statement': {
            code: '<?php namespace Test; myFunc();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Test',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }]
            }
        },
        'top level namespace definitions with single expression statements': {
            code: '<?php namespace Here; myFunc(); namespace There; yourFunc();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Here',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }, {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'There',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
                        }
                    }]
                }]
            }
        },
        'top level braced namespace definitions with single expression statements': {
            code: '<?php namespace Here { myFunc(); } namespace There { yourFunc(); }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Here',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }, {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'There',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
                        }
                    }]
                }]
            }
        },
        'top level braced global namespace definition with single expression statements': {
            code: '<?php namespace Here { myFunc(); } namespace { yourFunc(); }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Here',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }, {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: '',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
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
