/*
 * PHP-To-AST - PHP parser
 * Copyright (c) Dan Phillimore (asmblah)
 * http://uniter.github.com/phptoast/
 *
 * Released under the MIT license
 * https://github.com/uniter/phptoast/raw/master/MIT-LICENSE.txt
 */

'use strict';

var parsing = require('parsing'),
    phpGrammarSpec = require('./src/grammar'),
    PHPToAST = require('./src/PHPToAST');

module.exports = new PHPToAST(parsing, phpGrammarSpec);
