PHP-To-AST
==========

[![Build Status](https://github.com/uniter/phptoast/workflows/CI/badge.svg)](https://github.com/uniter/phptoast/actions?query=workflow%3ACI)

PHP-to-AST parser.

Defining syntax extensions
--------------------------
Sometimes it can be handy to extend PHP's syntax with custom constructs.
You can modify and extend PHPToAST's built-in grammar with the `options` argument passed to `.create(...)`.

For example:
```javascript
var phpParser = require('phptoast').create(null, {
    rules: {
        'N_CUSTOM_TRAP_IT': {
            components: [/trap_it/, /@/, {name: 'arg', rule: 'N_EXPRESSION'}, /;/]
        },
        'N_NAMESPACE_SCOPED_STATEMENT': {
            components: {oneOf: ['N_CUSTOM_TRAP_IT', 'N_NAMESPACE_SCOPED_STATEMENT']}
        }
    }
});

console.log(JSON.stringify(phpParser.parse('<?php firstFunc(); trap_it @ 21; secondFunc();'), null, 4));
/**
 * Gives:
 * {
 *    "name": "N_PROGRAM",
 *    "statements": [
 *        {
 *            "name": "N_EXPRESSION_STATEMENT",
 *            "expression": {
 *                "name": "N_FUNCTION_CALL",
 *                "func": {
 *                    "name": "N_STRING",
 *                    "string": "firstFunc"
 *                },
 *                "args": []
 *            }
 *        },
 *        {
 *            "name": "N_CUSTOM_TRAP_IT",
 *            "arg": {
 *                "name": "N_INTEGER",
 *                "number": "21"
 *            }
 *        },
 *        {
 *            "name": "N_EXPRESSION_STATEMENT",
 *            "expression": {
 *                "name": "N_FUNCTION_CALL",
 *                "func": {
 *                    "name": "N_STRING",
 *                    "string": "secondFunc"
 *                },
 *                "args": []
 *            }
 *        }
 *    ]
 * }
 */
```

Keeping up to date
------------------
- [Follow me on Twitter](https://twitter.com/@asmblah) for updates: [https://twitter.com/@asmblah](https://twitter.com/@asmblah)
