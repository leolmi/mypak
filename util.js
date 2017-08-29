'use strict';
const _ = require('lodash');
const path = require('path');

exports.isFile = function(f, ext) {
  ext = (ext || '').trim();
  if (!_.startsWith(ext, '.')) ext = '.' + type;
  return path.extname(f) == ext;
};


const angular1 = {
  js: function(data, state) {
    if (state.ih.settings.appname) {
      data = data.replace(/angular.module\(['"].*['"]/gi, 'angular.module(\'' + state.ih.settings.appname + '\'');
    }
    return data;
  },
  html: function(data, state) {
    if (state.ih.settings.appname) {
      data = data.replace(/ng-app=".*"/gi, 'ng-app="' + state.ih.settings.appname + '"');
    }
    return data;
  }
};

exports.replacers = {
  angular1: angular1
};