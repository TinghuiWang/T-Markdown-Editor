"use strict";

var TMdEditor = require('./editor');

$.fn.tMdEditor_Init = function (...args) {
    var elements = this.get();
    for (var i = 0; i < elements.length; i++) {
        new TMdEditor(elements[i], {}, "");
    }
    return this;
};
