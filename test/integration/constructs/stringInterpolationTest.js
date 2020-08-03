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

describe('PHP Parser grammar string interpolation construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'simple syntax: string containing only an interpolated variable': {
            code: '<?php return "$myValue";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_VARIABLE',
                            variable: 'myValue'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string containing some text followed by an interpolated variable': {
            code: '<?php return "abc$myValue";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'abc'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myValue'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string containing two interpolated variables touching': {
            code: '<?php return "$value1$value2";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_VARIABLE',
                            variable: 'value1'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'value2'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces)': {
            code: '<?php return "before${value}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'value'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) with leading whitespace': {
            code: '<?php return "before${ value}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'value'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) array dereference': {
            code: '<?php return "before ${myArray[21]} after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before '
                        }, {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'myArray'
                            },
                            indices: [{
                                index: {
                                    name: 'N_INTEGER',
                                    number: '21'
                                }
                            }]
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: ' after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) instance property dereference': {
            code: '<?php return "before${myObject->myProp}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'myObject'
                            },
                            properties: [{
                                property: {
                                    name: 'N_STRING',
                                    string: 'myProp'
                                }
                            }]
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable array element dereference': {
            code: '<?php return "before${$myArray[21]}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_ARRAY_INDEX',
                                array: {
                                    name: 'N_VARIABLE',
                                    variable: 'myArray'
                                },
                                indices: [{
                                    index: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }]
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable instance property dereference': {
            code: '<?php return "before${$myObject->myProp}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_OBJECT_PROPERTY',
                                object: {
                                    name: 'N_VARIABLE',
                                    variable: 'myObject'
                                },
                                properties: [{
                                    property: {
                                        name: 'N_STRING',
                                        string: 'myProp'
                                    }
                                }]
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable static method call dereference': {
            code: '<?php return "before${MyClass::myStaticMethod()}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_STATIC_METHOD_CALL',
                                className: {
                                    name: 'N_STRING',
                                    string: 'MyClass'
                                },
                                method: {
                                    name: 'N_STRING',
                                    string: 'myStaticMethod'
                                },
                                args: []
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable dynamic static method call dereference': {
            code: '<?php return "before${MyClass::{\'my\' . \'StaticMethod\'}()}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_STATIC_METHOD_CALL',
                                className: {
                                    name: 'N_STRING',
                                    string: 'MyClass'
                                },
                                method: {
                                    name: 'N_EXPRESSION',
                                    left: {
                                        name: 'N_STRING_LITERAL',
                                        string: 'my'
                                    },
                                    right: [{
                                        operator: '.',
                                        operand: {
                                            name: 'N_STRING_LITERAL',
                                            string: 'StaticMethod'
                                        }
                                    }]
                                },
                                args: []
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable static property dereference': {
            code: '<?php return "before${MyClass::$myStaticProp}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_STATIC_PROPERTY',
                                className: {
                                    name: 'N_STRING',
                                    string: 'MyClass'
                                },
                                property: {
                                    name: 'N_STRING',
                                    string: 'myStaticProp'
                                }
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable static class constant dereference': {
            code: '<?php return "before${MyClass::MY_CONST}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_CLASS_CONSTANT',
                                className: {
                                    name: 'N_STRING',
                                    string: 'MyClass'
                                },
                                constant: 'MY_CONST'
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable dynamic class constant dereference': {
            code: '<?php return "before${$myObject::MY_CONST}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_CLASS_CONSTANT',
                                className: {
                                    name: 'N_VARIABLE',
                                    variable: 'myObject'
                                },
                                constant: 'MY_CONST'
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with ${...} (dollar before braces) variable-variable class constant chained with array index dereference': {
            code: '<?php return "before${MyClass::MY_CONST[21]}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_ARRAY_INDEX',
                                array: {
                                    name: 'N_CLASS_CONSTANT',
                                    className: {
                                        name: 'N_STRING',
                                        string: 'MyClass'
                                    },
                                    constant: 'MY_CONST'
                                },
                                indices: [{
                                    index: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }]
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with whitespace surrounding variable': {
            code: '<?php return "Increase $what with $control";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'Increase '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'what'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: ' with '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'control'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with double dollar (NOT valid variable variable syntax in strings)': {
            code: '<?php return "The number is $$myVar.";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            // Note that the leading dollar is parsed as plain text
                            string: 'The number is $'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'myVar'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: '.'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with text surrounding variable variable': {
            code: '<?php return "The number is ${$myVar}.";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'The number is '
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_VARIABLE',
                                variable: 'myVar'
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: '.'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with apparent method call should be parsed as property dereference': {
            code: '<?php return "They probably meant to use the $complex->syntax() instead.";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'They probably meant to use the '
                        }, {
                            name: 'N_OBJECT_PROPERTY',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'complex'
                            },
                            properties: [{
                                property: {
                                    name: 'N_STRING',
                                    string: 'syntax'
                                }
                            }]
                        }, {
                            name: 'N_STRING_LITERAL',
                            // Parentheses should not be parsed as a call using the simple syntax
                            string: '() instead.'
                        }]
                    }
                }]
            }
        },
        'simple syntax: string interpolation with space between brace and dollar (not valid complex syntax)': {
            code: '<?php return "before{ $value}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before{ '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'value'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: '}after'
                        }]
                    }
                }]
            }
        },
        'complex syntax: string interpolation with {$...} (dollar inside braces)': {
            code: '<?php return "before{$value}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'value'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'complex syntax: string interpolation with array element dereference': {
            code: '<?php return "before{$myArray[21]}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_ARRAY_INDEX',
                            array: {
                                name: 'N_VARIABLE',
                                variable: 'myArray'
                            },
                            indices: [{
                                index: {
                                    name: 'N_INTEGER',
                                    number: '21'
                                }
                            }]
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'complex syntax: string interpolation with variable-variable array element dereference': {
            code: '<?php return "before{${$myArray[21]}}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_VARIABLE_EXPRESSION',
                            expression: {
                                name: 'N_ARRAY_INDEX',
                                array: {
                                    name: 'N_VARIABLE',
                                    variable: 'myArray'
                                },
                                indices: [{
                                    index: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    }
                                }]
                            }
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'complex syntax: string interpolation with method call containing ternary with whitespace': {
            code: '<?php return "before{$myObject->myMethod($myBool ?   21 : 100)}after";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'before'
                        }, {
                            name: 'N_METHOD_CALL',
                            object: {
                                name: 'N_VARIABLE',
                                variable: 'myObject'
                            },
                            calls: [{
                                func: {
                                    name: 'N_STRING',
                                    string: 'myMethod'
                                },
                                args: [{
                                    name: 'N_TERNARY',
                                    condition: {
                                        name: 'N_VARIABLE',
                                        variable: 'myBool'
                                    },
                                    consequent: {
                                        name: 'N_INTEGER',
                                        number: '21'
                                    },
                                    alternate: {
                                        name: 'N_INTEGER',
                                        number: '100'
                                    }
                                }]
                            }]
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: 'after'
                        }]
                    }
                }]
            }
        },
        'string with random dollars and braces that are not for interpolation': {
            code: '<?php return "Here is {my text $ over $4 $. he{\\$re.";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_LITERAL',
                        string: 'Here is {my text $ over $4 $. he{$re.'
                    }
                }]
            }
        },
        'string with a mix of valid interpolation and random dollars and braces': {
            code: '<?php return "Over $place is {my text $ over $4 $. he{\\$re.";',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_RETURN_STATEMENT',
                    expression: {
                        name: 'N_STRING_EXPRESSION',
                        parts: [{
                            name: 'N_STRING_LITERAL',
                            string: 'Over '
                        }, {
                            name: 'N_VARIABLE',
                            variable: 'place'
                        }, {
                            name: 'N_STRING_LITERAL',
                            string: ' is {my text $ over $4 $. he{$re.'
                        }]
                    }
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });
});
