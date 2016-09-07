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
                                    'length': 0,
                                    'line': 2,
                                    'column': 18,
                                    'offset': 23
                                }
                            },
                            'consequent': {
                                'name': 'N_STRING_LITERAL',
                                'string': 'yes',
                                'offset': {
                                    'length': 0,
                                    'line': 2,
                                    'column': 26,
                                    'offset': 31
                                }
                            },
                            'alternate': {
                                'name': 'N_VARIABLE',
                                'variable': 'yourVar',
                                'offset': {
                                    'length': 0,
                                    'line': 3,
                                    'column': 17,
                                    'offset': 50
                                }
                            },
                            'offset': {
                                'length': 43,
                                'line': 2,
                                'column': 19,
                                'offset': 24
                            }
                        },
                        'consequent': {
                            'name': 'N_STRING_LITERAL',
                            'string': 'no',
                            'offset': {
                                'length': 0,
                                'line': 3,
                                'column': 24,
                                'offset': 57
                            }
                        },
                        'alternate': {
                            'name': 'N_STRING_LITERAL',
                            'string': 'maybe',
                            'offset': {
                                'length': 0,
                                'line': 3,
                                'column': 34,
                                'offset': 67
                            }
                        },
                        'offset': {
                            'length': 43,
                            'line': 2,
                            'column': 19,
                            'offset': 24
                        }
                    },
                    'offset': {
                        'length': 51,
                        'line': 2,
                        'column': 11,
                        'offset': 16
                    }
                }],
                'offset': {
                    'length': 58,
                    'line': 2,
                    'column': 5,
                    'offset': 10
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
                                    // FIXME: Why is length 0 here? And column is wrong too
                                    'length': 0,
                                    'line': 2,
                                    'column': 21,
                                    'offset': 26
                                }
                            },
                            'right': [
                                {
                                    'operator': '+',
                                    'operand': {
                                        'name': 'N_VARIABLE',
                                        'variable': 'secondVar',
                                        'offset': {
                                            'length': 0,
                                            'line': 2,
                                            'column': 34,
                                            'offset': 39
                                        }
                                    }
                                }
                            ],
                            'offset': {
                                'length': 24,
                                'line': 2,
                                'column': 22,
                                'offset': 27
                            }
                        },
                        'right': [
                            {
                                'operator': '+',
                                'operand': {
                                    'name': 'N_VARIABLE',
                                    'variable': 'thirdVar',
                                    'offset': {
                                        'length': 0,
                                        'line': 2,
                                        'column': 46,
                                        'offset': 51
                                    }
                                }
                            }
                        ],
                        'offset': {
                            'length': 0,
                            'line': 2,
                            'column': 46,
                            'offset': 51
                        }
                    },
                    'offset': {
                        'length': 35,
                        'line': 2,
                        'column': 11,
                        'offset': 16
                    }
                }],
                'offset': {
                    'length': 42,
                    'line': 2,
                    'column': 5,
                    'offset': 10
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
                                    'length': 6,
                                    'line': 2,
                                    'column': 23,
                                    'offset': 28
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
                                    'length': 0,
                                    'line': 2,
                                    'column': 38,
                                    'offset': 43
                                }
                            },
                            'offset': {
                                'length': 8,
                                'line': 2,
                                'column': 30,
                                'offset': 35
                            }
                        }],
                        'offset': {
                            'length': 0,
                            'line': 2,
                            'column': 39,
                            'offset': 44
                        }
                    },
                    'offset': {
                        'length': 28,
                        'line': 2,
                        'column': 11,
                        'offset': 16
                    }
                }],
                'offset': {
                    'length': 35,
                    'line': 2,
                    'column': 5,
                    'offset': 10
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
