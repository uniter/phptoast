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

function State() {
    this.path = null;
}

_.extend(State.prototype, {
    getPath: function () {
        var path = this.path;

        return path === null ? '(program)' : path;
    },

    isMainProgram: function () {
        return this.path === null;
    },

    setPath: function (path) {
        this.path = path;
    }
});

module.exports = State;
