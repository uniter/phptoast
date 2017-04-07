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

            if (result.offset) {
                binaryNode.offset = {
                    length: (element.offset.offset - result.offset.offset) + element.offset.length,
                    line: result.offset.line,
                    column: result.offset.column,
                    offset: result.offset.offset
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

            if (condition.offset) {
                ternaryNode.offset = {
                    length: (alternateNode.offset.offset - ternaryNode.condition.offset.offset) +
                        alternateNode.offset.length,
                    line: ternaryNode.condition.offset.line,
                    column: ternaryNode.condition.offset.column,
                    offset: ternaryNode.condition.offset.offset
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
        'T_COMMENT': /(?:\/\/|#)(.*?)[\r\n]+|\/\*(?!\*)([\s\S]*?)\*\//,
        'T_CONCAT_EQUAL': /\.=/,
        'T_CONST': /const\b/i,
        'T_CONSTANT_ENCAPSED_STRING': {oneOf: [
            // Single-quoted
            {what: /'((?:[^\\']|\\[\s\S])*)'/, captureIndex: 1, replace: singleQuotedStringEscapeReplacements},
            // Double-quoted
            {what: /"((?:(?!\$\{?[\$a-z0-9_]+)(?:[^\\"]|\\[\s\S]))*)"/, captureIndex: 1, replace: stringEscapeReplacements}
        ]},
        'T_CONTINUE': /continue\b/i,
        'T_CURLY_OPEN': /\{(?=\$)/,
        'T_DEC': /--/i,
        'T_DECLARE': /declare\b/i,
        'T_DEFAULT': /default\b/i,
        'T_DIR': /__DIR__\b/i,
        'T_DIV_EQUAL': /\/=/,

        // See http://www.php.net/manual/en/language.types.float.php
        'T_DNUMBER': /\d+\.\d+|\d\.\d+e\d+|\d+e[+-]\d+/i,

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
        'T_INLINE_HTML': /(?:[^<]|<[^?%]|<\?(?!php)[\s\S]{3})+/,
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
        'T_STRING': /(?![\$0-9])[\$a-z0-9_]+/i,
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
                [{name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}, (/=/), {name: 'value', oneOf: ['N_CLASS_CONSTANT', 'N_TERM']}],
                [{name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}],
                [{name: 'type', oneOf: ['N_NAMESPACE', 'T_STRING']}, {name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}, (/=/), {name: 'value', oneOf: ['N_CLASS_CONSTANT', 'N_TERM']}],
                [{name: 'type', oneOf: ['N_NAMESPACE', 'T_STRING']}, {name: 'variable', rule: 'N_ARGUMENT_VARIABLE'}]
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
            components: ['T_FUNCTION', (/\(/), {name: 'args', zeroOrMoreOf: ['N_ARGUMENT', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/), {oneOf: [['T_USE', (/\(/), {name: 'bindings', zeroOrMoreOf: ['N_ARGUMENT_VARIABLE', {what: (/(,|(?=\)))()/), captureIndex: 2}]}, (/\)/)], {name: 'bindings', zeroOrMoreOf: {what: (/(?!)/)}}]}, {name: 'body', what: 'N_STATEMENT'}]
        },
        'N_COMMA_EXPRESSION': {
            components: {optionally: [{name: 'expressions', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=[;\)]))()/), captureIndex: 2}]}, (/(?=[;\)])/)]}
        },
        'N_COMPOUND_STATEMENT': {
            components: [(/\{/), {name: 'statements', zeroOrMoreOf: 'N_STATEMENT'}, (/\}/)]
        },
        'N_CONSTANT_DEFINITION': {
            components: ['T_CONST', {name: 'constant', what: 'T_STRING'}, (/=/), {name: 'value', oneOf: ['N_CLASS_CONSTANT', 'N_TERM']}, 'N_END_STATEMENT']
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
        'N_NEW_EXPRESSION_DYNAMIC_CLASS': {
            components: [
                {
                    name: 'expression',
                    oneOf: ['N_EXPRESSION_LEVEL_0', 'N_NAMESPACED_REFERENCE']
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

                    if (member.offset) {
                        result.offset = member.offset;
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
            ifNoMatch: {component: 'className', capture: 'next'}
        },
        'N_DO_WHILE_STATEMENT': {
            components: ['T_DO', {name: 'body', what: 'N_STATEMENT'}, 'T_WHILE', (/\(/), {name: 'condition', what: 'N_EXPRESSION'}, (/\)/), 'N_END_STATEMENT']
        },
        'N_EXPRESSION_LEVEL_1_B': {
            captureAs: 'N_FUNCTION_CALL',
            components: {oneOf: [
                [
                    {name: 'func', oneOf: ['N_NAMESPACED_REFERENCE', 'N_EXPRESSION_LEVEL_1_A']},
                    [
                        (/\(/),
                        {name: 'args', zeroOrMoreOf: ['N_EXPRESSION', {what: (/(,|(?=\)))()/), captureIndex: 2}]},
                        (/\)/)
                    ]
                ],
                {name: 'next', what: 'N_EXPRESSION_LEVEL_1_A'}
            ]},
            ifNoMatch: {component: 'func', capture: 'next'}
        },
        'N_EXPRESSION_LEVEL_1_C': {
            captureAs: 'N_UNARY_EXPRESSION',
            components: [{name: 'operator', optionally: 'T_CLONE'}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_1_B'}],
            ifNoMatch: {component: 'operator', capture: 'operand'},
            options: {prefix: true}
        },
        'N_EXPRESSION_LEVEL_2_A': {
            captureAs: 'N_CLASS_CONSTANT',
            components: {oneOf: [
                [
                    {name: 'className', oneOf: ['N_NAMESPACED_REFERENCE', 'N_EXPRESSION_LEVEL_1_C']},
                    'T_DOUBLE_COLON',
                    {name: 'constant', what: ['T_STRING', (/(?!\()/)]}
                ],
                {name: 'next', what: 'N_EXPRESSION_LEVEL_1_C'}
            ]},
            ifNoMatch: {component: 'constant', capture: 'next'}
        },
        'N_CLASS_CONSTANT': 'N_EXPRESSION_LEVEL_2_A',
        'N_EMPTY_ARRAY_INDEX': {
            captureAs: 'N_ARRAY_INDEX',
            components: {name: 'indices', what: [(/\[/), (/\]/)]},
            options: {indices: true}
        },
        'N_EXPRESSION_LEVEL_2_B': {
            components: [
                {
                    name: 'expression',
                    oneOf: ['N_EXPRESSION_LEVEL_2_A', 'N_NAMESPACED_REFERENCE']
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
                                    {name: 'method', oneOf: ['N_STRING', 'N_VARIABLE', 'N_VARIABLE_EXPRESSION']},
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
                    }

                    if (member.offset) {
                        result.offset = member.offset;
                    }
                });

                return result;
            }
        },
        'N_EXPRESSION_LEVEL_2_C': {
            components: {oneOf: ['N_REFERENCE', 'N_EXPRESSION_LEVEL_2_B']}
        },
        'N_REFERENCE': {
            components: [(/&/), {name: 'operand', what: 'N_EXPRESSION_LEVEL_2_B'}]
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
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_10'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/&&/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_10']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_12': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_11'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/\^/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_11']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_13': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_12'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/\|/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_12']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_14': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_13'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/&/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_13']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_15': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_14'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: (/\|\|/)}, {name: 'operand', oneOf: ['N_ASSIGNMENT_EXPRESSION', 'N_EXPRESSION_LEVEL_14']}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
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
        },
        'N_EXPRESSION_LEVEL_19': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_18'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: 'T_LOGICAL_XOR', replace: lowercaseReplacements}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_18'}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_20': {
            captureAs: 'N_EXPRESSION',
            components: [{name: 'left', what: 'N_EXPRESSION_LEVEL_19'}, {name: 'right', zeroOrMoreOf: [{name: 'operator', what: 'T_LOGICAL_OR', replace: lowercaseReplacements}, {name: 'operand', what: 'N_EXPRESSION_LEVEL_19'}]}],
            ifNoMatch: {component: 'right', capture: 'left'}
        },
        'N_EXPRESSION_LEVEL_21': {
            components: 'N_EXPRESSION_LEVEL_20'
        },
        'N_LEFT_HAND_SIDE_EXPRESSION': 'N_EXPRESSION_LEVEL_2_B',
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
            components: ['T_GOTO', {name: 'label', what: 'T_STRING'}, 'N_END_STATEMENT']
        },
        'N_HEREDOC': {
            components: [{name: 'string', what: /<<<("?)([a-z0-9_]+)\1\r?\n([\s\S]*?)\r?\n\2(?=;?(?:\r?\n|$))/i, captureIndex: 3}],
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
            components: [{name: 'parts', oneOrMoreOf: {oneOf: ['N_STRING_VARIABLE', 'N_STRING_VARIABLE_EXPRESSION', 'N_HEREDOC_TEXT']}}]
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
        'N_INLINE_HTML_STATEMENT': [{oneOf: ['T_CLOSE_TAG', '<BOF>']}, {name: 'html', what: 'T_INLINE_HTML'}, {oneOf: ['T_OPEN_TAG', '<EOF>']}],
        'N_INSTANCE_MEMBER': {
            components: {oneOf: ['N_STRING', 'N_VARIABLE', [(/\{/), 'N_EXPRESSION', (/\}/)]]}
        },
        'N_INSTANCE_PROPERTY_DEFINITION': {
            components: [{name: 'visibility', oneOf: ['T_PUBLIC', 'T_PRIVATE', 'T_PROTECTED']}, {name: 'variable', what: 'N_VARIABLE'}, {optionally: [(/=/), {name: 'value', oneOf: ['N_CLASS_CONSTANT', 'N_TERM']}]}, 'N_END_STATEMENT']
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
            components: ['T_INTERFACE', {name: 'interfaceName', rule: 'T_STRING'}, {optionally: ['T_EXTENDS', {name: 'extend', oneOf: ['N_NAMESPACE', 'T_STRING']}]}, (/\{/), {name: 'members', zeroOrMoreOf: {oneOf: ['N_INTERFACE_METHOD_DEFINITION', 'N_STATIC_INTERFACE_METHOD_DEFINITION', 'N_CONSTANT_DEFINITION', 'N_INSTANCE_PROPERTY_DEFINITION', 'N_STATIC_PROPERTY_DEFINITION', 'N_METHOD_DEFINITION', 'N_STATIC_METHOD_DEFINITION', 'N_ABSTRACT_METHOD_DEFINITION', 'N_ABSTRACT_STATIC_METHOD_DEFINITION']}}, (/\}/)]
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
            components: [{name: 'label', what: [(/(?!default\b)/i), 'T_STRING']}, (/:/)]
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
            components: {what: 'T_LINE', replace: uppercaseReplacements, captureOffsetAs: 'offset'}
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
            components: [{name: 'string', what: /<<<'([a-z0-9_]+)'\r?\n([\s\S]*?)\r?\n\1(?=;?(?:\r?\n|$))/i, captureIndex: 2}]
        },
        'N_NULL': {
            allowMerge: false,
            what: (/null\b/i)
        },
        'N_PARENT': {
            allowMerge: false,
            what: /parent\b(?=\s*::)/i
        },
        'N_PROGRAM': {
            components: [{optionally: 'T_OPEN_TAG'}, {name: 'statements', zeroOrMoreOf: 'N_STATEMENT'}, {oneOf: ['T_CLOSE_TAG', {what: '<EOF>'}]}]
        },
        'N_RETURN_STATEMENT': {
            components: ['T_RETURN', {name: 'expression', optionally: 'N_EXPRESSION'}, 'N_END_STATEMENT']
        },
        'N_STATEMENT': {
            components: {oneOf: ['N_NAMESPACE_SCOPED_STATEMENT', 'N_NAMESPACE_STATEMENT']}
        },
        'N_NAMESPACE_SCOPED_STATEMENT': {
            components: {oneOf: ['N_COMPOUND_STATEMENT', 'N_RETURN_STATEMENT', 'N_INLINE_HTML_STATEMENT', 'N_EMPTY_STATEMENT', 'N_ECHO_STATEMENT', 'N_BREAK_STATEMENT', 'N_CONTINUE_STATEMENT', 'N_UNSET_STATEMENT', 'N_EXPRESSION_STATEMENT', 'N_FUNCTION_STATEMENT', 'N_IF_STATEMENT', 'N_FOREACH_STATEMENT', 'N_FOR_STATEMENT', 'N_WHILE_STATEMENT', 'N_DO_WHILE_STATEMENT', 'N_CLASS_STATEMENT', 'N_INTERFACE_STATEMENT', 'N_SWITCH_STATEMENT', 'N_GLOBAL_STATEMENT', 'N_LABEL_STATEMENT', 'N_GOTO_STATEMENT', 'N_USE_STATEMENT', 'N_THROW_STATEMENT', 'N_TRY_STATEMENT']}
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
                {name: 'variable', what: 'N_VARIABLE'}, {optionally: [(/=/), {name: 'value', oneOf: ['N_CLASS_CONSTANT', 'N_TERM']}]}, 'N_END_STATEMENT'
            ]
        },
        'N_STRING': {
            components: {name: 'string', what: 'T_STRING'}
        },
        'N_STRING_EXPRESSION': {
            components: [(/"/), {name: 'parts', oneOrMoreOf: {oneOf: ['N_STRING_VARIABLE', 'N_STRING_VARIABLE_EXPRESSION', 'N_STRING_TEXT']}}, (/"/)]
        },
        'N_STRING_LITERAL': {
            components: {oneOf: [{name: 'string', what: 'T_CONSTANT_ENCAPSED_STRING'}, 'N_STRING_EXPRESSION']}
        },
        'N_STRING_TEXT': {
            captureAs: 'N_STRING_LITERAL',
            components: {name: 'string', what: (/(?:[^\\"\$]|\\[\s\S]|\$(?=\$))+/), ignoreWhitespace: false, replace: stringEscapeReplacements}
        },
        'N_STRING_VARIABLE': {
            captureAs: 'N_VARIABLE',
            components: [
                {oneOf: [
                    {name: 'variable', what: 'T_VARIABLE'},
                    {name: 'variable', what: (/\$\{([a-z0-9_]+)\}/i), captureIndex: 1}
                ]}
            ]
        },
        'N_STRING_VARIABLE_EXPRESSION': {
            captureAs: 'N_VARIABLE_EXPRESSION',
            components: [
                {oneOf: [
                    {name: 'expression', what: [(/\$\{(?=\$)/), 'N_VARIABLE', (/\}/)]}
                ]}
            ]
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
                'N_STRING',
                'N_HEREDOC',
                'N_NOWDOC'
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
            components: ['T_WHILE', (/\(/), {name: 'condition', what: 'N_EXPRESSION'}, (/\)/), (/\{/), {name: 'statements', zeroOrMoreOf: 'N_STATEMENT'}, (/\}/)]
        }
    },
    start: 'N_PROGRAM'
};
