/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

module.exports = (function setup() {
  var EX, assert = require('assert'), AssErr = assert.AssertionError,
    isError = require('is-error');
  // try { require('usnam-pmb'); } catch (ignore) {}

  EX = function equal(ac, ex) {
    if (arguments.length > 2) { throw new Error('too many values'); }
    assert.deepStrictEqual(ac, ex);
    return true;
  };


  EX.fixThrow = function (x, ErrCls) {
    if (isError(x)) { return x; }
    if (x instanceof Error) {
      return x;     // https://github.com/Raynos/is-error/issues/4
    }
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
        return EX(String(result), wantErr);
      }
      throw notSameErr;
    }
    throw new Error('Unexpected control flow');
  };


  // EX.ret = nope, just use EX.err(…, false).








  return EX;
}());
