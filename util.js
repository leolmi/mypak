'use strict';
const _ = require('lodash');
const path = require('path');

exports.isFile = function(f, ext) {
  ext = (ext || '').trim();
  if (!_.startsWith(ext, '.')) ext = '.' + type;
  return path.extname(f) == ext;
};
const _signs = {
  JS_USE_FILE: '// MYPAK',
  HTML_USE_FILE: '<!-- MYPAK',
  CSS_USE_FILE: '/* MYPAK'
};

// base controls
const base = {
  js: function (data, state, exists) {
    return (!exists || (data||'').indexOf(_signs.JS_USE_FILE) > -1) ? data : null;
  },
  html: function (data, state, exists) {
    return (!exists || (data||'').indexOf(_signs.HTML_USE_FILE) > -1) ? data : null;
  },
  css: function (data, state, exists) {
    return (!exists || (data||'').indexOf(_signs.CSS_USE_FILE) > -1) ? data : null;
  },
  scss: function (data, state, exists) {
    return (!exists || (data||'').indexOf(_signs.CSS_USE_FILE) > -1) ? data : null;
  }
};

// angular v.1 controls
const angular1 = {
  js: function (data, state, exists) {
    if (!data) return;
    if (state.ih.settings.appname) {
      data = data.replace(/angular.module\(['"].*['"]/gi, 'angular.module(\'' + state.ih.settings.appname + '\'');
    }
    return data;
  },
  html: function (data, state, exists) {
    if (!data) return;
    if (state.ih.settings.appname) {
      data = data.replace(/ng-app=".*"/gi, 'ng-app="' + state.ih.settings.appname + '"');
    }
    return data;
  }
};

exports.replacers = {
  base: base,
  angular1: angular1
};