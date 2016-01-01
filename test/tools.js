/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var phpToAST = require('..');

module.exports = {
    createParser: function (options) {
        // `stderr` is always `null` for now
        return phpToAST.create(null, options);
    }
};
