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

/**
 * @param {Parsing} parsing
 * @param {object} phpGrammarSpec
 * @constructor
 */
function PHPToAST(parsing, phpGrammarSpec) {
    /**
     * @type {Parsing}
     */
    this.parsing = parsing;
    /**
     * @type {Object}
     */
    this.phpGrammarSpec = phpGrammarSpec;
}

_.extend(PHPToAST.prototype, {
    /**
     * Creates a new PHP parser
     *
     * @param {Stream} stderr
     * @param {object} options
     * @returns {object}
     */
    create: function (stderr, options) {
        var lib = this,
            parsingOptions = _.extend({}, options || {});

        return lib.parsing.create(lib.phpGrammarSpec, stderr, parsingOptions);
    }
});

module.exports = PHPToAST;
