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
 * Translations for parsing-related errors
 */
module.exports = {
    'en_GB': {
        'core': {
            'cannot_mix_namespace_declaration_types': 'Cannot mix bracketed namespace declarations with unbracketed namespace declarations',
            'cannot_nest_namespace_declarations': 'Namespace declarations cannot be nested',
            'namespace_declaration_must_come_first': 'Namespace declaration statement has to be the very first statement or after any declare call in the script',
            'no_code_outside_namespace_declaration_braces': 'No code may exist outside of namespace {}',
            'unexpected_end_of_input': 'syntax error, unexpected end of file',
            'syntax_error': 'syntax error, unexpected ${what}'
        }
    }
};
