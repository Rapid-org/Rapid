/* eslint-disable */
;(function(root, factory) {
  if (typeof define === 'function' && define.amd) { // AMD
    define(['./core', './java_compressed.js'], factory);
  } else if (typeof exports === 'object') { // Node.js
    module.exports = factory(require('./core'), require('./java_compressed.js'));
  } else { // Browser
    root.BlocklyJava = factory(root.Blockly, root.BlocklyJava);
  }
}(this, function(Blockly, BlocklyJava) {
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript Generator module.
 */

/* eslint-disable */
'use strict';

Blockly.Java = BlocklyJava;

return BlocklyJava;
})); 
