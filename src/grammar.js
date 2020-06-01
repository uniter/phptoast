/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

/*
 * Elimination of left-recursion: http://web.cs.wpi.edu/~kal/PLT/PLT4.1.2.html
 */

var _ = require('microdash'),
    lowercaseReplacements = [{
        pattern: /.*/g,
        replacement: function (all) {
            return all.toLowerCase();
        }
    }],
    uppercaseReplacements = [{
        pattern: /.*/g,
        replacement: function (all) {
            return all.toUpperCase();
        }
    }],
    stringEscapeReplacements = [{
        pattern: /\\([\$efnrtv\\"])/g,
        replacement: function (all, chr) {
            return {
                'e': '\x1B', // Escape
                'f': '\f',   // Form feed
                'n': '\n',   // Linefeed
                'r': '\r',   // Carriage-return
                't': '\t',   // Horizontal tab
                'v': '\x0B', // Vertical tab (JS '\v' escape not supported in IE < 9)
                '\\': '\\',
                '$': '$',
                '"': '"'
            }[chr];
        }
    }],
    singleQuotedStringEscapeReplacements = [{
        // Escaped backslash or escaped single quote should result in just the escaped character
        // All other characters cannot be escaped, the backslash will be left untouched
        pattern: /\\([\\'])/g,
        replacement: '$1'
    }],
    buildTree = function (first, rest, buildNode) {
        var i,
            length,
            result = first;

        for (i = 0, length = rest.length; i < length; i++) {
            result = buildNode(result, rest[i]);
        }

        return result;
    },
    buildBinaryExpression = function (first, rest) {
        // Transform the captured flat list into an AST
        // which will eliminate any ambiguity over precedence.
        return buildTree(first, rest, function (result, element) {
            var binaryNode = {
                name: 'N_EXPRESSION',
                left: result,
                right: [
                    {
                        operator: element.operator,
                        operand: element.operand
                    }
                ]
            };

            if (result.bounds) {
                binaryNode.bounds = {
                    start: result.bounds.start,
                    end: element.bounds.end
                };
            }

            return binaryNode;
        });
    },
    buildTernaryExpression = function (condition, rest) {
        var ternaryNode = {
                name: 'N_TERNARY',
                condition: condition
            },
            ternaryNodeStack = [];

        function completeTernary(alternateNode) {
            ternaryNode.alternate = alternateNode;

            if (condition.bounds) {
                ternaryNode.bounds = {
                    start: ternaryNode.condition.bounds.start,
                    end: alternateNode.bounds.end
                };
            }
        }

        _.each(rest, function (element) {
            var nestedTernaryNode;

            if (element.consequent) {
                if (ternaryNode.consequent && ternaryNode.alternate) {
                    // Already got a consequent - must be nested - all existing expression is the condition
                    // of the nested ternary
                    // - eg. `$myVar = 21 ? 22 : 23 ? 24 : 25;`
                    nestedTernaryNode = {
                        name: 'N_TERNARY',
                        condition: ternaryNode,
                        consequent: element.consequent
                    };
                    ternaryNode = nestedTernaryNode;
                    ternaryNodeStack.push(ternaryNode);
                } else if (ternaryNode.consequent && !ternaryNode.alternate) {
                    // Already got an alternate - must be nested
                    // - eg. `21 ? 22 ? 23 : 24 : 25`
                    nestedTernaryNode = {
                        name: 'N_TERNARY',
                        condition: ternaryNode.consequent,
                        consequent: element.consequent
                    };
                    ternaryNode.consequent = nestedTernaryNode;
                    ternaryNodeStack.push(ternaryNode);
                    ternaryNode = nestedTernaryNode;
                } else {
                    ternaryNode.consequent = element.consequent;
                    ternaryNodeStack.push(ternaryNode);
                }
            } else if (element.alternate) {
                completeTernary(element.alternate);
                ternaryNode = ternaryNodeStack.pop();
            } else if (element.shorthand) {
                ternaryNode.consequent = null;
                completeTernary(element.shorthand);
            }
        });

        return ternaryNode;
    },
    PHPErrorHandler = require('./ErrorHandler'),
    PHPGrammarState = require('./State');

module.exports = {
    ErrorHandler: PHPErrorHandler,
    State: PHPGrammarState,
    ignore: 'N_IGNORE',
    offsets: 'offset',
    rules: {
        'T_ABSTRACT': /abstract\b/i,
        'T_AND_EQUAL': /&=/i,
        'T_ARRAY': /array\b/i,
        'T_ARRAY_CAST': /\(\s*array\s*\)/i,
        'T_AS': /as\b/i,

        // Anything below ASCII 32 except \t (0x09), \n (0x0a) and \r (0x0d)
        'T_BAD_CHARACTER': /(?![\u0009\u000A\u000D])[\u0000-\u001F]/,

        'T_BINARY_CAST': /\(\s*binary\s*\)/i,
        'T_BOOLEAN_AND': /&&/i,
        'T_BOOLEAN_OR': /\|\|/,
        'T_BOOL_CAST': /\(\s*bool(ean)?\s*\)/i,
        'T_BREAK': /break\b/i,
        'T_CALLABLE': /callable\b/i,
        'T_CASE': /case\b/i,
        'T_CATCH': /catch\b/i,
        'T_CLASS': /class\b/i,
        'T_CLASS_C': /__CLASS__/i,
        'T_CLONE': /clone/i,
        'T_CLOSE_TAG': /[?%]>\n?/,
        'T_COMMENT': /(?:\/\/|#)(.*?)(?:[\r\n]+|$)|\/\*(?!\*)([\s\S]*?)\*\//,
        'T_CONCAT_EQUAL': /\.=/,
        'T_CONST': /const\b/i,
        // Single-quoted strings - see N_STRING_EXPRESSION for double-quoted ones
        'T_CONSTANT_ENCAPSED_STRING': {
            what: /'((?:[^\\']|\\[\s\S])*)'/,
            captureIndex: 1,
            replace: singleQuotedStringEscapeReplacements
        },
        'T_CONTINUE': /continue\b/i,
        'T_CURLY_OPEN': /\{(?=\$)/,
        'T_DEC': /--/i,
        'T_DECLARE': /declare\b/i,
        'T_DEFAULT': /default\b/i,
        'T_DIR': /__DIR__\b/i,
        'T_DIV_EQUAL': /\/=/,

        // See http://www.php.net/manual/en/language.types.float.php
        'T_DNUMBER': /\d\.\d+e\d+|\d*\.\d+|\d+e[+-]?\d+/i,

        'T_DOC_COMMENT': /\/\*\*([\s\S]*?)\*\//,
        'T_DO': /do\b/i,
        'T_DOLLAR_OPEN_CURLY_BRACES': /\$\{/,
        'T_DOUBLE_ARROW': /=>/,
        'T_DOUBLE_CAST': /\(\s*(real|double|float)\s*\)/i,

        // Also defined as T_PAAMAYIM_NEKUDOTAYIM
        'T_DOUBLE_COLON': /::/i,

        'T_ECHO': /echo\b/i,
        'T_ELSE': /else\b/i,
        'T_ELSEIF': /elseif\b/i,
        'T_EMPTY': /empty\b/i,
        'T_ENCAPSED_AND_WHITESPACE': /(?:[^"\${]|\\["\${])+/,
        'T_ENDDECLARE': /enddeclare\b/i,
        'T_ENDFOR': /endfor\b/i,
        'T_ENDFOREACH': /endforeach\b/i,
        'T_ENDIF': /endif\b/i,
        'T_ENDSWITCH': /endswitch\b/i,
        'T_ENDWHILE': /endwhile\b/i,

        // Token gets defined as a pushed token after a Heredoc is found
        'T_END_HEREDOC': /(?!)/,

        'T_EVAL': /eval\b/i,
        'T_EXIT': /(?:exit|die)\b/i,
        'T_EXTENDS': /extends\b/i,
        'T_FILE': /__FILE__\b/i,
        'T_FINAL': /final\b/i,
        'T_FINALLY': /finally\b/i,
        'T_FOR': /for\b/i,
        'T_FOREACH': /foreach\b/i,
        'T_FUNCTION': /function\b/i,
        'T_FUNC_C': /__FUNCTION__\b/i,
        'T_GLOBAL': /global\b/i,
        'T_GOTO': /goto\b/i,
        'T_HALT_COMPILER': /__halt_compiler(?=\(\)|\s|;)/,
        'T_IF': /if\b/i,
        'T_IMPLEMENTS': /implements\b/i,
        'T_INC': /\+\+/,
        'T_INCLUDE': /include\b/i,
        'T_INCLUDE_ONCE': /include_once\b/i,
        'T_INLINE_HTML': /(?:[^<]|<[^?%]|<\?(?!php))+/,
        'T_INSTANCEOF': /instanceof\b/i,
        'T_INSTEADOF': /insteadof\b/i,
        'T_INT_CAST': /\(\s*int(eger)?\s*\)/i,
        'T_INTERFACE': /interface\b/i,
        'T_ISSET': /isset\b/i,
        'T_IS_EQUAL': /==(?!=)/i,
        'T_IS_GREATER_OR_EQUAL': />=/,
        'T_IS_IDENTICAL': /===/i,
        'T_IS_NOT_EQUAL': /!=|<>/,
        'T_IS_NOT_IDENTICAL': /!==/,
        'T_IS_SMALLER_OR_EQUAL': /<=/,
        'T_LINE': /__LINE__\b/i,
        'T_LIST': /list\b/i,
        'T_LNUMBER': /0x[0-9a-f]+|\d+/i,
        'T_LOGICAL_AND': /and\b/i,
        'T_LOGICAL_OR': /or\b/i,
        'T_LOGICAL_XOR': /xor\b/i,
        'T_METHOD_C': /__METHOD__\b/i,
        'T_MINUS_EQUAL': /-=/i,

        // Not used anymore (PHP 4 only)
        'T_ML_COMMENT': /(?!)/,

        'T_MOD_EQUAL': /%=/i,
        'T_MUL_EQUAL': /\*=/,
        'T_NAMESPACE': /namespace\b/i,
        'T_NS_C': /__NAMESPACE__\b/i,
        'T_NS_SEPARATOR': /\\/,
        'T_NEW': /new\b/i,
        'T_NUM_STRING': /\d+/,
        'T_OBJECT_CAST': /\(\s*object\s*\)/i,
        'T_OBJECT_OPERATOR': /->/,

        // Not used anymore (PHP 4 only)
        'T_OLD_FUNCTION': /old_function\b/i,

        'T_OPEN_TAG': /(?:<\?(php)?|<%)\s?(?!=)/,

        'T_OPEN_TAG_WITH_ECHO': /<[?%]=/,
        'T_OR_EQUAL': /\|=/,

        // Also defined as T_DOUBLE_COLON
        'T_PAAMAYIM_NEKUDOTAYIM': /::/i,

        'T_PLUS_EQUAL': /\+=/,
        'T_PRINT': /print\b/i,
        'T_PRIVATE': /private\b/i,
        'T_PUBLIC': /public\b/i,
        'T_PROTECTED': /protected\b/i,
        'T_REQUIRE': /require\b/i,
        'T_REQUIRE_ONCE': /require_once\b/i,
        'T_RETURN': /return\b/i,
        'T_SL': /<</,
        'T_SL_EQUAL': /<<=/,
        'T_SR': />>/,
        'T_SR_EQUAL': />>=/,
        'T_START_HEREDOC': /<<<(["']?)([\$a-z0-9_]+)\1\n?/,
        'T_STATIC': /static\b/i,
        'T_STRING': /(?![\$0-9])[a-z0-9_]+/i,
        'T_STRING_CAST': /\(\s*string\s*\)/i,
        'T_STRING_VARNAME': /(?![\$0-9])[\$a-z0-9_]+/,
        'T_SWITCH': /switch\b/i,
        'T_THROW': /throw\b/i,
        'T_TRAIT': /trait\b/i,
        'T_TRAIT_C': /__TRAIT__\b/i,
        'T_TRY': /try\b/i,
        'T_UNSET': /unset\b/i,
        'T_UNSET_CAST': /\(\s*unset\s*\)/i,
        'T_USE': /use\b/i,
        'T_VAR': /var\b/i,
        'T_VARIABLE': {what: /\$([a-z0-9_]+)/i, captureIndex: 1},
        'T_WHILE': /while\b/i,
        'T_WHITESPACE': /[\r\n\t ]+/,
        'T_XOR_EQUAL': /\^=/i,
        'T_YIELD': /yield\b/i,

        'N_ABSTRACT_METHOD_DEFINITION': {
            components: [
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_ABSTRACT',
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_FUNCTION',
                {name: 'func', what: 'N_STRING'},
                (/\(/),
                {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                (/\)/),
                'N_END_STATEMENT'
            ],
            processor: function (node) {
                if (!node.visibility) {
                    node.visibility = 'public';
                }

                return node;
            }
        },
        'N_ABSTRACT_STATIC_METHOD_DEFINITION': {
            components: [
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_ABSTRACT',
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_STATIC',
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_FUNCTION',
                {name: 'method', what: 'N_STRING'},
                (/\(/),
                {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                (/\)/),
                'N_END_STATEMENT'
            ],
            processor: function (node) {
                if (!node.visibility) {
                    node.visibility = 'public';
                }

                return node;
            }
        },
        'N_ARGUMENT': {
            components: {oneOf: [
                [{name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}, (/=/), {name: 'value', rule: 'N_EXPRESSION'}],
                [{name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}],
                [{name: 'type', rule: 'N_TYPE'}, {name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}, (/=/), {name: 'value', rule: 'N_EXPRESSION'}],
                [{name: 'type', rule: 'N_TYPE'}, {name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}]
            ]}
        },
        'N_ARGUMENT_VARIABLE': {
            components: {
                oneOf: ['N_REFERENCE_VARIABLE', 'N_VARIABLE']
            }
        },
        'N_REFERENCE_VARIABLE': {
            components: [
                (/&/),
                'N_VARIABLE'
            ],
            processor: function (node) {
                return {
                    name: 'N_REFERENCE',
                    operand: node
                };
            }
        },
        'N_ARRAY_INDEX': {
            components: 'N_EXPRESSION_LEVEL_2_A'
        },
        'N_ARRAY_LITERAL': {
            components: {oneOf: ['N_LONG_ARRAY_LITERAL', 'N_SHORT_ARRAY_LITERAL']}
        },
        'N_LONG_ARRAY_LITERAL': {
            captureAs: 'N_ARRAY_LITERAL',
            components: ['T_ARRAY', (/\(/), {name: 'elements', zeroOrMoreOf: [{oneOf: ['N_KEY_VALUE_PAIR', 'N_EXPRESSION']}, {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/)]
        },
        'N_SHORT_ARRAY_LITERAL': {
            captureAs: 'N_ARRAY_LITERAL',
            components: [(/\[/), {name: 'elements', zeroOrMoreOf: [{oneOf: ['N_KEY_VALUE_PAIR', 'N_EXPRESSION']}, {what: (/(,|(?=\]))()/), captureIndex: 2}]}, (/\]/)]
        },
        'N_BINARY_LITERAL': {
            components: [
                (/b/),
                {name: 'string', what: 'N_STRING_LITERAL'}
            ],
            processor: function (node) {
                node.name = 'N_BINARY_LITERAL';
                // Extract the nested string from N_STRING_LITERAL
                node.string = node.string.string;
                return node;
            }
        },
        'N_BOOLEAN': {
            components: {name: 'bool', what: (/true|false/i)}
        },
        'N_BREAK_STATEMENT': {
            components: ['T_BREAK', {name: 'levels', oneOf: ['N_INTEGER', 'N_JUMP_ONE_LEVEL']}, 'N_END_STATEMENT']
        },
        'N_CASE': {
            components: ['T_CASE', {name: 'expression', what: 'N_EXPRESSION'}, (/:/), {name: 'body', zeroOrMoreOf: 'N_STATEMENT'}]
        },
        'N_CLASS_STATEMENT': {
            components: [{optionally: {name: 'type', oneOf: ['T_ABSTRACT', 'T_FINAL']}}, 'T_CLASS', {name: 'className', rule: 'T_STRING'}, {optionally: ['T_EXTENDS', {name: 'extend', oneOf: ['N_NAMESPACE', 'T_STRING']}]}, {optionally: ['T_IMPLEMENTS', {name: 'implement', zeroOrMoreOf: [{oneOf: ['N_NAMESPACE', 'T_STRING']}, {what: (/(,|(?=\{))()/), captureIndex: 2}]}]}, (/\{/), {name: 'members', zeroOrMoreOf: {oneOf: ['N_INSTANCE_PROPERTY_DEFINITION', 'N_STATIC_PROPERTY_DEFINITION', 'N_METHOD_DEFINITION', 'N_STATIC_METHOD_DEFINITION', 'N_ABSTRACT_METHOD_DEFINITION', 'N_ABSTRACT_STATIC_METHOD_DEFINITION', 'N_CONSTANT_DEFINITION']}}, (/\}/)],
            processor: function (node) {
                if (node.type) {
                    node.type = node.type.toLowerCase();
                }
                return node;
            }
        },
        'N_CLOSURE': {
            components: [{name: 'static', optionally: 'T_STATIC'}, 'T_FUNCTION', (/\(/), {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/), {oneOf: [['T_USE', (/\(/), {name: 'bindings', zeroOrMoreOf: ['N_ARGUMENT_VARIABLE', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/)], {name: 'bindings', zeroOrMoreOf: {what: (/(?!)/)}}]}, {name: 'body', what: 'N_STATEMENT'}],
            processor: function (node) {
                node.static = !!node.static;

                return node;
            }
        },
        'N_COMMA_EXPRESSION': {
            components: {optionally: [{name: 'expressions', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=[;\)]))()/), captureIndex: 2}]}, (/(?=[;\)])/)]}
        },
        'N_COMPOUND_STATEMENT': {
            components: [(/\{/), {name: 'statements', zeroOrMoreOf: 'N_STATEMENT'}, (/\}/)]
        },
        'N_CONSTANT_DEFINITION': {
            components: [
                'T_CONST',
                {
                    name: 'constants',
                    oneOrMoreOf: [
                        {name: 'constant', rule: 'T_STRING'},
                        (/=/),
                        {name: 'value', rule: 'N_EXPRESSION'},
                        (/,|(?=;|[?%]>\n?)/)
                    ]
                },
                'N_END_STATEMENT'
            ]
        },
        'N_CONSTANT_STATEMENT': {
            components: [
                'T_CONST',
                {
                    name: 'constants',
                    oneOrMoreOf: [
                        {name: 'constant', rule: 'T_STRING'},
                        (/=/),
                        {name: 'value', rule: 'N_EXPRESSION'},
                        (/,|(?=;|[?%]>\n?)/)
                    ]
                },
                'N_END_STATEMENT'
            ]
        },
        'N_CONTINUE_STATEMENT': {
            components: ['T_CONTINUE', {name: 'levels', oneOf: ['N_INTEGER', 'N_JUMP_ONE_LEVEL']}, 'N_END_STATEMENT']
        },
        'N_DEFAULT_CASE': {
            components: ['T_DEFAULT', (/:/), {name: 'body', zeroOrMoreOf: 'N_STATEMENT'}]
        },
        'N_ECHO_STATEMENT': {
            components: ['T_ECHO', {name: 'expressions', oneOrMoreOf: ['N_EXPRESSION', {what: (/,|(?=;|[?%]>\n?)/)}]}, 'N_END_STATEMENT']
        },
        'N_EMPTY_STATEMENT': {
            components: (/;/)
        },
        'N_END_STATEMENT': {
            components: {
                oneOf: [
                    (/;/), // Standard semi-colon statement terminator
                    (/(?=[?%]>\n?)/) // Statements may be terminated by a closing PHP tag
                ]
            }
        },
        'N_EVAL': {
            components: [
                'T_EVAL',
                (/\(/),
                {name: 'code', rule: 'N_EXPRESSION'},
                (/\)/)
            ]
        },
        'N_EXIT': {
            components: {oneOf: ['N_EXIT_WITH_STATUS', 'N_EXIT_WITH_MESSAGE', 'N_EXIT_BARE']}
        },
        'N_EXIT_WITH_STATUS': {
            captureAs: 'N_EXIT',
            components: ['T_EXIT', (/\(/), {name: 'status', rule: 'N_INTEGER'}, (/\)/)]
        },
        'N_EXIT_WITH_MESSAGE': {
            captureAs: 'N_EXIT',
            components: ['T_EXIT', (/\(/), {name: 'message', rule: 'N_EXPRESSION'}, (/\)/)]
        },
        'N_EXIT_BARE': {
            captureAs: 'N_EXIT',
            components: ['T_EXIT', {optionally: [(/\(/), (/\)/)]}],
            processor: function () {
                return {
                    name: 'N_EXIT'
                };
            }
        },
        'N_EXPRESSION': {
            components: {oneOf: ['N_EXPRESSION_LEVEL_21']}
        },

        /*
         * Operator precedence: see http://php.net/manual/en/language.operators.precedence.php
         */
        // Precedence level 0 (highest) - single terms and bracketed expressions
        'N_EXPRESSION_LEVEL_0': {
            components: [{oneOf: ['N_TERM', [(/\(/), 'N_EXPRESSION', (/\)/)]]}]
        },
        'N_NEW_EXPRESSION_SELF': {
            captureAs: 'N_SELF',
            components: [{allowMerge: false, what: /self\b/}]
        },
        'N_NEW_EXPRESSION_STATIC': {
            captureAs: 'N_STATIC',
            components: [{allowMerge: false, what: /static\b/}]
        },
        'N_NEW_EXPRESSION_DYNAMIC_CLASS': {
            components: [
                {
                    name: 'expression',
                    oneOf: [
                        'N_NEW_EXPRESSION_SELF',
                        'N_NEW_EXPRESSION_STATIC',
                        'N_EXPRESSION_LEVEL_0',
                        'N_NAMESPACED_REFERENCE'
                    ]
                },
                {
                    name: 'member',
                    zeroOrMoreOf: {
                        oneOf: [
                            // Array index
                            {
                                name: 'array_index',
                                oneOf: [
                                    'N_EMPTY_ARRAY_INDEX',
                                    {
                                        name: 'indices',
                                        oneOrMoreOf: [
                                            (/\[/), {name: 'index', what: 'N_EXPRESSION'}, (/\]/)
                                        ]
                                    }
                                ]
                            },
                            // Object property
                            {
                                name: 'object_property',
                                what: {
                                    name: 'properties',
                                    oneOrMoreOf: [
                                        'T_OBJECT_OPERATOR',
                                        {name: 'property', what: 'N_INSTANCE_MEMBER'}
                                    ]
                                }
                            },
                            // Static object property
                            {
                                name: 'static_property',
                                what: [
                                    'T_DOUBLE_COLON',
                                    {name: 'property', what: 'N_STATIC_MEMBER'}
                                ]
                            }
                        ]
                    }
                }
            ],
            processor: function (node) {
                var result;

                if (!node || !node.expression) {
                    return node;
                }

                result = node.expression;

                _.each(node.member, function (member) {
                    if (member.array_index) {
                        result = {
                            name: 'N_ARRAY_INDEX',
                            array: result,
                            indices: member.array_index.indices
                        };
                    } else if (member.object_property) {
                        result = {
                            name: 'N_OBJECT_PROPERTY',
                            object: result,
                            properties: member.object_property.properties
                        };
                    } else if (member.static_property) {
                        result = {
                            name: 'N_STATIC_PROPERTY',
                            className: result,
                            property: member.static_property.property
                        };
                    }

                    if (member.bounds) {
                        result.bounds = member.bounds;
                    }
                });

                return result;
            }
        },
        'N_EXPRESSION_LEVEL_1_A': {
            captureAs: 'N_NEW_EXPRESSION',
            components: {oneOf: [
                [
                    'T_NEW',
                    {name: 'className', rule: 'N_NEW_EXPRESSION_DYNAMIC_CLASS'},
                    {optionally: [
                        (/\(/),
                        {name: 'args', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                        (/\)/)
                    ]}
                ],
                {name: 'next', what: 'N_EXPRESSION_LEVEL_0'}
            ]},
            ifNoMatch: {component: 'className', capture: 'next'},
            processor: function (node) {
                if (node.className && !node.args) {
                    node.args = [];
                }

                return node;
            }
        },
        'N_DO_WHILE_STATEMENT': {
            components: ['T_DO', {name: 'body', what: 'N_STATEMENT'}, 'T_WHILE', (/\(/), {name: 'condition', what: 'N_EXPRESSION'}, (/\)/), 'N_END_STATEMENT']
        },
        'N_EXPRESSION_LEVEL_1_B': {
            captureAs: 'N_CLONE_EXPRESSION',
            components: {
                oneOf: [
                    ['T_CLONE', {name: 'operand', what: 'N_EXPRESSION_LEVEL_1_A'}],
                    'N_EXPRESSION_LEVEL_1_A'
                ]
            }
        },
        'N_EMPTY_ARRAY_INDEX': {
            captureAs: 'N_ARRAY_INDEX',
            components: {name: 'indices', what: [(/\[/), (/\]/)]},
            options: {indices: true}
        },
        'N_EXPRESSION_LEVEL_2_A': {
            components: [
                {
                    name: 'expression',
                    oneOf: ['N_EXPRESSION_LEVEL_1_B', 'N_NAMESPACED_REFERENCE']
                },
                {
                    name: 'member',
                    zeroOrMoreOf: {
                        oneOf: [
                            // Array index
                            {
                                name: 'array_index',
                                oneOf: [
                                    'N_EMPTY_ARRAY_INDEX',
                                    {
                                        name: 'indices',
                                        oneOrMoreOf: [
                                            (/\[/), {name: 'index', what: 'N_EXPRESSION'}, (/\]/)
                                        ]
                                    }
                                ]
                            },
                            // Method call
                            {
                                name: 'method_call',
                                what: {
                                    name: 'calls',
                                    oneOrMoreOf: [
                                        'T_OBJECT_OPERATOR',
                                        {name: 'func', what: 'N_INSTANCE_MEMBER'},
                                        (/\(/),
                                        {
                                            name: 'args',
                                            zeroOrMoreOf: ['N_EXPRESSION', {
                                                what: (/(,|(?=\)))()/),
                                                captureIndex: 2
                                            }]
                                        },
                                        (/\)/)
                                    ]
                                }
                            },
                            // Object property
                            {
                                name: 'object_property',
                                what: {
                                    name: 'properties',
                                    oneOrMoreOf: [
                                        'T_OBJECT_OPERATOR',
                                        {name: 'property', what: 'N_INSTANCE_MEMBER'},
                                        (/(?!\()/)
                                    ]
                                }
                            },
                            // Static method call
                            {
                                name: 'static_method_call',
                                what: [
                                    'T_DOUBLE_COLON',
                                    {name: 'method', oneOf: ['N_STRING', 'N_VARIABLE', 'N_VARIABLE_EXPRESSION', 'N_MEMBER_EXPRESSION']},
                                    (/\(/),
                                    {name: 'args', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                                    (/\)/)
                                ]
                            },
                            // Static object property
                            {
                                name: 'static_property',
                                what: [
                                    'T_DOUBLE_COLON',
                                    {name: 'property', what: 'N_STATIC_MEMBER'}
                                ]
                            },
                            // Class constant
                            {
                                name: 'class_constant',
                                what: [
                                    'T_DOUBLE_COLON',
                                    {name: 'constant', what: ['T_STRING', (/(?!\()/)]}
                                ]
                            },
                            // Call to callable stored in array index or static property
                            {
                                name: 'callable',
                                what: [
                                    (/\(/),
                                    {name: 'args', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                                    (/\)/)
                                ]
                            }
                        ]
                    }
                }
            ],
            processor: function (node) {
                var result;

                if (!node || !node.expression) {
                    return node;
                }

                result = node.expression;

                _.each(node.member, function (member) {
                    if (member.array_index) {
                        result = {
                            name: 'N_ARRAY_INDEX',
                            array: result,
                            indices: member.array_index.indices
                        };
                    } else if (member.method_call) {
                        result = {
                            name: 'N_METHOD_CALL',
                            object: result,
                            calls: member.method_call.calls
                        };
                    } else if (member.object_property) {
                        result = {
                            name: 'N_OBJECT_PROPERTY',
                            object: result,
                            properties: member.object_property.properties
                        };
                    } else if (member.static_method_call) {
                        result = {
                            name: 'N_STATIC_METHOD_CALL',
                            className: result,
                            method: member.static_method_call.method,
                            args: member.static_method_call.args
                        };
                    } else if (member.static_property) {
                        result = {
                            name: 'N_STATIC_PROPERTY',
                            className: result,
                            property: member.static_property.property
                        };
                    } else if (member.class_constant) {
                        result = {
                            name: 'N_CLASS_CONSTANT',
                            className: result,
                            constant: member.class_constant.constant
                        };
                    } else if (member.callable) {
                        result = {
                            name: 'N_FUNCTION_CALL',
                            func: result,
                            args: member.callable.args
                        };
                    }

                    if (member.bounds) {
                        result.bounds = member.bounds;
                    }
                });

                return result;
            }
        },
        'N_EXPRESSION_LEVEL_2_C': {
            components: {oneOf: ['N_REFERENCE', 'N_EXPRESSION_LEVEL_2_A']}
        },
        'N_REFERENCE': {
            components: [(/&/), {name: 'operand', what: 'N_EXPRESSION_LEVEL_2_A'}]
        },
        'N_EXPRESSION_LEVEL_3_A': {
            oneOf: ['N_UNARY_PREFIX_EXPRESSION', 'N_UNARY_SUFFIX_EXPRESSION', 'N_EXPRESSION_LEVEL_2_C']
        },
        'N_EXPRESSION_LEVEL_3_B': {
            oneOf: ['N_ARRAY_CAST', 'N_BINARY_CAST', 'N_BOOLEAN_CAST', 'N_DOUBLE_CAST', 'N_INTEGER_CAST', 'N_OBJECT_CAST', 'N_STRING_CAST', 'N_UNSET_CAST', 'N_SUPPRESSED_EXPRESSION', 'N_EXPRESSION_LEVEL_3_A']
        },
        'N_ARRAY_CAST': {
            components: ['T_ARRAY_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_BINARY_CAST': {
            components: ['T_BINARY_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_BOOLEAN_CAST': {
            components: ['T_BOOL_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_DOUBLE_CAST': {
            components: ['T_DOUBLE_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_INTEGER_CAST': {
            components: ['T_INT_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_OBJECT_CAST': {
            components: ['T_OBJECT_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_STRING_CAST': {
            components: ['T_STRING_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_UNSET_CAST': {
            components: ['T_UNSET_CAST', {name: 'value', rule: 'N_EXPRESSION_LEVEL_3_B'}]
        },
        'N_SUPPRESSED_EXPRESSION': {
            components: [(/@/), {name: 'expression', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_3_B']}]
        },
        'N_UNARY_PREFIX_EXPRESSION': {
            captureAs: 'N_UNARY_EXPRESSION',
            components: [{name: 'operator', oneOf: ['T_INC', 'T_DEC', (/~/)]}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_2_C'}],
            ifNoMatch: {component: 'operator', capture: 'operand'},
            options: {prefix: true}
        },
        'N_UNARY_SUFFIX_EXPRESSION': {
            captureAs: 'N_UNARY_EXPRESSION',
            components: [{name: 'operand', what: 'N_EXPRESSION_LEVEL_2_C'}, {name: 'operator', oneOf: ['T_INC', 'T_DEC']}],
            ifNoMatch: {component: 'operator', capture: 'operand'},
            options: {prefix: false}
        },
        'N_EMPTY': {
            components: ['T_EMPTY', (/\(/), {name: 'variable', rule: 'N_EXPRESSION'}, (/\)/)]
        },
        'N_EXPRESSION_LEVEL_4': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_3_B'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: 'T_INSTANCEOF'}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_3_B'}]}],
            processor: function (node) {
                if (node.right.length === 0) {
                    return node.left;
                }

                return buildTree(node.left, node.right, function (result, element) {
                    return {
                        'name': 'N_INSTANCE_OF',
                        'object': result,
                        'class': element.operand
                    };
                });
            }
        },
        'N_EXPRESSION_LEVEL_5': {
            captureAs: 'N_UNARY_EXPRESSION',
            components: [{name: 'operator', optionally: (/!/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_4']}],
            ifNoMatch: {component: 'operator', capture: 'operand'},
            options: {prefix: true}
        },
        'N_EXPRESSION_LEVEL_6': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_5'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', oneOf: [(/\*/), (/\//), (/%/)]}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_5']}]}],
            processor: function (node) {
                if (node.right.length === 0) {
                    return node.left;
                }

                return buildBinaryExpression(node.left, node.right);
            }
        },
        'N_EXPRESSION_LEVEL_7_A': {
            captureAs: 'N_UNARY_EXPRESSION',
            components: [{name: 'operator', optionally: (/([+-])(?!\1)/)}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_6'}],
            ifNoMatch: {component: 'operator', capture: 'operand'},
            options: {prefix: true}
        },
        'N_EXPRESSION_LEVEL_7_B': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_7_A'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', oneOf: [(/\+/), (/-/), (/\./)]}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_7_A']}]}],
            processor: function (node) {
                if (!node.right) {
                    return node.left;
                }

                return buildBinaryExpression(node.left, node.right);
            }
        },
        'N_EXPRESSION_LEVEL_8': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_7_B'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', oneOf: ['T_SL', 'T_SR']}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_7_B']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_9': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_8'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', oneOf: ['T_IS_SMALLER_OR_EQUAL', (/</), 'T_IS_GREATER_OR_EQUAL', (/>/)]}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_8']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_10': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_9'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', oneOf: ['T_IS_IDENTICAL', 'T_IS_EQUAL', 'T_IS_NOT_IDENTICAL', 'T_IS_NOT_EQUAL']}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_9']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_11': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_10'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/&(?!&)/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_10']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
            // TODO: Use buildBinaryExpression ahead of deprecating N_EXPRESSION for N_BINARY_EXPRESSION w/a single right operand
        },
        'N_EXPRESSION_LEVEL_12': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_11'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/\^/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_11']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
            // TODO: Use buildBinaryExpression ahead of deprecating N_EXPRESSION for N_BINARY_EXPRESSION w/a single right operand
        },
        'N_EXPRESSION_LEVEL_13': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_12'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/\|(?!\|)/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_12']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
            // TODO: Use buildBinaryExpression ahead of deprecating N_EXPRESSION for N_BINARY_EXPRESSION w/a single right operand
        },
        'N_EXPRESSION_LEVEL_14': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_13'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/&&/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_13']}]}],
            processor: function (node) {
                if (!node.right) {
                    return node.left;
                }

                return buildBinaryExpression(node.left, node.right);
            }
        },
        'N_EXPRESSION_LEVEL_15': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_14'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/\|\|/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_14']}]}],
            processor: function (node) {
                if (!node.right) {
                    return node.left;
                }

                return buildBinaryExpression(node.left, node.right);
            }
        },
        'N_EXPRESSION_LEVEL_16': {
            captureAs: 'N_TERNARY',
            components: [
                {name: 'condition', what: 'N_EXPRESSION_LEVEL_15'},
                {
                    optionally: [
                        {
                            name: 'firstOperand',
                            oneOf: [
                                [(/\?/), {name: 'consequent', rule: 'N_EXPRESSION_LEVEL_15'}],
                                [/\?\s*\:/, {name: 'shorthand', rule: 'N_EXPRESSION_LEVEL_15'}] // Shorthand ternary
                            ]
                        },
                        {
                            name: 'restOfOperands',
                            zeroOrMoreOf: {
                                oneOf: [
                                    [(/\?/), {name: 'consequent', rule: 'N_EXPRESSION_LEVEL_15'}],
                                    [(/:/), {name: 'alternate', rule: 'N_EXPRESSION_LEVEL_15'}],
                                    [/\?\s*\:/, {name: 'shorthand', rule: 'N_EXPRESSION_LEVEL_15'}] // Shorthand ternary
                                ]
                            }
                        }
                    ]
                }
            ],
            processor: function (node) {
                if (!node.firstOperand) {
                    return node.condition;
                }

                return buildTernaryExpression(node.condition, [node.firstOperand].concat(node.restOfOperands));
            }
        },
        'N_ASSIGNMENT_EXPRESSION': {
            captureAs: 'N_EXPRESSION',
            components: [
                {name: 'left', what: 'N_LEFT_HAND_SIDE_EXPRESSION'},
                {name: 'right', oneOrMoreOf: [{name: 'operator', what: (/(?:[-+*\/.%&|^]|<<|>>)?=/)}, {name: 'operand', what: 'N_EXPRESSION'}]}
            ]
        },
        'N_EXPRESSION_LEVEL_17_A': {
             captureAs: 'N_EXPRESSION',
             components: {
                 // Don't allow binary expressions on the left-hand side of assignments
                 oneOf: [
                     'N_ASSIGNMENT_EXPRESSION',
                     'N_EXPRESSION_LEVEL_16'
                 ]
             }
        },
        'N_EXPRESSION_LEVEL_17_B': {
            captureAs: 'N_PRINT_EXPRESSION',
            components: {oneOf: [
                [
                    'T_PRINT',
                    {name: 'operand', what: 'N_EXPRESSION_LEVEL_17_A'},
                ],
                {name: 'next', what: 'N_EXPRESSION_LEVEL_17_A'}
            ]},
            ifNoMatch: {component: 'operand', capture: 'next'}
        },
        'N_EXPRESSION_LEVEL_18': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_17_B'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: 'T_LOGICAL_AND', replace: lowercaseReplacements}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_17_B'}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
            // TODO: Use buildBinaryExpression ahead of deprecating N_EXPRESSION for N_BINARY_EXPRESSION w/a single right operand
        },
        'N_EXPRESSION_LEVEL_19': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_18'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: 'T_LOGICAL_XOR', replace: lowercaseReplacements}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_18'}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
            // TODO: Use buildBinaryExpression ahead of deprecating N_EXPRESSION for N_BINARY_EXPRESSION w/a single right operand
        },
        'N_EXPRESSION_LEVEL_20': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_19'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: 'T_LOGICAL_OR', replace: lowercaseReplacements}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_19'}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
            // TODO: Use buildBinaryExpression ahead of deprecating N_EXPRESSION for N_BINARY_EXPRESSION w/a single right operand
        },
        'N_EXPRESSION_LEVEL_21': {
            components: 'N_EXPRESSION_LEVEL_20'
        },
        'N_LEFT_HAND_SIDE_EXPRESSION': 'N_EXPRESSION_LEVEL_2_A',
        'N_EXPRESSION_STATEMENT': {
            components: [{name: 'expression', what: 'N_EXPRESSION'}, 'N_END_STATEMENT']
        },
        'N_FLOAT': {
            components: {name: 'number', what: 'T_DNUMBER'}
        },
        'N_FOR_STATEMENT': {
            components: ['T_FOR', (/\(/), {name: 'initializer', what: 'N_COMMA_EXPRESSION'}, (/;/), {name: 'condition', what: 'N_COMMA_EXPRESSION'}, (/;/), {name: 'update', what: 'N_COMMA_EXPRESSION'}, (/\)/), {name: 'body', what: 'N_STATEMENT'}]
        },
        'N_FOREACH_STATEMENT': {
            components: ['T_FOREACH', (/\(/), {name: 'array', rule: 'N_EXPRESSION'}, 'T_AS', {optionally: [{name: 'key', oneOf: ['N_ARRAY_INDEX', 'N_ARGUMENT_VARIABLE']}, 'T_DOUBLE_ARROW']}, {name: 'value', oneOf: ['N_ARRAY_INDEX', 'N_ARGUMENT_VARIABLE']}, (/\)/), {name: 'body', what: 'N_STATEMENT'}]
        },
        'N_FUNCTION_STATEMENT': {
            components: ['T_FUNCTION', {name: 'func', what: 'N_STRING'}, (/\(/), {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/), {name: 'body', what: 'N_STATEMENT'}]
        },
        'N_GLOBAL_STATEMENT': {
            components: ['T_GLOBAL', {name: 'variables', oneOrMoreOf: ['N_VARIABLE', (/,|(?=;|[?%]>\n?)/)]}, 'N_END_STATEMENT']
        },
        'N_GOTO_STATEMENT': {
            components: ['T_GOTO', {name: 'label', what: 'N_STRING'}, 'N_END_STATEMENT']
        },
        'N_HEREDOC': {
            components: [{name: 'string', what: /<<<\s*("?)([a-z0-9_]+)\1\r?\n([\s\S]*?)\r?\n\2(?=;?(?:\r?\n|$))/i, captureIndex: 3}],
            processor: function (node, parse) {
                var innerMatch,
                    parts;

                if (node.string === '') {
                    parts = [{
                        name: 'N_STRING_LITERAL',
                        string: ''
                    }];
                } else {
                    innerMatch = parse(node.string, {}, 'N_HEREDOC_INNER');

                    if (innerMatch === null) {
                        return node;
                    }

                    parts = innerMatch.parts;
                }

                return {
                    name: 'N_HEREDOC',
                    parts: parts
                };
            }
        },
        'N_HEREDOC_INNER': {
            components: [
                {
                    name: 'parts',
                    oneOrMoreOf: {oneOf: ['N_STRING_INTERPOLATED_EXPRESSION', 'N_HEREDOC_TEXT']},
                    ignoreWhitespace: false
                }
            ]
        },
        // Needs its own rule rather than reusing N_STRING_TEXT, as we don't need quotes
        // to be escaped in a heredoc, unlike a string literal
        'N_HEREDOC_TEXT': {
            captureAs: 'N_STRING_LITERAL',
            components: {name: 'string', what: (/(?:[^\\$]|\\[\s\S]|\$(?=\$))+/), ignoreWhitespace: false, replace: stringEscapeReplacements}
        },
        'N_IF_STATEMENT': {
            components: ['T_IF', (/\(/), {name: 'condition', what: 'N_EXPRESSION'}, (/\)/), {name: 'consequentStatement', what: 'N_STATEMENT'}, {optionally: [(/else(\b|(?=if\b))/), {name: 'alternateStatement', what: 'N_STATEMENT'}]}]
        },
        'N_IGNORE': {
            components: {oneOrMoreOf: {oneOf: ['T_WHITESPACE', 'T_COMMENT', 'T_DOC_COMMENT']}}
        },
        'N_INCLUDE_EXPRESSION': {
            components: ['T_INCLUDE', {name: 'path', what: 'N_EXPRESSION'}]
        },
        'N_INCLUDE_ONCE_EXPRESSION': {
            components: ['T_INCLUDE_ONCE', {name: 'path', what: 'N_EXPRESSION'}]
        },
        'N_INLINE_HTML_STATEMENT': {
            oneOf: [
                [
                    // eg. `?> my HTML here <?php` or `?> my HTML here <EOF>`
                    'T_CLOSE_TAG',
                    {name: 'html', what: 'T_INLINE_HTML', ignoreWhitespace: false},
                    {oneOf: ['T_OPEN_TAG', '<EOF>']}
                ],
                [
                    // eg. `?><?php` or `?>  <?php`
                    'T_CLOSE_TAG',
                    {name: 'html', what: /()/},
                    'T_OPEN_TAG'
                ]
            ]
        },
        'N_INSTANCE_MEMBER': {
            components: {oneOf: ['N_STRING', 'N_VARIABLE', [(/\{/), 'N_EXPRESSION', (/\}/)]]}
        },
        'N_INSTANCE_PROPERTY_DEFINITION': {
            components: [{name: 'visibility', oneOf: ['T_PUBLIC', 'T_PRIVATE', 'T_PROTECTED']}, {name: 'variable', what: 'N_VARIABLE'}, {optionally: [(/=/), {name: 'value', rule: 'N_EXPRESSION'}]}, 'N_END_STATEMENT']
        },
        'N_INTEGER': {
            components: {name: 'number', what: 'T_LNUMBER'},
            processor: function (node) {
                if (/^0x/i.test(node.number)) {
                    // Number is in hexadecimal
                    node.number = parseInt(node.number, 16) + '';
                } else if (/^0/i.test(node.number)) {
                    // In strict mode, parseInt(...) will parse an octal literal as decimal
                    // so eg. parseInt('021') will return 21 instead of 17
                    node.number = parseInt(node.number, 8) + '';
                }

                return node;
            }
        },
        'N_INTERFACE_METHOD_DEFINITION': {
            components: [{name: 'visibility', oneOf: ['T_PUBLIC', 'T_PRIVATE', 'T_PROTECTED']}, 'T_FUNCTION', {name: 'func', what: 'N_STRING'}, (/\(/), {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/), 'N_END_STATEMENT']
        },
        'N_INTERFACE_STATEMENT': {
            components: [
                'T_INTERFACE',
                {name: 'interfaceName', rule: 'T_STRING'},
                {optionally: ['T_EXTENDS', {optionally: {name: 'extend', oneOrMoreOf: [{oneOf: ['N_NAMESPACE', 'T_STRING']}, {what: (/(,|(?=\{))()/), captureIndex: 2}]}}]},
                (/\{/),
                {name: 'members', zeroOrMoreOf: {oneOf: [
                    'N_INTERFACE_METHOD_DEFINITION',
                    'N_STATIC_INTERFACE_METHOD_DEFINITION',
                    'N_CONSTANT_DEFINITION',
                    'N_INSTANCE_PROPERTY_DEFINITION',
                    'N_STATIC_PROPERTY_DEFINITION',
                    'N_METHOD_DEFINITION',
                    'N_STATIC_METHOD_DEFINITION',
                    'N_ABSTRACT_METHOD_DEFINITION',
                    'N_ABSTRACT_STATIC_METHOD_DEFINITION'
                ]}},
                (/\}/)
            ]
        },
        'N_ISSET': {
            components: ['T_ISSET', (/\(/), {name: 'variables', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/)]
        },
        'N_JUMP_ONE_LEVEL': {
            captureAs: 'N_INTEGER',
            components: {name: 'number', what: (/()/)},
            options: {number: '1'}
        },
        'N_KEY_VALUE_PAIR': {
            components: [{name: 'key', what: 'N_EXPRESSION'}, 'T_DOUBLE_ARROW', {name: 'value', what: 'N_EXPRESSION'}]
        },
        'N_LABEL_STATEMENT': {
            components: [{name: 'label', what: [(/(?!default\b)/i), 'N_STRING']}, (/:/)]
        },
        'N_LIST': {
            components: ['T_LIST', (/\(/), {name: 'elements', zeroOrMoreOf: {oneOf: [[{oneOf: ['N_VARIABLE', 'N_ARRAY_INDEX']}, {what: (/(,|(?=\)))()/), captureIndex: 2}], 'N_VOID']}}, (/\)/)]
        },
        'N_MAGIC_CONSTANT': {
            components: {oneOf: ['N_MAGIC_CLASS_CONSTANT', 'N_MAGIC_DIR_CONSTANT', 'N_MAGIC_FILE_CONSTANT', 'N_MAGIC_FUNCTION_CONSTANT', 'N_MAGIC_LINE_CONSTANT', 'N_MAGIC_METHOD_CONSTANT', 'N_MAGIC_NAMESPACE_CONSTANT']}
        },
        'N_MAGIC_CLASS_CONSTANT': {
            components: {what: 'T_CLASS_C', replace: uppercaseReplacements, allowMerge: false}
        },
        'N_MAGIC_DIR_CONSTANT': {
            components: {what: 'T_DIR', replace: uppercaseReplacements, allowMerge: false}
        },
        'N_MAGIC_FILE_CONSTANT': {
            components: {what: 'T_FILE', replace: uppercaseReplacements, allowMerge: false}
        },
        'N_MAGIC_FUNCTION_CONSTANT': {
            components: {what: 'T_FUNC_C', replace: uppercaseReplacements, allowMerge: false}
        },
        'N_MAGIC_LINE_CONSTANT': {
            components: {what: 'T_LINE', replace: uppercaseReplacements, captureBoundsAs: 'bounds'}
        },
        'N_MAGIC_METHOD_CONSTANT': {
            components: {what: 'T_METHOD_C', replace: uppercaseReplacements, allowMerge: false}
        },
        'N_MAGIC_NAMESPACE_CONSTANT': {
            components: {what: 'T_NS_C', replace: uppercaseReplacements, allowMerge: false}
        },
        'N_METHOD_DEFINITION': {
            components: [
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_FUNCTION',
                {name: 'func', what: 'N_STRING'},
                (/\(/),
                {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                (/\)/),
                {name: 'body', what: 'N_STATEMENT'}
            ],
            processor: function (node) {
                if (!node.visibility) {
                    node.visibility = 'public';
                }

                return node;
            }
        },
        'N_NAMESPACE': {
            components: [(/(?!(?:new|use)\b)/i), {optionally: 'T_STRING'}, {oneOrMoreOf: ['T_NS_SEPARATOR', 'T_STRING']}]
        },
        'N_NAMESPACE_STATEMENT': {
            oneOf: ['N_SEMICOLON_NAMESPACE_STATEMENT', 'N_BRACED_NAMESPACE_STATEMENT']
        },
        'N_SEMICOLON_NAMESPACE_STATEMENT': {
            captureAs: 'N_NAMESPACE_STATEMENT',
            components: ['T_NAMESPACE', {name: 'namespace', oneOf: ['N_NAMESPACE', 'T_STRING']}, (/;/), {name: 'statements', zeroOrMoreOf: 'N_NAMESPACE_SCOPED_STATEMENT'}]
        },
        'N_BRACED_NAMESPACE_STATEMENT': {
            captureAs: 'N_NAMESPACE_STATEMENT',
            components: ['T_NAMESPACE', {name: 'namespace', oneOf: ['N_NAMESPACE', 'T_STRING', (/()/)]}, (/\{/), {name: 'statements', zeroOrMoreOf: 'N_NAMESPACE_SCOPED_STATEMENT'}, (/\}/)]
        },
        'N_NAMESPACED_REFERENCE': {
            captureAs: 'N_STRING',
            components: {name: 'string', what: 'N_NAMESPACE'}
        },
        'N_NOWDOC': {
            components: [{name: 'string', what: /<<<\s*'([a-z0-9_]+)'\r?\n([\s\S]*?)\r?\n\1(?=;?(?:\r?\n|$))/i, captureIndex: 2}]
        },
        'N_NULL': {
            allowMerge: false,
            what: (/null\b/i)
        },
        'N_OPEN_TAG_AT_START': {
            what: [
                '<BOF>',
                'T_OPEN_TAG'
            ]
        },
        'N_PARENT': {
            allowMerge: false,
            what: /parent\b(?=\s*::)/i
        },
        'N_PROGRAM': {
            components: {
                // Don't swallow whitespace at the very beginning of the program
                // eg. for `   before <?php print 'inside'; ?> after`
                ignoreWhitespace: false,
                what: [
                    // Consume any opening `<?php` tag right at the start of the file -
                    // if there is any whitespace just before it this will be added as a N_INLINE_HTML_STATEMENT
                    {optionally: 'N_OPEN_TAG_AT_START'},

                    // Start matching statements - any embedded HTML output will be parsed as an N_INLINE_HTML_STATEMENT
                    // eg. `... ?>anything like this<?php ...`
                    {name: 'statements', zeroOrMoreOf: 'N_TOP_LEVEL_STATEMENT'},

                    // Ignore any whitespace at the end of the file, before either:
                    // - its closing `?>` tag
                    // - the very end of the file, if it is self-closing (`?>` tag omitted)
                    {oneOf: ['T_CLOSE_TAG', {what: '<EOF>'}], ignoreWhitespace: true}
                ]
            }
        },
        'N_RETURN_STATEMENT': {
            components: ['T_RETURN', {name: 'expression', optionally: 'N_EXPRESSION'}, 'N_END_STATEMENT'],
            processor: function (node) {
                if (node.expression === '') {
                    delete node.expression;
                }

                return node;
            }
        },
        'N_INLINE_HTML_STATEMENT_AT_START': {
            captureAs: 'N_INLINE_HTML_STATEMENT',
            what: [
                '<BOF>',
                {name: 'html', what: 'T_INLINE_HTML'},
                {oneOf: ['T_OPEN_TAG', '<EOF>']}
            ]
        },
        'N_TOP_LEVEL_STATEMENT': {
            components: {oneOf: [
                'N_INLINE_HTML_STATEMENT_AT_START',
                {rule: 'N_STATEMENT', ignoreWhitespace: true}
            ]}
        },
        'N_STATEMENT': {
            components: {oneOf: ['N_NAMESPACE_SCOPED_STATEMENT', 'N_NAMESPACE_STATEMENT']}
        },
        'N_NAMESPACE_SCOPED_STATEMENT': {
            components: {oneOf: [
                'N_COMPOUND_STATEMENT',
                'N_RETURN_STATEMENT',
                'N_INLINE_HTML_STATEMENT',
                'N_EMPTY_STATEMENT',
                'N_ECHO_STATEMENT',
                'N_BREAK_STATEMENT',
                'N_CONTINUE_STATEMENT',
                'N_UNSET_STATEMENT',
                'N_EXPRESSION_STATEMENT',
                'N_FUNCTION_STATEMENT',
                'N_IF_STATEMENT',
                'N_FOREACH_STATEMENT',
                'N_FOR_STATEMENT',
                'N_WHILE_STATEMENT',
                'N_DO_WHILE_STATEMENT',
                'N_CLASS_STATEMENT',
                'N_INTERFACE_STATEMENT',
                'N_SWITCH_STATEMENT',
                'N_GLOBAL_STATEMENT',
                'N_CONSTANT_STATEMENT',
                'N_STATIC_STATEMENT',
                'N_LABEL_STATEMENT',
                'N_GOTO_STATEMENT',
                'N_USE_STATEMENT',
                'N_THROW_STATEMENT',
                'N_TRY_STATEMENT'
            ]}
        },
        'N_REQUIRE_EXPRESSION': {
            components: ['T_REQUIRE', {name: 'path', what: 'N_EXPRESSION'}]
        },
        'N_REQUIRE_ONCE_EXPRESSION': {
            components: ['T_REQUIRE_ONCE', {name: 'path', what: 'N_EXPRESSION'}]
        },
        'N_SELF': {
            allowMerge: false,
            what: /self\b(?=\s*::)/i
        },
        'N_STATIC': {
            allowMerge: false,
            what: /static\b(?=\s*::)/i
        },
        'N_STATIC_STATEMENT': {
            components: [
                'T_STATIC',
                {
                    name: 'variables',
                    oneOrMoreOf: [
                        {name: 'variable', rule: 'N_VARIABLE'},
                        {
                            optionally: [
                                /=/,
                                {name: 'initialiser', rule: 'N_EXPRESSION'}
                            ]
                        },
                        (/,|(?=;|[?%]>\n?)/)
                    ]
                },
                'N_END_STATEMENT'
            ]
        },
        'N_STATIC_INTERFACE_METHOD_DEFINITION': {
            components: [
                {oneOf: [
                    [{name: 'visibility', rule: 'N_VISIBILITY'}, 'T_STATIC'],
                    ['T_STATIC', {name: 'visibility', rule: 'N_VISIBILITY'}],
                    'T_STATIC'
                ]},
                'T_FUNCTION',
                {name: 'method', what: 'N_STRING'},
                (/\(/),
                {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                (/\)/),
                'N_END_STATEMENT'
            ]
        },
        'N_STATIC_MEMBER': {
            components: {oneOf: ['N_STATIC_VARIABLE', 'N_STATIC_VARIABLE_EXPRESSION']}
        },
        'N_STATIC_METHOD_DEFINITION': {
            components: [
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_STATIC',
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                {optionally: {name: 'modifier', rule: 'T_FINAL'}},
                {optionally: {name: 'visibility', rule: 'N_VISIBILITY'}},
                'T_FUNCTION',
                {name: 'method', what: 'N_STRING'},
                (/\(/),
                {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                (/\)/),
                {name: 'body', what: 'N_STATEMENT'}
            ],
            processor: function (node) {
                if (!node.visibility) {
                    node.visibility = 'public';
                }

                return node;
            }
        },
        'N_STATIC_VARIABLE': {
            captureAs: 'N_STRING',
            components: {name: 'string', rule: 'T_VARIABLE'}
        },
        'N_STATIC_VARIABLE_EXPRESSION': {
            oneOf: [
                [(/\$/), 'N_VARIABLE'],
                [(/\$\{/), 'N_EXPRESSION', (/\}/)]
            ]
        },
        'N_STATIC_PROPERTY_DEFINITION': {
            components: [
                {oneOf: [
                    [{name: 'visibility', rule: 'N_VISIBILITY'}, 'T_STATIC'],
                    ['T_STATIC', {name: 'visibility', rule: 'N_VISIBILITY'}],
                    'T_STATIC'
                ]},
                {name: 'variable', what: 'N_VARIABLE'}, {optionally: [(/=/), {name: 'value', rule: 'N_EXPRESSION'}]}, 'N_END_STATEMENT'
            ]
        },
        'N_STRING': {
            components: {name: 'string', what: 'T_STRING'}
        },
        'N_STRING_EXPRESSION': {
            components: [
                (/"/),
                {
                    name: 'parts',
                    zeroOrMoreOf: {
                        oneOf: ['N_STRING_INTERPOLATED_EXPRESSION', 'N_STRING_TEXT']
                    },
                    ignoreWhitespace: false
                },
                (/"/)
            ],
            processor: function (node) {
                if (node.parts.length === 1 && node.parts[0].name === 'N_STRING_LITERAL') {
                    // Double-quoted string is not complex as it does not contain any interpolation -
                    // no need to wrap it in an N_STRING_EXPRESSION
                    return node.parts[0];
                }

                if (node.parts.length === 0) {
                    // Handle empty string literals
                    return {
                        name: 'N_STRING_LITERAL',
                        string: ''
                    };
                }

                return node;
            }
        },
        'N_STRING_LITERAL': {
            components: {
                oneOf: [
                    // Single-quoted string
                    {name: 'string', what: 'T_CONSTANT_ENCAPSED_STRING'},

                    // Double-quoted string
                    'N_STRING_EXPRESSION'
                ]
            }
        },
        'N_STRING_TEXT': {
            captureAs: 'N_STRING_LITERAL',
            components: {
                name: 'string',
                what: (/(?:[^\\"${]|\\[\s\S]|\$(?=\$)|\$(?![{a-zA-Z])|{\\\$|{(?!\$))+/),
                replace: stringEscapeReplacements
            }
        },
        'N_STRING_INTERPOLATED_EXPRESSION': {
            components: {
                oneOf: [
                    'N_STRING_SIMPLE_INTERPOLATED_EXPRESSION',
                    'N_STRING_COMPLEX_INTERPOLATED_EXPRESSION'
                ]
            }
        },
        'N_STRING_SIMPLE_INTERPOLATED_EXPRESSION': {
            components: {oneOf: [
                'N_STRING_SIMPLE_UNBRACED_INTERPOLATED_EXPRESSION',
                'N_STRING_SIMPLE_BRACED_INTERPOLATED_EXPRESSION'
            ]}
        },
        'N_STRING_SIMPLE_UNBRACED_INTERPOLATED_EXPRESSION': {
            components: [(/\$/), 'N_STRING_SIMPLE_INTERPOLATED_DEREFERENCE']
        },
        'N_STRING_SIMPLE_BRACED_INTERPOLATED_EXPRESSION': {
            captureAs: 'N_VARIABLE_EXPRESSION',
            components: [
                (/\${/),
                {rule: 'N_STRING_SIMPLE_INTERPOLATED_DEREFERENCE', ignoreWhitespace: true},
                (/\}/)
            ]
        },
        'N_STRING_SIMPLE_INTERPOLATED_BRACED_BARE_VARIABLE': {
            // Don't swallow whitespace - it should remain inside the captured plain text parts of the string
            components: [{name: 'variable', what: 'T_STRING'}, (/(?!\s*::)/)]
        },
        'N_STRING_SIMPLE_INTERPOLATED_BRACED_CLASS_NAME': {
            // Don't swallow whitespace - it should remain inside the captured plain text parts of the string
            components: [{name: 'string', what: 'T_STRING'}, (/(?=\s*::)/)]
        },
        /**
         * PHP's "simple" interpolated syntax has its own set of rules around how dereferencing is parsed:
         * - Instance method calls are not allowed
         * - Array indices must be barewords in the unbraced syntax (eg. "before $myArray[el] after")
         * - Array indices must be quoted in the braced syntax (eg. "before ${myArray['el']} after")
         */
        'N_STRING_SIMPLE_INTERPOLATED_DEREFERENCE': {
            components: [
                {oneOf: [
                    {name: 'expression', what: 'N_VARIABLE'},
                    {name: 'expression', oneOf: [
                        'N_STRING_SIMPLE_INTERPOLATED_BRACED_BARE_VARIABLE',
                        'N_STRING_SIMPLE_INTERPOLATED_BRACED_CLASS_NAME'
                    ]}
                ]},
                {
                    name: 'member',
                    zeroOrMoreOf: {
                        oneOf: [
                            // Array index
                            {
                                name: 'array_index',
                                oneOf: [
                                    'N_EMPTY_ARRAY_INDEX',
                                    {
                                        name: 'indices',
                                        oneOrMoreOf: [
                                            (/\[/), {name: 'index', what: 'N_EXPRESSION'}, (/\]/)
                                        ]
                                    }
                                ]
                            },
                            // Object property
                            {
                                name: 'object_property',
                                what: {
                                    name: 'properties',
                                    oneOrMoreOf: [
                                        'T_OBJECT_OPERATOR',
                                        {name: 'property', what: 'N_INSTANCE_MEMBER'}
                                    ]
                                }
                            },
                            // Static method call
                            {
                                name: 'static_method_call',
                                what: [
                                    'T_DOUBLE_COLON',
                                    {name: 'method', oneOf: ['N_STRING', 'N_VARIABLE', 'N_VARIABLE_EXPRESSION', 'N_MEMBER_EXPRESSION']},
                                    (/\(/),
                                    {name: 'args', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                                    (/\)/)
                                ]
                            },
                            // Static object property
                            {
                                name: 'static_property',
                                what: [
                                    'T_DOUBLE_COLON',
                                    {name: 'property', what: 'N_STATIC_MEMBER'}
                                ]
                            },
                            // Class constant
                            {
                                name: 'class_constant',
                                what: [
                                    'T_DOUBLE_COLON',
                                    {name: 'constant', what: ['T_STRING', (/(?!\()/)]}
                                ]
                            }
                        ]
                    }
                }
            ],
            processor: function (node) {
                var isVariableVariable = false,
                    result;

                if (!node || !node.expression) {
                    return node;
                }

                if (node.expression.name === 'N_VARIABLE') {
                    // A variable was used inside the braces (eg. "${$myVar->prop}") -
                    // will resolve to the value of the variable whose name is contained in ->prop
                    isVariableVariable = true;
                } else if (node.expression.name === 'N_STRING_SIMPLE_INTERPOLATED_BRACED_BARE_VARIABLE') {
                    // A bare string was used inside the braces referencing a variable (eg. "${myVar->prop}") -
                    // will resolve to the value of ->prop
                    node.expression.name = 'N_VARIABLE';

                    if (node.expression.bounds) {
                        // Account for the leading dollar
                        node.expression.bounds.start.offset--;
                        node.expression.bounds.start.column--;
                    }
                } else if (node.expression.name === 'N_STRING_SIMPLE_INTERPOLATED_BRACED_CLASS_NAME') {
                    // A bare string was used inside the braces referencing a class (eg. "${MyClass::MY_CONST}") -
                    // will resolve to the value of the variable whose name is contained in ::MY_CONST
                    isVariableVariable = true;
                    node.expression.name = 'N_STRING';
                } else {
                    throw new Error(
                        'N_STRING_SIMPLE_INTERPOLATED_DEREFERENCE :: Unexpected node type "' +
                        node.expression.name +
                        '"'
                    );
                }

                result = node.expression;

                _.each(node.member, function (member) {
                    if (member.array_index) {
                        result = {
                            name: 'N_ARRAY_INDEX',
                            array: result,
                            indices: member.array_index.indices
                        };
                    } else if (member.object_property) {
                        result = {
                            name: 'N_OBJECT_PROPERTY',
                            object: result,
                            properties: member.object_property.properties
                        };
                    } else if (member.static_method_call) {
                        result = {
                            name: 'N_STATIC_METHOD_CALL',
                            className: result,
                            method: member.static_method_call.method,
                            args: member.static_method_call.args
                        };
                    } else if (member.static_property) {
                        result = {
                            name: 'N_STATIC_PROPERTY',
                            className: result,
                            property: member.static_property.property
                        };
                    } else if (member.class_constant) {
                        result = {
                            name: 'N_CLASS_CONSTANT',
                            className: result,
                            constant: member.class_constant.constant
                        };
                    }

                    if (member.offset) {
                        result.offset = member.offset;
                    }
                });

                if (isVariableVariable) {
                    result = {
                        name: 'N_VARIABLE_EXPRESSION',
                        expression: result
                    };
                }

                return result;
            }
        },
        'N_STRING_COMPLEX_INTERPOLATED_EXPRESSION': {
            components: {
                what: [
                    (/{(?=\$)/),
                    // Allow whitespace inside the embedded expression, eg. around ternary operators `?` and `:`
                    {rule: 'N_EXPRESSION', ignoreWhitespace: true},
                    (/\}/)
                ]
            }
        },
        'N_SWITCH_STATEMENT': {
            components: ['T_SWITCH', (/\(/), {name: 'expression', what: 'N_EXPRESSION'}, (/\)/), (/\{/), {name: 'cases', zeroOrMoreOf: {oneOf: ['N_CASE', 'N_DEFAULT_CASE']}}, (/\}/)]
        },
        'N_TERM': {
            components: {oneOf: [
                'N_VARIABLE',
                'N_FLOAT',
                'N_INTEGER',
                'N_BOOLEAN',
                'N_STRING_LITERAL',
                'N_BINARY_LITERAL',
                'N_ARRAY_LITERAL',
                'N_LIST',
                'N_ISSET',
                'N_EMPTY',
                'N_EXIT',
                'N_CLOSURE',
                'N_MAGIC_CONSTANT',
                'N_REQUIRE_EXPRESSION',
                'N_REQUIRE_ONCE_EXPRESSION',
                'N_INCLUDE_EXPRESSION',
                'N_INCLUDE_ONCE_EXPRESSION',
                'N_SELF',
                'N_PARENT',
                'N_STATIC',
                'N_NULL',
                'N_NAMESPACED_REFERENCE',
                'N_EVAL',
                'N_STRING',
                'N_HEREDOC',
                'N_NOWDOC',
                'N_VARIABLE_EXPRESSION'
            ]}
        },
        'N_THROW_STATEMENT': {
            components: ['T_THROW', {name: 'expression', rule: 'N_EXPRESSION'}, 'N_END_STATEMENT']
        },
        'N_TRY_STATEMENT': {
            components: [
                'T_TRY',
                {name: 'body', what: 'N_STATEMENT'},
                {
                    name: 'catches',
                    zeroOrMoreOf: [
                        'T_CATCH',
                        (/\(/),
                        {name: 'type', oneOf: ['N_NAMESPACED_REFERENCE', 'N_STRING']},
                        {name: 'variable', rule: 'N_VARIABLE'},
                        (/\)/),
                        {name: 'body', what: 'N_STATEMENT'}
                    ]
                },
                {optionally: {name: 'finalizer', what: ['T_FINALLY', 'N_STATEMENT']}}
            ],
            processor: function (node) {
                if (!node.finalizer) {
                    node.finalizer = null;
                }

                return node;
            }
        },
        'N_ARRAY_TYPE': {
            components: [{allowMerge: false, rule: 'T_ARRAY'}]
        },
        'N_CALLABLE_TYPE': {
            components: [{allowMerge: false, rule: 'T_CALLABLE'}]
        },
        'N_CLASS_TYPE': {
            components: [{name: 'className', oneOf: ['N_NAMESPACE', 'T_STRING']}]
        },
        'N_ITERABLE_TYPE': {
            components: [{allowMerge: false, what: /iterable\b/i}]
        },
        'N_TYPE': {
            components: [
                {oneOf: ['N_ARRAY_TYPE', 'N_CALLABLE_TYPE', 'N_ITERABLE_TYPE', 'N_CLASS_TYPE']}
            ]
        },
        'N_UNSET_STATEMENT': {
            components: ['T_UNSET', (/\(/), {name: 'variables', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/), 'N_END_STATEMENT']
        },
        'N_USE_STATEMENT': {
            components: ['T_USE', {name: 'uses', oneOrMoreOf: [{name: 'source', oneOf: ['N_NAMESPACE', 'T_STRING']}, {optionally: ['T_AS', {name: 'alias', what: 'T_STRING'}]}]}, 'N_END_STATEMENT']
        },
        'N_VARIABLE': {
            components: [
                {oneOf: [
                    {name: 'variable', what: 'T_VARIABLE'},
                    {name: 'variable', what: (/\$\{([a-z0-9_]+)\}/i), captureIndex: 1}
                ]}
            ]
        },
        'N_MEMBER_EXPRESSION': {
            components: [(/\{/), 'N_EXPRESSION', (/\}/)]
        },
        'N_VARIABLE_EXPRESSION': {
            components: {
                name: 'expression',
                rule: 'N_STATIC_VARIABLE_EXPRESSION'
            }
        },
        'N_VISIBILITY': {
            oneOf: ['T_PUBLIC', 'T_PRIVATE', 'T_PROTECTED']
        },
        'N_VOID': {
            components: {name: 'value', what: (/,()/), captureIndex: 1}
        },
        'N_WHILE_STATEMENT': {
            components: ['T_WHILE', (/\(/), {name: 'condition', what: 'N_EXPRESSION'}, (/\)/), {name: 'body', what: 'N_STATEMENT'}]
        }
    },
    start: 'N_PROGRAM'
};
