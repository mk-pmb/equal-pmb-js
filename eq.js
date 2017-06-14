﻿/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

module.exports = (function setup() {
  var EX, assert = require('assert'), AssErr = assert.AssertionError,
    isError = require('is-error'),
    sortObj = require('deepsortobj'),
    inspect = require('util').inspect,
    genDiffCtx = require('generic-diff-context');
  // try { re//quire('usnam-pmb'); } catch (ignore) {}

  EX = function equal(ac, ex) {
    if (arguments.length > 2) { throw new Error('too many values'); }
    try {
      assert.deepStrictEqual(ac, ex);
    } catch (assErr) {
      EX.tryBetterErrMsg(assErr, EX.tryBetterDiff('deepStrictEqual', ac, ex));
      throw assErr;
    }
    return true;
  };

  EX.deepStrictEqual = function () { return EX.apply(this, arguments); };


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
    if (isError(x)) { return x; }
    if (!ErrCls) { ErrCls = TypeError; }
    return new ErrCls('thrown value was not an error: ' + String(x));
  };


  EX.refute = function (func, args, shallNotPass) {
    try {
      func.apply(null, args);
    } catch (caught) {
      shallNotPass = EX.fixThrow(caught);
      if (shallNotPass.name === 'AssertionError') { return true; }
      throw shallNotPass;
    }
    throw new AssErr(shallNotPass || { message: 'E_UNEXPECTED' });
  };


  EX.ne = EX.unequal = function unequal(ac, ex) {
    if (arguments.length > 2) { throw new Error('too many values'); }
    return EX.refute(EX, [ac, ex], { message: 'unexpected equality',
      actual: ac, expected: ex });
  };


  EX.err = function (func, wantErr) {
    if ((typeof func) !== 'function') { throw new TypeError('need function'); }
    if (arguments.length > 2) { throw new Error('too many values'); }
    var result, wasCaught = false;
    try {
      result = { ret: func() };
    } catch (funcErr) {
      result = funcErr;
      wasCaught = true;
    }
    if (wasCaught) {
      if ((typeof wantErr) === 'function') {
        if (result instanceof wantErr) { return true; }
      }
      if (isError(result)) {
        if (wantErr === true) { return true; }
      } else {
        result = EX.fixThrow(result);
      }
      if (wantErr === false) { throw result; }
      if ((typeof wantErr) === 'string') { result = String(result); }
    }
    if (wantErr === false) { return true; }
    try {
      return EX(result, wantErr);
    } catch (notSameErr) {
      if (wasCaught) {
        // optimize error message
        return EX.lines(String(result), String(wantErr));
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
      if (diffErr && (typeof diffErr.message === 'string')) {
        diffErr.message = 'unable to diff: ' + diffErr.message;
      }
      throw diffErr;
    }
  }


  function type0f(x) {
    if (x === null) { return 'null'; }
    var t = typeof x;
    if (t !== 'object') { return t; }
    if (Array.isArray(x)) { return 'array'; }
    if (Buffer.isBuffer(x)) { return 'buffer'; }
    return t;
  }


  EX.ctrlCh = function (s) {
    return String(s).replace(/\r/g, '\u219E\n').replace(/\t/g, '\u21B9');
  };


  EX.tryBetterDiff = function (oper, ac, ex) {
    var diffOpts, types = type0f(ac) + ':' + type0f(ex);
    switch (types) {
    case 'string:string':
      diffOpts = { unified: 64 };
      break;
    case 'array:array':
      diffOpts = { unified: 2 };
      break;
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


  EX.tryBetterErrMsg = function (err, msg) {
    if (!msg) { msg = String(err.message || err); }
    msg = EX.fixCutoffColorCodes(msg);
    err.message = msg;
    return err;
  };


  EX.lines = function equal(ac, ex) {
    if (arguments.length > 2) { throw new Error('too many values'); }
    if (ac.split) { ac = ac.split(/\n/); }
    if (ex.split) { ex = ex.split(/\n/); }
    return EX(ac, ex);
  };


  EX.chars = function equal(ac, ex) {
    if (arguments.length > 2) { throw new Error('too many values'); }
    return EX(String(ac), String(ex));
  };















  return EX;
}());
