/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

function PHPToAST(parsing, phpGrammarSpec) {
    this.parsing = parsing;
    this.phpGrammarSpec = phpGrammarSpec;
}

_.extend(PHPToAST.prototype, {
    create: function (stderr) {
        var lib = this;

        return lib.parsing.create(lib.phpGrammarSpec, stderr);
    }
});

module.exports = PHPToAST;
