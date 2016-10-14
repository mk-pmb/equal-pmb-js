/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

module.exports = (function setup() {
  var EX, assert = require('assert'), isError = require('is-error');
  // try { require('usnam-pmb'); } catch (ignore) {}

  EX = function (a, b) {
    assert.deepStrictEqual(a, b);
    return true;
  };

  EX.err = function (func, wantErr) {
    if ((typeof func) !== 'function') { throw new TypeError('need function'); }
    var result, wasCaught = false;
    try {
      result = { ret: func() };
    } catch (funcErr) {
      result = funcErr;
      wasCaught = true;
    }
    if (wasCaught) {
      if (isError(result)) {
        if (wantErr === true) { return true; }
      } else {
        result = new TypeError('thrown values was not an error: ' + result);
      }
      if (wantErr === false) { throw result; }
      if ((typeof wantErr) === 'string') { result = String(result); }
    }
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



  return EX;
}());
