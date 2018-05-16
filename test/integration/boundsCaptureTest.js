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

describe('PHP Parser grammar bounds capture integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser({captureAllBounds: true});
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
                                'bounds': {
                                    'start': {
                                        'offset': 17,
                                        'line': 2,
                                        'column': 12
                                    },
                                    'end': {
                                        'offset': 23,
                                        'line': 2,
                                        'column': 18
                                    }
                                }
                            },
                            'consequent': {
                                'name': 'N_STRING_LITERAL',
                                'string': 'yes',
                                'bounds': {
                                    'start': {
                                        'offset': 26,
                                        'line': 2,
                                        'column': 21
                                    },
                                    'end': {
                                        'offset': 31,
                                        'line': 2,
                                        'column': 26
                                    }
                                }
                            },
                            'alternate': {
                                'name': 'N_VARIABLE',
                                'variable': 'yourVar',
                                'bounds': {
                                    'start': {
                                        'offset': 42,
                                        'line': 3,
                                        'column': 9
                                    },
                                    'end': {
                                        'offset': 50,
                                        'line': 3,
                                        'column': 17
                                    }
                                }
                            },
                            'bounds': {
                                'start': {
                                    'offset': 17,
                                    'line': 2,
                                    'column': 12
                                },
                                'end': {
                                    'offset': 50,
                                    'line': 3,
                                    'column': 17
                                }
                            }
                        },
                        'consequent': {
                            'name': 'N_STRING_LITERAL',
                            'string': 'no',
                            'bounds': {
                                'start': {
                                    'offset': 53,
                                    'line': 3,
                                    'column': 20
                                },
                                'end': {
                                    'offset': 57,
                                    'line': 3,
                                    'column': 24
                                }
                            }
                        },
                        'alternate': {
                            'name': 'N_STRING_LITERAL',
                            'string': 'maybe',
                            'bounds': {
                                'start': {
                                    'offset': 60,
                                    'line': 3,
                                    'column': 27
                                },
                                'end': {
                                    'offset': 67,
                                    'line': 3,
                                    'column': 34
                                }
                            }
                        },
                        'bounds': {
                            'start': {
                                'offset': 17,
                                'line': 2,
                                'column': 12
                            },
                            'end': {
                                'offset': 67,
                                'line': 3,
                                'column': 34
                            }
                        }
                    },
                    'bounds': {
                        'start': {
                            'offset': 10,
                            'line': 2,
                            'column': 5
                        },
                        'end': {
                            'offset': 68,
                            'line': 3,
                            'column': 35
                        }
                    }
                }],
                'bounds': {
                    'start': {
                        'offset': 0,
                        'line': 1,
                        'column': 1
                    },
                    'end': {
                        'offset': 68,
                        'line': 3,
                        'column': 35
                    }
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
                                'bounds': {
                                    'start': {
                                        'offset': 17,
                                        'line': 2,
                                        'column': 12
                                    },
                                    'end': {
                                        'offset': 26,
                                        'line': 2,
                                        'column': 21
                                    }
                                }
                            },
                            'right': [{
                                'operator': '+',
                                'operand': {
                                    'name': 'N_VARIABLE',
                                    'variable': 'secondVar',
                                    'bounds': {
                                        'start': {
                                            'offset': 29,
                                            'line': 2,
                                            'column': 24
                                        },
                                        'end': {
                                            'offset': 39,
                                            'line': 2,
                                            'column': 34
                                        }
                                    }
                                }
                            }],
                            'bounds': {
                                'start': {
                                    'offset': 17,
                                    'line': 2,
                                    'column': 12
                                },
                                'end': {
                                    'offset': 39,
                                    'line': 2,
                                    'column': 34
                                }
                            }
                        },
                        'right': [{
                            'operator': '+',
                            'operand': {
                                'name': 'N_VARIABLE',
                                'variable': 'thirdVar',
                                'bounds': {
                                    'start': {
                                        'offset': 42,
                                        'line': 2,
                                        'column': 37
                                    },
                                    'end': {
                                        'offset': 51,
                                        'line': 2,
                                        'column': 46
                                    }
                                }
                            }
                        }],
                        'bounds': {
                            'start': {
                                'offset': 17,
                                'line': 2,
                                'column': 12
                            },
                            'end': {
                                'offset': 51,
                                'line': 2,
                                'column': 46
                            }
                        }
                    },
                    'bounds': {
                        'start': {
                            'offset': 10,
                            'line': 2,
                            'column': 5
                        },
                        'end': {
                            'offset': 52,
                            'line': 2,
                            'column': 47
                        }
                    }
                }],
                'bounds': {
                    'start': {
                        'offset': 0,
                        'line': 1,
                        'column': 1
                    },
                    'end': {
                        'offset': 52,
                        'line': 2,
                        'column': 47
                    }
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
                                'bounds': {
                                    'start': {
                                        'offset': 17,
                                        'line': 2,
                                        'column': 12
                                    },
                                    'end': {
                                        'offset': 26,
                                        'line': 2,
                                        'column': 21
                                    }
                                }
                            },
                            'properties': [{
                                'property': {
                                    'name': 'N_STRING',
                                    'string': 'myProp',
                                    'bounds': {
                                        'start': {
                                            'offset': 28,
                                            'line': 2,
                                            'column': 23
                                        },
                                        'end': {
                                            'offset': 34,
                                            'line': 2,
                                            'column': 29
                                        }
                                    }
                                },
                                'bounds': {
                                    'start': {
                                        'offset': 26,
                                        'line': 2,
                                        'column': 21
                                    },
                                    'end': {
                                        'offset': 34,
                                        'line': 2,
                                        'column': 29
                                    }
                                }
                            }],
                            'bounds': {
                                'start': {
                                    'offset': 26,
                                    'line': 2,
                                    'column': 21
                                },
                                'end': {
                                    'offset': 34,
                                    'line': 2,
                                    'column': 29
                                }
                            }
                        },
                        'indices': [{
                            'index': {
                                'name': 'N_VARIABLE',
                                'variable': 'myIndex',
                                'bounds': {
                                    'start': {
                                        'offset': 35,
                                        'line': 2,
                                        'column': 30
                                    },
                                    'end': {
                                        'offset': 43,
                                        'line': 2,
                                        'column': 38
                                    }
                                }
                            },
                            'bounds': {
                                'start': {
                                    'offset': 34,
                                    'line': 2,
                                    'column': 29
                                },
                                'end': {
                                    'offset': 44,
                                    'line': 2,
                                    'column': 39
                                }
                            }
                        }],
                        'bounds': {
                            'start': {
                                'offset': 17,
                                'line': 2,
                                'column': 12
                            },
                            'end': {
                                'offset': 44,
                                'line': 2,
                                'column': 39
                            }
                        }
                    },
                    'bounds': {
                        'start': {
                            'offset': 10,
                            'line': 2,
                            'column': 5
                        },
                        'end': {
                            'offset': 45,
                            'line': 2,
                            'column': 40
                        }
                    }
                }],
                'bounds': {
                    'start': {
                        'offset': 0,
                        'line': 1,
                        'column': 1
                    },
                    'end': {
                        'offset': 45,
                        'line': 2,
                        'column': 40
                    }
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
                                    'bounds': {
                                        'start': {
                                            'offset': 21,
                                            'line': 2,
                                            'column': 16
                                        },
                                        'end': {
                                            'offset': 30,
                                            'line': 2,
                                            'column': 25
                                        }
                                    }
                                },
                                'properties': [{
                                    'property': {
                                        'name': 'N_STRING',
                                        'string': 'myProp',
                                        'bounds': {
                                            'start': {
                                                'offset': 32,
                                                'line': 2,
                                                'column': 27
                                            },
                                            'end': {
                                                'offset': 38,
                                                'line': 2,
                                                'column': 33
                                            }
                                        }
                                    },
                                    'bounds': {
                                        'start': {
                                            'offset': 30,
                                            'line': 2,
                                            'column': 25
                                        },
                                        'end': {
                                            'offset': 38,
                                            'line': 2,
                                            'column': 33
                                        }
                                    }
                                }],
                                'bounds': {
                                    'start': {
                                        'offset': 30,
                                        'line': 2,
                                        'column': 25
                                    },
                                    'end': {
                                        'offset': 38,
                                        'line': 2,
                                        'column': 33
                                    }
                                }
                            },
                            'indices': [{
                                'index': {
                                    'name': 'N_STRING_LITERAL',
                                    'string': 'myClassName',
                                    'bounds': {
                                        'start': {
                                            'offset': 39,
                                            'line': 2,
                                            'column': 34
                                        },
                                        'end': {
                                            'offset': 52,
                                            'line': 2,
                                            'column': 47
                                        }
                                    }
                                },
                                'bounds': {
                                    'start': {
                                        'offset': 38,
                                        'line': 2,
                                        'column': 33
                                    },
                                    'end': {
                                        'offset': 53,
                                        'line': 2,
                                        'column': 48
                                    }
                                }
                            }],
                            'bounds': {
                                'start': {
                                    'offset': 21,
                                    'line': 2,
                                    'column': 16
                                },
                                'end': {
                                    'offset': 53,
                                    'line': 2,
                                    'column': 48
                                }
                            }
                        },
                        'bounds': {
                            'start': {
                                'offset': 17,
                                'line': 2,
                                'column': 12
                            },
                            'end': {
                                'offset': 55,
                                'line': 2,
                                'column': 50
                            }
                        },
                        'args': []
                    },
                    'bounds': {
                        'start': {
                            'offset': 10,
                            'line': 2,
                            'column': 5
                        },
                        'end': {
                            'offset': 56,
                            'line': 2,
                            'column': 51
                        }
                    }
                }],
                'bounds': {
                    'start': {
                        'offset': 0,
                        'line': 1,
                        'column': 1
                    },
                    'end': {
                        'offset': 56,
                        'line': 2,
                        'column': 51
                    }
                }
            }
        },
        'return of object property inside "simple" string interpolation': {
            code: nowdoc(function () {/*<<<EOS
<?php
    return "hello $myObject->myProp";
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                'name': 'N_PROGRAM',
                'statements': [{
                    'name': 'N_RETURN_STATEMENT',
                    'expression': {
                        'name': 'N_STRING_EXPRESSION',
                        'parts': [{
                            'name': 'N_STRING_LITERAL',
                            'string': 'hello ',
                            'bounds': {
                                'start': {
                                    'offset': 18,
                                    'line': 2,
                                    'column': 13
                                },
                                'end': {
                                    'offset': 24,
                                    'line': 2,
                                    'column': 19
                                }
                            }
                        }, {
                            'name': 'N_OBJECT_PROPERTY',
                            'object': {
                                'name': 'N_VARIABLE',
                                'variable': 'myObject',
                                'bounds': {
                                    'start': {
                                        'offset': 24,
                                        'line': 2,
                                        'column': 19
                                    },
                                    'end': {
                                        'offset': 33,
                                        'line': 2,
                                        'column': 28
                                    }
                                }
                            },
                            'properties': [{
                                'property': {
                                    'name': 'N_STRING',
                                    'string': 'myProp',
                                    'bounds': {
                                        'start': {
                                            'offset': 35,
                                            'line': 2,
                                            'column': 30
                                        },
                                        'end': {
                                            'offset': 41,
                                            'line': 2,
                                            'column': 36
                                        }
                                    }
                                },
                                'bounds': {
                                    'start': {
                                        'offset': 33,
                                        'line': 2,
                                        'column': 28
                                    },
                                    'end': {
                                        'offset': 41,
                                        'line': 2,
                                        'column': 36
                                    }
                                }
                            }],
                            'bounds': {
                                'start': {
                                    'offset': 24,
                                    'line': 2,
                                    'column': 19
                                },
                                'end': {
                                    'offset': 41,
                                    'line': 2,
                                    'column': 36
                                }
                            }
                        }],
                        'bounds': {
                            'start': {
                                'offset': 17,
                                'line': 2,
                                'column': 12
                            },
                            'end': {
                                'offset': 42,
                                'line': 2,
                                'column': 37
                            }
                        }
                    },
                    'bounds': {
                        'start': {
                            'offset': 10,
                            'line': 2,
                            'column': 5
                        },
                        'end': {
                            'offset': 43,
                            'line': 2,
                            'column': 38
                        }
                    }
                }],
                'bounds': {
                    'start': {
                        'offset': 0,
                        'line': 1,
                        'column': 1
                    },
                    'end': {
                        'offset': 43,
                        'line': 2,
                        'column': 38
                    }
                }
            }
        },
        'return of variable value by wrapping in braces inside "simple" string interpolation': {
            code: nowdoc(function () {/*<<<EOS
<?php
    return "hello ${myVar}";
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                'name': 'N_PROGRAM',
                'statements': [{
                    'name': 'N_RETURN_STATEMENT',
                    'expression': {
                        'name': 'N_STRING_EXPRESSION',
                        'parts': [{
                            'name': 'N_STRING_LITERAL',
                            'string': 'hello ',
                            'bounds': {
                                'start': {
                                    'offset': 18,
                                    'line': 2,
                                    'column': 13
                                },
                                'end': {
                                    'offset': 24,
                                    'line': 2,
                                    'column': 19
                                }
                            }
                        }, {
                            'name': 'N_VARIABLE',
                            'variable': 'myVar',
                            'bounds': {
                                'start': {
                                    'offset': 24,
                                    'line': 2,
                                    'column': 19
                                },
                                'end': {
                                    'offset': 32,
                                    'line': 2,
                                    'column': 27
                                }
                            }
                        }],
                        'bounds': {
                            'start': {
                                'offset': 17,
                                'line': 2,
                                'column': 12
                            },
                            'end': {
                                'offset': 33,
                                'line': 2,
                                'column': 28
                            }
                        }
                    },
                    'bounds': {
                        'start': {
                            'offset': 10,
                            'line': 2,
                            'column': 5
                        },
                        'end': {
                            'offset': 34,
                            'line': 2,
                            'column': 29
                        }
                    }
                }],
                'bounds': {
                    'start': {
                        'offset': 0,
                        'line': 1,
                        'column': 1
                    },
                    'end': {
                        'offset': 34,
                        'line': 2,
                        'column': 29
                    }
                }
            }
        },
        'return of variable-variable inside "simple" string interpolation': {
            code: nowdoc(function () {/*<<<EOS
<?php
    return "hello ${$myVar}";
EOS
*/;}), // jshint ignore:line
            expectedAST: {
                'name': 'N_PROGRAM',
                'statements': [{
                    'name': 'N_RETURN_STATEMENT',
                    'expression': {
                        'name': 'N_STRING_EXPRESSION',
                        'parts': [{
                            'name': 'N_STRING_LITERAL',
                            'string': 'hello ',
                            'bounds': {
                                'start': {
                                    'offset': 18,
                                    'line': 2,
                                    'column': 13
                                },
                                'end': {
                                    'offset': 24,
                                    'line': 2,
                                    'column': 19
                                }
                            }
                        }, {
                            'name': 'N_VARIABLE_EXPRESSION',
                            'expression': {
                                'name': 'N_VARIABLE',
                                'variable': 'myVar',
                                'bounds': {
                                    'start': {
                                        'offset': 26,
                                        'line': 2,
                                        'column': 21
                                    },
                                    'end': {
                                        'offset': 32,
                                        'line': 2,
                                        'column': 27
                                    }
                                }
                            },
                            'bounds': {
                                'start': {
                                    'offset': 24,
                                    'line': 2,
                                    'column': 19
                                },
                                'end': {
                                    'offset': 33,
                                    'line': 2,
                                    'column': 28
                                }
                            }
                        }],
                        'bounds': {
                            'start': {
                                'offset': 17,
                                'line': 2,
                                'column': 12
                            },
                            'end': {
                                'offset': 34,
                                'line': 2,
                                'column': 29
                            }
                        }
                    },
                    'bounds': {
                        'start': {
                            'offset': 10,
                            'line': 2,
                            'column': 5
                        },
                        'end': {
                            'offset': 35,
                            'line': 2,
                            'column': 30
                        }
                    }
                }],
                'bounds': {
                    'start': {
                        'offset': 0,
                        'line': 1,
                        'column': 1
                    },
                    'end': {
                        'offset': 35,
                        'line': 2,
                        'column': 30
                    }
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
