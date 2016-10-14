/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var eq = require('equal-pmb'), ne = eq.ne, assert = require('assert');

function fails(func, a, b) { assert.throws(func.bind(null, a, b)); }


eq(true, true);
fails(eq, true, false);
fails(eq, true, 1);

fails(ne, true, true);
ne(true, false);
ne(true, 1);

assert.throws(function () { eq(true, true, false); }, /too many values/);

eq([ [ true ] ], [ [ true ] ]);
fails(eq, [ [ true ] ], [ [ false ] ]);
fails(eq, [ [ true ] ], [ [ 1 ] ]);


function makeFail(msg, ErrCls) {
  if (!ErrCls) { ErrCls = Error; }
  return function fail() { throw new ErrCls(msg); };
}

eq.err(makeFail('noez!'), true);
eq.err(makeFail('noez!'), new Error('noez!'));
eq.err(makeFail('noez!'), 'Error: noez!');
fails(eq.err, makeFail('noez!'), 'noez!');
fails(eq.err, makeFail('noez!'));
fails(eq.err, makeFail('noez!'), '');
fails(eq.err, makeFail('noez!'), undefined);
fails(eq.err, makeFail('noez!'), null);
fails(eq.err, makeFail('noez!'), false);
fails(eq.err, makeFail('noez!'), [ [ true ] ]);


function makeReturn(val) {
  return function () { return val; };
}

eq.err(makeReturn('hello'), { ret: 'hello' });
fails(eq.err, makeReturn('hello'), true);
fails(eq.err, makeReturn('hello'), new Error('hello'));
fails(eq.err, makeReturn('hello'), 'Error: hello');
fails(eq.err, makeReturn('hello'), 'hello');
fails(eq.err, makeReturn('hello'));
fails(eq.err, makeReturn('hello'), '');
fails(eq.err, makeReturn('hello'), undefined);
fails(eq.err, makeReturn('hello'), null);
eq.err(makeReturn('hello'), false);
eq.err(makeReturn(false), { ret: false });
fails(eq.err, makeReturn('hello'), { ret: false });
fails(eq.err, makeReturn('hello'), [ [ true ] ]);









console.log("+OK tests passed.");   //= "+OK tests passed."
