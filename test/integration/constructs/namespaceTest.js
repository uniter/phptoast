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
    expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    phpCommon = require('phpcommon'),
    tools = require('../../tools'),
    PHPFatalError = phpCommon.PHPFatalError;

describe('PHP Parser grammar namespace {...} construct integration', function () {
    var parser;

    beforeEach(function () {
        parser = tools.createParser();
    });

    _.each({
        'first level namespace definition with no contents': {
            code: '<?php namespace Test;',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Test',
                    statements: []
                }]
            }
        },
        'first level namespace definition with one expression statement': {
            code: '<?php namespace Test; myFunc();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Test',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }]
            }
        },
        'top level namespace definitions with single expression statements': {
            code: '<?php namespace Here; myFunc(); namespace There; yourFunc();',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Here',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }, {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'There',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
                        }
                    }]
                }]
            }
        },
        'top level braced namespace definitions with single expression statements': {
            code: '<?php namespace Here { myFunc(); } namespace There { yourFunc(); }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Here',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }, {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'There',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
                        }
                    }]
                }]
            }
        },
        'top level braced global namespace definition with single expression statements': {
            code: '<?php namespace Here { myFunc(); } namespace { yourFunc(); }',
            expectedAST: {
                name: 'N_PROGRAM',
                statements: [{
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: 'Here',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'myFunc'
                            },
                            args: []
                        }
                    }]
                }, {
                    name: 'N_NAMESPACE_STATEMENT',
                    namespace: '',
                    statements: [{
                        name: 'N_EXPRESSION_STATEMENT',
                        expression: {
                            name: 'N_FUNCTION_CALL',
                            func: {
                                name: 'N_STRING',
                                string: 'yourFunc'
                            },
                            args: []
                        }
                    }]
                }]
            }
        }
    }, function (scenario, description) {
        describe(description, function () {
            // Pretty-print the code strings so any non-printable characters are readable
            describe('when the code is ' + JSON.stringify(scenario.code) + ' ?>', function () {
                it('should return the expected AST', function () {
                    expect(parser.parse(scenario.code)).to.deep.equal(scenario.expectedAST);
                });
            });
        });
    });

    it('should raise a PHP fatal error when braced namespace declarations are nested', function () {
        var caughtError,
            code = nowdoc(function () {/*<<<EOS
<?php
namespace My\Outer\One
{
    namespace Your\Inner\One
    {
        return 'The nesting is invalid';
    }
}
EOS
*/}); // jshint ignore:line
        parser.getState().setPath('/path/to/my_module.php');

        try {
            parser.parse(code);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('Namespace declarations cannot be nested');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(4);
    });

    it('should raise a PHP fatal error when namespace declaration types are mixed semicolon -> braced', function () {
        var caughtError,
            code = nowdoc(function () {/*<<<EOS
<?php

namespace My\Semicolon\One;

namespace Your\Braced\One
{
    return 'The mixing is invalid';
}
EOS
*/}); // jshint ignore:line
        parser.getState().setPath('/path/to/my_module.php');

        try {
            parser.parse(code);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('Cannot mix bracketed namespace declarations with unbracketed namespace declarations');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(5);
    });

    it('should raise a PHP fatal error when namespace declaration types are mixed braced -> semicolon', function () {
        var caughtError,
            code = nowdoc(function () {/*<<<EOS
<?php

namespace Your\Braced\One
{
    return 'The mixing is invalid';
}

namespace My\Semicolon\One;

EOS
*/}); // jshint ignore:line
        parser.getState().setPath('/path/to/my_module.php');

        try {
            parser.parse(code);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('Cannot mix bracketed namespace declarations with unbracketed namespace declarations');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(8);
    });

    it('should raise a PHP fatal error when code is above a semicolon namespace declaration', function () {
        var caughtError,
            code = nowdoc(function () {/*<<<EOS
<?php

myFunc();

namespace My\Semicolon\One;

EOS
*/}); // jshint ignore:line
        parser.getState().setPath('/path/to/my_module.php');

        try {
            parser.parse(code);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('Namespace declaration statement has to be the very first statement or after any declare call in the script');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(5);
    });

    it('should raise a PHP fatal error when code is above a braced namespace declaration', function () {
        var caughtError,
            code = nowdoc(function () {/*<<<EOS
<?php

myFunc();

namespace My\Braced\One
{
    return 'The mixing is invalid';
}

EOS
*/}); // jshint ignore:line
        parser.getState().setPath('/path/to/my_module.php');

        try {
            parser.parse(code);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('Namespace declaration statement has to be the very first statement or after any declare call in the script');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(5);
    });

    it('should raise a PHP fatal error when code is below a braced namespace declaration', function () {
        var caughtError,
            code = nowdoc(function () {/*<<<EOS
<?php


namespace My\Braced\One
{
    myFunc();
}

return 'The mixing is invalid';

EOS
*/}); // jshint ignore:line
        parser.getState().setPath('/path/to/my_module.php');

        try {
            parser.parse(code);
        } catch (error) {
            caughtError = error;
        }

        expect(caughtError).to.be.an.instanceOf(PHPFatalError);
        expect(caughtError.getMessage()).to.equal('No code may exist outside of namespace {}');
        expect(caughtError.getFilePath()).to.equal('/path/to/my_module.php');
        expect(caughtError.getLevel()).to.equal('Fatal error');
        expect(caughtError.getLineNumber()).to.equal(9);
    });
});
