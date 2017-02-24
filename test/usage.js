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


(function compareTexts() {
  function cmp() { eq[cmp.mode](cmp.modif, cmp.orig); }
  function par2nl(s) { return s.replace(/¶/g, '\n'); }
  var tx = "hello¶  world¶  how  ¶\tdo you¶do?";

  cmp.orig = par2nl(tx);
  cmp.modif = cmp.orig;
  cmp.mode = 'lines';
  cmp();
  cmp.mode = 'chars';
  cmp();

  cmp.modif += '\n';
  cmp.mode = 'lines';
  eq.err(cmp, [ "AssertionError: deepStrictEqual: @@ -3,3 +3,3 @@",
    "=  how  ¶",  // eq adds ¶ to show you the line ends with whitespace
    "=\u21B9do you",  // eq replaces \t with two bar arrows so you see it
    "-do?",
    "\\ ¬¶",
    "+do?",
    ].join('\n    '));
  cmp.mode = 'chars';
  eq.err(cmp, [ "AssertionError: deepStrictEqual: @@ -1,33 +1,33 @@",
    "=hello",
    "^  world",
    "^  how  ¶",
    "^\u21B9do you",
    "^do",
    "-?",
    "\\ ¬¶",
    "+?",
    ].join('\n    '));


  cmp.orig = cmp.modif = '';
  cmp.mode = 'lines';
  cmp();
  cmp.mode = 'chars';
  cmp();

  cmp.modif = 'Hello World';
  cmp.mode = 'lines';
  eq.err(cmp, [ "AssertionError: deepStrictEqual: @@ -1,0 +1 @@",
    "+Hello World",
    "\\ ¬¶",
    ].join('\n    '));
  cmp.mode = 'chars';
  eq.err(cmp, [ "AssertionError: deepStrictEqual: @@ -1,0 +1,11 @@",
    "+Hello World",
    "\\ ¬¶",
    ].join('\n    '));

}());


(function compareObjects() {
  function cmp() { eq(cmp.modif, cmp.orig); }
  function deepCopy(x) { return JSON.parse(JSON.stringify(x)); }

  cmp.orig = { a: 'B', A: 'z',
            yn: { y: true, n: false },
            say: { hi: 'hello', cu: 'goodbye' },
            nums: [ 0, 1, 2, 3, 4 ],
            };
  cmp.modif = deepCopy(cmp.orig);
  cmp();

  cmp.modif = deepCopy(cmp.orig);
  cmp.modif.yn = Object.assign({}, cmp.orig.yn);
  cmp();

  cmp.modif = deepCopy(cmp.orig);
  cmp.modif.yn = Object.assign(Object.create(null), cmp.orig.yn);
  eq.err(cmp, 'AssertionError: deepStrictEqual:' +
    ' No visible difference in dump.' +
    ' Maybe a prototype mismatch?');

  cmp.modif.yn['?'] = 'dunno';
  cmp.modif.say.cu = 'farewell';
  cmp.modif.nums.push(Number.POSITIVE_INFINITY);
  eq.err(cmp, [ "AssertionError: deepStrictEqual: @@ -8 +8,2 @@",
    "-     4 ],",
    "+     4,",
    "+     Infinity ],",
    "@@ -10 +11 @@",
    "-   { cu: 'goodbye',",
    "+   { cu: 'farewell',",
    "@@ -13 +14,2 @@",
    "-   { n: false,",
    "+   { '?': 'dunno',",
    "+     n: false,",

    ].join('\n    '));



}());










/*scroll*/
