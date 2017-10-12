/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function ifObj(x, d) { return ((x && typeof x) === 'object' ? x : d); }

var EX = { accum: {} }, eq = require('../'),
  goak = require('getoraddkey-simple'),
  arSlc = Array.prototype.slice;


EX.had = function (expected) {
  eq.named.deepStrictEqual('side effects', EX.accum, expected);
  EX.accum = {};
};

EX.none = function () { EX.had({}); };


EX.args = function (name, ret) {
  name = String(name);
  return function () {
    EX.accum[name] = arSlc.call(arguments);
    return ret;
  };
};


EX.push = function (name, ret) {
  name = String(name);
  return function () {
    goak.pushToKey(EX.accum, name, arSlc.call(arguments));
    return ret;
  };
};


EX.proxy = function (name, func) {
  if (!func) {
    func = name;
    name = String(func.name);
  }
  return function () {
    var args = arSlc.call(arguments), report = { args: args }, val, err;
    try {
      val = func.apply(this, args);
      report.result = val;
    } catch (caught) {
      err = (caught || new Error('false-y value thrown: ' + String(caught)));
      report.err = String(err);
    }
    goak.pushToKey(EX.accum, name, report);
    if (err) { throw err; }
    return val;
  };
};


EX.add = function (name, add, start) {
  name = String(name);
  var val = EX.accum[name];
  val = (val === undefined
    ? (start === undefined ? 1 : start)
    : val + (add === undefined ? 1 : add));
  EX.accum[name] = val;
  return val;
};










module.exports = EX;
