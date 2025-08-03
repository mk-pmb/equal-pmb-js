/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, assert = require('assert'), assErrCode = 'ERR_ASSERTION',
  assErrName = 'AssertionError', AssErr = assert[assErrName],
  dsEq = assert.deepStrictEqual,
  isError = require('is-error'),
  isAry = Array.isArray, arSlc = Array.prototype.slice,
  sortObj = require('deepsortobj'),
  toStr = require('safe-tostring-pmb'),
  inspect = require('util').inspect,
  univeil = require('univeil'),
  ersatzEllip = require('ersatz-ellip'),
  gdcDoubleRail = require('generic-diff-context/util/doubleRail'),
  genDiffCtx = require('generic-diff-context');
// try { re//quire('usnam-pmb'); } catch (ignore) {}

function isStr(x, no) { return (((typeof x) === 'string') || no); }
function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }
function ifNum(x, d) { return (x === +x ? x : d); }
function instanceof_safe(x, Cls) { return ifFun(Cls) && (x instanceof Cls); }
function orf(x) { return (x || false); }
function measure(x) { return (+(x || false).length || 0); }

function quotStr(s) { return univeil.jsonify(toStr(s)); } // ignore args 2..n
function buf2str(x) { return quotStr(x.toString('latin1')).slice(1, -1); }

function maxArgs(args, max) {
  if (args.length > max) { throw new Error('too many values'); }
}

function replacePrefix(s, p, w) {
  if (s.slice(0, p.length) === p) { return w + s.slice(p.length); }
  return s;
}


EX = function equal() { return EX.deepStrictEqual.apply(this, arguments); };


function nonStandardObviousEq(ex, ac) {
  if (Number.isNaN(ex)) {
    if (Number.isNaN(ac)) { return true; }
    throw new AssErr('Expected NaN but got: ' + toStr(ac));
  }
  return false;
}


EX.deepEq = EX.deepStrictEqual = function equal(ac, ex) {
  maxArgs(arguments, 2);
  if (nonStandardObviousEq(ex, ac)) { return true; }
  try {
    assert.deepStrictEqual(ex, ac);
  } catch (ass) {
    EX.throwDiff(ass, 'deepStrictEqual', ac, ex);
  }
  return true;
};


EX.eq = EX.strictEqual = function equal(ac, ex) {
  maxArgs(arguments, 2);
  if (nonStandardObviousEq(ex, ac)) { return true; }
  try {
    assert.strictEqual(ac, ex);
  } catch (ass) {
    EX.throwDiff(ass, '!==', ac, ex);
  }
  return true;
};


EX.examineThoroughly = function examineThoroughly(x) {
  x = inspect(sortObj(x), {
    breakLength: 3,
    colors: false,
    customInspect: false,
    depth: null,
    maxArrayLength: null,
  });
  x = x.replace(/(:) (\n)/g, '$1$2'); // node v6.10.0 inspect
  x = EX.fixCutoffColorCodes(x);
  return x;
};


EX.fixThrow = function fixThrow(x, ErrCls) {
  var e = x;
  if (!isError(e)) {
    if (!ErrCls) { ErrCls = TypeError; }
    return new ErrCls('thrown value was not an error: ' + toStr(e));
  }
  e = EX.fixAssErrName(e);
  return e;
};


EX.forceSetProp = function forceSetProp(o, k, v) {
  try { o[k] = v; } catch (ignore) {}
  if (o[k] === v) { return o; }
  o = Object.assign(Object.create(o), o);
  o[k] = v;
  if (o[k] === v) { return o; }
  v = 'Failed to assign property ' + k + ' even on newly created object!';
  throw new Error(v);
};


EX.fixAssErrName = function fixAssErrName(e) {
  var n = (e && isStr(e.name) && e.name);
  if (!n) { return e; }
  if (n.startsWith(assErrName + ' [')) {
    e = EX.forceSetProp(e, 'name', assErrName);
  }
  return e;
};


EX.refute = function refute(func, args, shallNotPass) {
  try {
    func.apply(null, args);
  } catch (caught) {
    return EX.verifyAssErr(caught);
  }
  throw new AssErr(shallNotPass || { message: 'E_UNEXPECTED' });
};


EX.verifyAssErr = function verifyAssErr(x) {
  var e = EX.fixThrow(x);
  if (e.name === assErrName) { return true; }
  if (e.code === assErrCode) { return true; }
  throw e;
};


EX.ne = EX.notDeepStrictEqual = function notDeepStrictEqual(ac, ex) {
  maxArgs(arguments, 2);
  return EX.refute(EX.deepStrictEqual, [ac, ex],
    { message: 'unexpected deep equality', actual: ac, expected: ex });
};


EX.nse = EX.notStrictEqual = function notStrictEqual(ac, ex) {
  maxArgs(arguments, 2);
  return EX.refute(EX.strictEqual, [ac, ex],
    { message: 'unexpected strict equality', actual: ac, expected: ex });
};


EX.err = EX.throws = function throwsException(func, wantErr) {
  var result, wasCaught = false;
  if (!ifFun(func)) {
    throw new TypeError('equal.err needs a function, not ' +
      EX.examineThoroughly(func));
  }
  maxArgs(arguments, 2);
  if (isError(wantErr)) { wantErr = EX.errToStr(wantErr); }
  try {
    result = { ret: func() };
    if (!wantErr) { return true; }
  } catch (funcErr) {
    result = funcErr;
    wasCaught = true;
  }
  if (wasCaught) {
    if (instanceof_safe(result, wantErr)) { return true; }
    if (isError(result)) {
      if (wantErr === true) { return true; }
      result = EX.tryBetterErrMsg(result);
    }
    if (!wantErr) { throw result; }
    if (wantErr instanceof RegExp) {
      if (wantErr.exec(EX.errToStr(result))) { return true; }
    }
    if (isStr(wantErr) || isAry(wantErr)) { result = EX.errToStr(result); }
  }
  try {
    return EX(result, wantErr);
  } catch (notSameErr) {
    if (wasCaught) {
      // optimize error message
      return EX.lines(result, wantErr);
    }
    throw notSameErr;
  }
  throw new Error('Unexpected control flow');
};


EX.errToStr = function errToStr(err) { return err.name + ': ' + err.message; };


// EX.ret = nope, just use EX.err(…, false).

function uniDiffMsg(ex, ac, opt) {
  try {
    var diff = genDiffCtx(ex, ac, opt), msg;
    msg = EX.ctrlCh((opt.diffToStr || String)(diff)
      ).replace(/(^|\n) /g, '$1='
      ).replace(/((?!\n)\s)\n/g, '$1¶\n'
      ).replace(/\n/g, '\n    ');
    return msg;
  } catch (diffErr) {
    if (diffErr && isStr(diffErr.message)) {
      diffErr.message = 'unable to diff: ' + diffErr.message;
    }
    throw diffErr;
  }
}


function type0f(x) {
  if (x === null) { return 'null'; }
  var t = typeof x;
  if (t !== 'object') { return t; }
  if (isAry(x)) { return 'array'; }
  if (Buffer.isBuffer(x)) { return 'buffer'; }
  return t;
}


EX.ctrlCh = function ctrlCh(s) {
  return toStr(s).replace(/\r/g, '\u219E\n').replace(/\t/g, '\u21B9');
};


function signed(x) {
  var s = String(x).replace(/^(\-?)Infinity$/, '$1∞');
  if (x < 0) { return s; }
  if (x > 0) { return '+' + s; }
  return '±' + s;
}

function numDiff(ac, ex) {
  var d = ac - ex, r = 'd=' + signed(d);
  if (Number.isFinite(d)) {
    r += ', ' + signed(Math.round(1e6 * d) / (1e4 * ex)) + '%';
  }
  return r;
}


function comparePrototypes(ac, ex) {
  var pac = Object.getPrototypeOf(ac), pex = Object.getPrototypeOf(ex);
  if (pac === pex) { return 'strictly equal'; }
  return 'different (' + toStr(pac) + ' vs. ' + toStr(pex) + ')';
}


EX.tryBetterDiff = function tryBetterDiff(oper, ac, ex) {
  var diffOpts, types = type0f(ac) + ':' + type0f(ex);
  switch (types) {
  case 'string:string':
    diffOpts = {
      unified: 64,
      diffToStr: function doubleRail(diff) {
        var report = gdcDoubleRail(diff, {
          quot: quotStr,
          oldRailAnnot: ' [' + measure(ex) + ']',
          newRailAnnot: ' [' + measure(ac) + ']',
        });
        report = ('Strings differ. Diff hunk length(s): ['
          + diff.map(measure).join(', ') + ']\n' + report);
        return report;
      },
    };
    break;
  case 'array:array':
    diffOpts = { unified: 2 };
    break;
  case 'number:number':
    return (oper + ': expected ' + ex + ' but got ' + ac +
      ' (' + numDiff(ac, ex) + ')');
  default:
    diffOpts = { unified: 0, finalLf: false };
    if (ac && ex) {
      diffOpts.ifSame = ('No visible difference in dump.'
        + ' Top-level prototypes are ' + comparePrototypes(ac, ex) + '.');
    }
    ac = EX.examineThoroughly(ac).split(/\n/);
    ex = EX.examineThoroughly(ex).split(/\n/);
    break;
  }
  if (diffOpts) {
    try {
      ac = (uniDiffMsg(ex, ac, diffOpts) || diffOpts.ifSame);
    } catch (cannotDiff) {
      return;
    }
    if (!ac) { return; }
    return (oper + ': ' + ac);
  }
  return;
};



EX.throwDiff = function throwDiff(origErr, op, ac, ex) {
  throw EX.tryBetterErrMsg(origErr, { msg: EX.tryBetterDiff(op, ac, ex) });
};



EX.fixCutoffColorCodes = function fixCutoffColorCodes(s) {
  if (s.indexOf('\x1B[') < 0) { return s; }
  // strip trailing incomplete color code
  s = s.replace(/\x1B(\[[ -@]*)$/, '^$1');
  // reset color code after message
  s += '\x1B[0m';
  return s;
};


EX.testNamesStack = [];
EX.tryBetterErrMsg = function tryBetterErrMsg(err, opt) {
  var where = '', msg, origMsg, stack, offset;
  err = EX.fixThrow(err);

  if (!err.testNamesStack) {
    where = EX.testNamesStack.map(quotStr).join('>');
    if (where) { where = '@' + where + ': '; }
    err = EX.forceSetProp(err, 'testNamesStack', EX.testNamesStack.concat());
  }
  opt = orf(opt);
  msg = opt.msg;

  origMsg = toStr(err.message || err);
  origMsg = EX.uncolorize(origMsg); /*
    Node.js v16 tries to colorize its diff when running in a terminal.
    This would introduce even more variability when testing for expected
    error messages, so we uncolor it. */
  if (!msg) {
    msg = replacePrefix(origMsg,
      assErrName + ' [' + assErrCode + ']', assErrName);
  }
  msg = where + (opt.head || '') + msg + (opt.tail || '');
  msg = EX.fixCutoffColorCodes(msg);
  err = EX.forceSetProp(err, 'message', msg);

  stack = EX.uncolorize(toStr(err.stack));
  stack = replacePrefix(stack,
    assErrName + ' [' + assErrCode + ']', assErrName);
  offset = stack.indexOf(origMsg);
  if (offset >= 0) {
    stack = stack.slice(0, offset) + msg + stack.slice(offset + origMsg.length);
  }
  err = EX.forceSetProp(err, 'stack', stack);
  return err;
};


EX.uncolorize = function uncolorize(t) {
  if (!t) { return t; }
  if (!isStr(t)) { return t; }
  t = t.replace(/\x1B\[[\d;]*m/g, '');
  return t;
};


EX.forceStringSplitLines = function forceStringSplitLines(x) {
  if (!x) { x = String(x); }
  if (x instanceof RegExp) { x = '[RegExp ' + x + ']'; }
  return String(x).split(/\n/);
};


EX.lines = function lines(ac, ex) {
  maxArgs(arguments, 2);
  ac = EX.forceStringSplitLines(ac);
  ex = EX.forceStringSplitLines(ex);
  return EX(ac, ex);
};


EX.chars = function chars(ac, ex) {
  maxArgs(arguments, 2);
  return EX(toStr(ac), toStr(ex));
};


EX.onExitCode = function onExitCode(ex, thenFunc, elseFunc) {
  process.once('exit', function (ac) {
    var hnd = (ac === ex ? thenFunc : elseFunc);
    if (!hnd) { return; }
    if (ifFun(hnd)) { return hnd(ac); }
    console.log(hnd);
  });
};


EX.lists = function cmpLists(ac, ex) {
  maxArgs(arguments, 2);
  ac = orf(ac);
  ex = orf(ex);
  //if (!isAry(ex)) { throw new TypeError('Expectation must be an Array'); }
  //if (!isAry(ac)) { EX('(¬Array) ' + ac, ex); }
  var nAc = ifNum(ac.length, 0), nEx = ifNum(ex.length, 0),
    nMin = Math.min(nAc, nEx), nSame = 0, ass = null,
    dulo = (+EX.lists.dumpLongerList || 0);
  try {
    for (0; nSame < nMin; nSame += 1) { EX(ac[nSame], ex[nSame]); }
    if ((nAc !== nEx) && dulo) {
      console.log(nAc, nEx, arSlc.call((nAc > nEx ? ac : ex),
        nMin, nMin + dulo));
    }
  } catch (ignore) {}
  try {
    return dsEq(arSlc.call(ac, nSame, nAc), arSlc.call(ex, nSame, nEx));
  } catch (err) {
    ass = err;
  }
  throw EX.tryBetterErrMsg(ass, { head: nSame + ' common items, then: ' });
};
EX.lists.dumpLongerList = 0;


EX.named = (function (popping, nt) {
  nt = popping(function (testFunc) { testFunc(); });
  Object.keys(EX).forEach(function (k, v) {
    if (k === 'named') { return; }
    v = EX[k];
    if (ifFun(v)) { nt[k] = popping(v); }
  });
  popping = null;
  nt.named = nt;
  return nt;
}(function popping(f) {
  return function namedTestProxy(name) {
    EX.testNamesStack.push(name);
    var args = arSlc.call(arguments, 1);
    try {
      f.apply(this, args);
    } catch (err) {
      EX.testNamesStack.pop();
      throw err;
    }
    EX.testNamesStack.pop();
  };
}));



EX.buf = function cmpBuffers(ac, ex, enc) {
  if (!Buffer.isBuffer(ac)) {
    throw new AssErr('Expected a buffer but got: ' + toStr(ac));
  }
  if (!Buffer.isBuffer(ex)) { ex = Buffer.from(ex, enc); }
  return EX(buf2str(ac), buf2str(ex));
};










module.exports = EX;
