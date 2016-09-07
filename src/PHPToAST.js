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
    CAPTURE_ALL_OFFSETS = 'captureAllOffsets',
    CAPTURE_ALL_OFFSETS_AS = 'captureAllOffsetsAs';

function PHPToAST(parsing, phpGrammarSpec) {
    this.parsing = parsing;
    this.phpGrammarSpec = phpGrammarSpec;
}

_.extend(PHPToAST.prototype, {
    create: function (stderr, options) {
        var lib = this,
            parsingOptions = _.extend({}, options || {});

        if (parsingOptions[CAPTURE_ALL_OFFSETS]) {
            parsingOptions[CAPTURE_ALL_OFFSETS_AS] = 'offset';
            delete parsingOptions[CAPTURE_ALL_OFFSETS];
        }

        return lib.parsing.create(lib.phpGrammarSpec, stderr, parsingOptions);
    }
});

module.exports = PHPToAST;
