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
    tools = require('../tools');

describe('PHP Parser grammar offset capture integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser({captureAllOffsets: true});
    });

    _.each({
        'return with nested ternary expression': {
            code: nowdoc(function () {/*<<<EOS
<?php
    return $myVar ? 'yes' :
        $yourVar ? 'no' : 'maybe';
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                'name': 'N_PROGRAM',
                'statements': [{
                    'name': 'N_RETURN_STATEMENT',
                    'expression': {
                        'name': 'N_TERNARY',
                        'condition': {
                            'name': 'N_TERNARY',
                            'condition': {
                                'name': 'N_VARIABLE',
                                'variable': 'myVar',
                                'offset': {
                                    'length': 6,
                                    'line': 2,
                                    'column': 12,
                                    'offset': 17
                                }
                            },
                            'consequent': {
                                'name': 'N_STRING_LITERAL',
                                'string': 'yes',
                                'offset': {
                                    'length': 5,
                                    'line': 2,
                                    'column': 21,
                                    'offset': 26
                                }
                            },
                            'alternate': {
                                'name': 'N_VARIABLE',
                                'variable': 'yourVar',
                                'offset': {
                                    'length': 8,
                                    'line': 3,
                                    'column': 9,
                                    'offset': 42
                                }
                            },
                            'offset': {
                                'length': 33,
                                'line': 2,
                                'column': 12,
                                'offset': 17
                            }
                        },
                        'consequent': {
                            'name': 'N_STRING_LITERAL',
                            'string': 'no',
                            'offset': {
                                'length': 4,
                                'line': 3,
                                'column': 20,
                                'offset': 53
                            }
                        },
                        'alternate': {
                            'name': 'N_STRING_LITERAL',
                            'string': 'maybe',
                            'offset': {
                                'length': 7,
                                'line': 3,
                                'column': 27,
                                'offset': 60
                            }
                        },
                        'offset': {
                            'length': 50,
                            'line': 2,
                            'column': 12,
                            'offset': 17
                        }
                    },
                    'offset': {
                        'length': 58,
                        'line': 2,
                        'column': 5,
                        'offset': 10
                    }
                }],
                'offset': {
                    'length': 68,
                    'line': 1,
                    'column': 1,
                    'offset': 0
                }
            }
        },
        'return with nested binary expression of same operator': {
            code: nowdoc(function () {/*<<<EOS
<?php
    return $firstVar + $secondVar + $thirdVar;
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                'name': 'N_PROGRAM',
                'statements': [{
                    'name': 'N_RETURN_STATEMENT',
                    'expression': {
                        'name': 'N_EXPRESSION',
                        'left': {
                            'name': 'N_EXPRESSION',
                            'left': {
                                'name': 'N_VARIABLE',
                                'variable': 'firstVar',
                                'offset': {
                                    'length': 9,
                                    'line': 2,
                                    'column': 12,
                                    'offset': 17
                                }
                            },
                            'right': [{
                                'operator': '+',
                                'operand': {
                                    'name': 'N_VARIABLE',
                                    'variable': 'secondVar',
                                    'offset': {
                                        'length': 10,
                                        'line': 2,
                                        'column': 24,
                                        'offset': 29
                                    }
                                }
                            }],
                            'offset': {
                                'length': 22,
                                'line': 2,
                                'column': 12,
                                'offset': 17
                            }
                        },
                        'right': [{
                            'operator': '+',
                            'operand': {
                                'name': 'N_VARIABLE',
                                'variable': 'thirdVar',
                                'offset': {
                                    'length': 9,
                                    'line': 2,
                                    'column': 37,
                                    'offset': 42
                                }
                            }
                        }],
                        'offset': {
                            'length': 34,
                            'line': 2,
                            'column': 12,
                            'offset': 17
                        }
                    },
                    'offset': {
                        'length': 42,
                        'line': 2,
                        'column': 5,
                        'offset': 10
                    }
                }],
                'offset': {
                    'length': 52,
                    'line': 1,
                    'column': 1,
                    'offset': 0
                }
            }
        },
        'return with array index of object property lookup': {
            code: nowdoc(function () {/*<<<EOS
<?php
    return $myObject->myProp[$myIndex];
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                'name': 'N_PROGRAM',
                'statements': [{
                    'name': 'N_RETURN_STATEMENT',
                    'expression': {
                        'name': 'N_ARRAY_INDEX',
                        'array': {
                            'name': 'N_OBJECT_PROPERTY',
                            'object': {
                                'name': 'N_VARIABLE',
                                'variable': 'myObject',
                                'offset': {
                                    'length': 9,
                                    'line': 2,
                                    'column': 12,
                                    'offset': 17
                                }
                            },
                            'properties': [{
                                'property': {
                                    'name': 'N_STRING',
                                    'string': 'myProp',
                                    'offset': {
                                        'length': 6,
                                        'line': 2,
                                        'column': 23,
                                        'offset': 28
                                    }
                                },
                                'offset': {
                                    'length': 8,
                                    'line': 2,
                                    'column': 21,
                                    'offset': 26
                                }
                            }],
                            'offset': {
                                'length': 8,
                                'line': 2,
                                'column': 21,
                                'offset': 26
                            }
                        },
                        'indices': [{
                            'index': {
                                'name': 'N_VARIABLE',
                                'variable': 'myIndex',
                                'offset': {
                                    'length': 8,
                                    'line': 2,
                                    'column': 30,
                                    'offset': 35
                                }
                            },
                            'offset': {
                                'length': 10,
                                'line': 2,
                                'column': 29,
                                'offset': 34
                            }
                        }],
                        'offset': {
                            'length': 27,
                            'line': 2,
                            'column': 12,
                            'offset': 17
                        }
                    },
                    'offset': {
                        'length': 35,
                        'line': 2,
                        'column': 5,
                        'offset': 10
                    }
                }],
                'offset': {
                    'length': 45,
                    'line': 1,
                    'column': 1,
                    'offset': 0
                }
            }
        },
        'return of new expression with dynamic class with array index of object property lookup': {
            code: nowdoc(function () {/*<<<EOS
<?php
    return new $myObject->myProp['myClassName']();
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                'name': 'N_PROGRAM',
                'statements': [{
                    'name': 'N_RETURN_STATEMENT',
                    'expression': {
                        'name': 'N_NEW_EXPRESSION',
                        'className': {
                            'name': 'N_ARRAY_INDEX',
                            'array': {
                                'name': 'N_OBJECT_PROPERTY',
                                'object': {
                                    'name': 'N_VARIABLE',
                                    'variable': 'myObject',
                                    'offset': {
                                        'length': 9,
                                        'line': 2,
                                        'column': 16,
                                        'offset': 21
                                    }
                                },
                                'properties': [{
                                    'property': {
                                        'name': 'N_STRING',
                                        'string': 'myProp',
                                        'offset': {
                                            'length': 6,
                                            'line': 2,
                                            'column': 27,
                                            'offset': 32
                                        }
                                    },
                                    'offset': {
                                        'length': 8,
                                        'line': 2,
                                        'column': 25,
                                        'offset': 30
                                    }
                                }],
                                'offset': {
                                    'length': 8,
                                    'line': 2,
                                    'column': 25,
                                    'offset': 30
                                }
                            },
                            'indices': [{
                                'index': {
                                    'name': 'N_STRING_LITERAL',
                                    'string': 'myClassName',
                                    'offset': {
                                        'length': 13,
                                        'line': 2,
                                        'column': 34,
                                        'offset': 39
                                    }
                                },
                                'offset': {
                                    'length': 15,
                                    'line': 2,
                                    'column': 33,
                                    'offset': 38
                                }
                            }],
                            'offset': {
                                'length': 32,
                                'line': 2,
                                'column': 16,
                                'offset': 21
                            }
                        },
                        'offset': {
                            'length': 38,
                            'line': 2,
                            'column': 12,
                            'offset': 17
                        },
                        'args': []
                    },
                    'offset': {
                        'length': 46,
                        'line': 2,
                        'column': 5,
                        'offset': 10
                    }
                }],
                'offset': {
                    'length': 56,
                    'line': 1,
                    'column': 1,
                    'offset': 0
                }
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
