/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    util = require('util');

function UnexpectedSyntaxException(file, line, what) {
    this.file = file;
    this.line = line;
    this.message = 'Syntax error, unexpected ' + what + ' in ' + file + ' on line ' + line;
    this.what = what;
}

util.inherits(UnexpectedSyntaxException, Error);

_.extend(UnexpectedSyntaxException.prototype, {
    type: 'UnexpectedSyntaxException'
});

module.exports = UnexpectedSyntaxException;
