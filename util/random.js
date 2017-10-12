/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, arSlc = Array.prototype.slice;


EX = function makeRandomInst(opt) {
  var rnd = Object.assign({ history: [] }, opt);

  function emitEv(evName) {
    var evHnd = rnd['on' + evName];
    if (!evHnd) { return; }
    return evHnd(arSlc.call(arguments, 1));
  }

  function coreRand() {
    emitEv('Rand');
    return Math.random();
  }

  function arrLast(a, n) { return a[a.length - (+n || 1)]; }
  rnd.prev = function (n) { return arrLast(rnd.history, n); };

  rnd.real = function (min, max, ensureFrac) {
    var d = max - min, n = coreRand() * d;
    if (ensureFrac && ((n % 1) === 0)) {
      n += ensureFrac;
      if (n > d) { n -= d; }
    }
    if (min) { n += min; }
    rnd.history.push(n);
    return n;
  };

  rnd.integer = function (min, max) {
    var d = max - min, n = Math.round(coreRand() * d);
    if (min) { n += min; }
    rnd.history.push(n);
    return n;
  };








  return rnd;
};


module.exports = EX;
