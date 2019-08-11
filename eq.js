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
  genDiffCtx = require('generic-diff-context');
// try { re//quire('usnam-pmb'); } catch (ignore) {}

function isStr(x, no) { return (((typeof x) === 'string') || no); }
function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }
function ifNum(x, d) { return (x === +x ? x : d); }
function instanceof_safe(x, Cls) { return ifFun(Cls) && (x instanceof Cls); }
function orf(x) { return (x || false); }

function buf2str(x) {
  return univeil.jsonify(x.toString('latin1')).slice(1, -1);
}

function maxArgs(args, max) {
  if (args.length > max) { throw new Error('too many values'); }
}


EX = function equal() { return EX.deepStrictEqual.apply(this, arguments); };


function nonStandardObviousEq(ac, ex) {
  if (Number.isNaN(ex)) {
    if (Number.isNaN(ac)) { return true; }
    throw new AssErr('Expected NaN but got: ' + toStr(ac));
  }
  return false;
}


EX.deepEq = EX.deepStrictEqual = function equal(ac, ex) {
  maxArgs(arguments, 2);
  if (nonStandardObviousEq(ac, ex)) { return true; }
  try {
    assert.deepStrictEqual(ac, ex);
  } catch (ass) {
    EX.tryBetterErrMsg(ass, { msg:
      EX.tryBetterDiff('deepStrictEqual', ac, ex) });
    throw ass;
  }
  return true;
};


EX.eq = EX.strictEqual = function equal(ac, ex) {
  maxArgs(arguments, 2);
  if (nonStandardObviousEq(ac, ex)) { return true; }
  try {
    assert.strictEqual(ac, ex);
  } catch (ass) {
    EX.tryBetterErrMsg(ass, { msg:
      EX.tryBetterDiff('!==', ac, ex) });
    throw ass;
  }
  return true;
};


EX.examineThoroughly = function (x) {
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


EX.fixThrow = function (x, ErrCls) {
  if (isError(x)) {
    EX.fixAssErrNameInplace(x);
    return x;
  }
  if (!ErrCls) { ErrCls = TypeError; }
  return new ErrCls('thrown value was not an error: ' + toStr(x));
};


EX.refute = function (func, args, shallNotPass) {
  try {
    func.apply(null, args);
  } catch (caught) {
    return EX.verifyAssErr(caught);
  }
  throw new AssErr(shallNotPass || { message: 'E_UNEXPECTED' });
};


EX.fixAssErrNameInplace = function (x) {
  var n = (x && isStr(x.name) && x.name);
  if (!n) { return x; }
  if (n.startsWith(assErrName + ' [')) { x.name = assErrName; }
  return x;
};


EX.verifyAssErr = function (x) {
  var e = EX.fixThrow(x);
  EX.fixAssErrNameInplace(e);
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


EX.err = function (func, wantErr) {
  if (!ifFun(func)) {
    throw new TypeError('equal.err needs a function, not ' +
      EX.examineThoroughly(func));
  }
  maxArgs(arguments, 2);
  var result, wasCaught = false;
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
    } else {
      result = EX.fixThrow(result);
    }
    if (!wantErr) { throw result; }
    if (wantErr instanceof RegExp) {
      if (wantErr.exec(String(result))) { return true; }
    }
    if (isStr(wantErr)) { result = String(result); }
  }
  try {
    return EX(result, wantErr);
  } catch (notSameErr) {
    if (wasCaught) {
      // optimize error message
      return EX.lines(toStr(result), toStr(wantErr));
    }
    throw notSameErr;
  }
  throw new Error('Unexpected control flow');
};


// EX.ret = nope, just use EX.err(…, false).

function strDiffMsg(ex, ac, opts) {
  try {
    return EX.ctrlCh(genDiffCtx(ex, ac, opts)
      ).replace(/(^|\n) /g, '$1='
      ).replace(/((?!\n)\s)\n/g, '$1¶\n'
      ).replace(/\n/g, '\n    ');
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


EX.ctrlCh = function (s) {
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


EX.tryBetterDiff = function (oper, ac, ex) {
  var diffOpts, types = type0f(ac) + ':' + type0f(ex);
  switch (types) {
  case 'string:string':
    diffOpts = { unified: 64 };
    break;
  case 'array:array':
    diffOpts = { unified: 2 };
    break;
  case 'number:number':
    return (oper + ': expected ' + ex + ' but got ' + ac +
      ' (' + numDiff(ac, ex) + ')');
  default:
    ac = EX.examineThoroughly(ac).split(/\n/);
    ex = EX.examineThoroughly(ex).split(/\n/);
    diffOpts = { unified: 0, finalLf: false,
      ifSame: 'No visible difference in dump. Maybe a prototype mismatch?'
      };
    break;
  }
  if (diffOpts) {
    try {
      ac = (strDiffMsg(ex, ac, diffOpts) || diffOpts.ifSame);
    } catch (cannotDiff) {
      return;
    }
    if (!ac) { return; }
    return (oper + ': ' + ac);
  }
  return;
};


EX.fixCutoffColorCodes = function (s) {
  if (s.indexOf('\x1B[') < 0) { return s; }
  // strip trailing incomplete color code
  s = s.replace(/\x1B(\[[ -@]*)$/, '^$1');
  // reset color code after message
  s += '\x1B[0m';
  return s;
};


EX.testNamesStack = [];
EX.tryBetterErrMsg = function (err, opt) {
  EX.fixAssErrNameInplace(err);
  var msg = toStr(opt.msg || err.message || err),
    where = EX.testNamesStack.map(JSON.stringify).join('>');
  msg = (opt.head || '') + msg + (opt.tail || '');
  msg = EX.fixCutoffColorCodes(msg);
  if (where) { msg = '@' + where + ': ' + msg; }
  err.message = msg;
  return err;
};


EX.lines = function (ac, ex) {
  maxArgs(arguments, 2);
  if (ac.split) { ac = ac.split(/\n/); }
  if (ex.split) { ex = ex.split(/\n/); }
  return EX(ac, ex);
};


EX.chars = function (ac, ex) {
  maxArgs(arguments, 2);
  return EX(toStr(ac), toStr(ex));
};


EX.onExitCode = function (ex, thenFunc, elseFunc) {
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
  EX.tryBetterErrMsg(ass, { head: nSame + ' common items, then: ' });
  throw ass;
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
