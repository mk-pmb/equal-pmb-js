/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var eq = require('equal-pmb'), assert = require('assert');

function ok(func, a, b) { func(a, b); /* does not throw */ }
function no(func, a, b) { assert.throws(func.bind(null, a, b)); }

ok(eq, true, true);
no(eq, true, false);
no(eq, true, 1);

ok(eq, [ [ true ] ], [ [ true ] ]);
no(eq, [ [ true ] ], [ [ false ] ]);
no(eq, [ [ true ] ], [ [ 1 ] ]);


function makeFail(msg, ErrCls) {
  if (!ErrCls) { ErrCls = Error; }
  return function fail() { throw new ErrCls(msg); };
}

ok(eq.err, makeFail('noez!'), true);
ok(eq.err, makeFail('noez!'), new Error('noez!'));
ok(eq.err, makeFail('noez!'), 'Error: noez!');
no(eq.err, makeFail('noez!'), 'noez!');
no(eq.err, makeFail('noez!'));
no(eq.err, makeFail('noez!'), '');
no(eq.err, makeFail('noez!'), undefined);
no(eq.err, makeFail('noez!'), null);
no(eq.err, makeFail('noez!'), false);
no(eq.err, makeFail('noez!'), [ [ true ] ]);


function makeReturn(val) {
  return function () { return val; };
}

ok(eq.err, makeReturn('hello'), { ret: 'hello' });
no(eq.err, makeReturn('hello'), true);
no(eq.err, makeReturn('hello'), new Error('hello'));
no(eq.err, makeReturn('hello'), 'Error: hello');
no(eq.err, makeReturn('hello'), 'hello');
no(eq.err, makeReturn('hello'));
no(eq.err, makeReturn('hello'), '');
no(eq.err, makeReturn('hello'), undefined);
no(eq.err, makeReturn('hello'), null);
no(eq.err, makeReturn('hello'), false);
no(eq.err, makeReturn('hello'), [ [ true ] ]);









console.log("+OK tests passed.");   //= "+OK tests passed."
