'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const u = require('./util.js');
const info = require('./package.json');
const ihc = require('install-here/core');
const ihu = require('install-here/util');


const _constants = {
  MYPAK_CONFIG: info.name+'.json'
};


const _state = {
  ih: {},
  _exit: function() {
    return this.exit||this.ih.exit;
  },
  _error: function() {
    return this.error||this.ih.error;
  }
};

function _log() {
  if (_state.ih.options.verbose||_state.ih.options.debug) {
    const args = Array.prototype.slice.call(arguments);
    console.log.apply(null, args);
  }
}

// gestisce le modifiche al package.json
function _managePkg(xdata, ndata) {
  try {
    var xpkg = JSON.parse(xdata);
    var npkg = JSON.parse(ndata);
    ihc.managePkg(npkg, xpkg);
    xdata = JSON.stringify(xpkg, null, 2);
  } catch(err){
    console.error(err);
  }
  return xdata;
}

function _manageFile(data, file, exists) {
  const type = path.extname(file||'').slice(1).toLowerCase();
  const types = (_state.ih.settings.types||'').split(',')||[];
  types.unshift('base');
  _.keys(u.replacers).forEach(function(k) {
    if (types.indexOf(k) > -1 && _.isFunction(u.replacers[k][type]) && data && _.isFunction(data.toString)) {
      data = u.replacers[k][type](data.toString(), _state, exists);
    } else if (exists) {
      data = null;
    }
  });
  return data;
}

exports.init = function(a, ih) {
  return function(cb) {
    _state.ih = ih.state;
    _state.ih.config = _constants.MYPAK_CONFIG;
    ih.init(a)();
    ih.state.managePkg = _managePkg;
    ih.state.manageFile = _manageFile;
    _state.ih.options.info = !!(a.i||a.info);
    _state.ih.options.pack = true;
    _state.ih.options.forceSts = true;
    _state.ih.settings.appname = _state.ih.settings.appname||a.n||a.name||a.appname||a.ngname;
    cb();
  }
};

exports.checkMyPak = function(cb) {
  //TODO: check the mypak available new versions
  cb();
};

exports.checkOptions = function(cb) {
  if (_state.ih.options.help) {
    var help ='\t'+info.name+' [<package>] [<options>]\n\n'+
      '\t<package>\tpackage name (optional)\n'+
      '\t<options>\toptions (optional):\n'+
      '\t\t--name,-n:\tapp name\n'+
      '\t\t--version,-v:\tshows version\n'+
      '\t\t--verhist,-vh:\tshows version history\n'+
      '\t\t--force,-f:\tforce update\n'+
      '\t\t--verbose:\tshow the verbose log\n'+
      '\t\t--debug,-d:\tworks in debug mode\n'+
      '\t\t--patch,-p:\tinstall in patch mode\n'+
      '\t\t--skipkg:\tskip package.json check\n'+
      '\t\t--help,-h:\tshows the help\n';
    _state.ih.exit = ['%s v.%s\n%s', info.name, info.version, help];
  } else if (_state.ih.options.version) {
    var v = ihu.version(info.version);
    var rgx =  new RegExp('## '+v+'[\n]*([^#]*)', 'g');
    var logfile = path.join(__dirname, CHANGE_LOG);
    var log = (fs.existsSync(logfile)) ? fs.readFileSync(logfile) : '';
    var m = rgx.exec(log);
    var cnglog = _state.ih.options.verbose ? log : (m?m[1]:'');
    _state.ih.exit = ['%s v.%s \n\n%s', info.name, info.version, cnglog];
  } else if (_state.ih.options.history) {
    var histfile = path.join(__dirname, CHANGE_LOG);
    var hist = (fs.existsSync(histfile)) ? fs.readFileSync(histfile) : '';
    _state.ih.exit = ['%s version history:\n', info.name, hist.toString()];
  } else {
    console.log('%s v.%s', info.name, info.version);
  }
  cb();
};

// check the package name
exports.checkPackage = function(cb) {
  if (_state.ih.isExit()) return cb();
  var pakroot = path.join(_state.ih.root, _constants.MYPAK_CONFIG);
  var pak = (fs.existsSync(pakroot)) ? require(pakroot) : null;
  _state.ih.options.skipXPost = !pak;

  if (!_state.ih.package.name) {
    // se non viene passato il nome esplicitamente e non è una patch
    // si aspetta di aggiornare il package esistente
    if (!_state.ih.options.patch && pak) {
      _state.ih.package.name = pak.name;
      _state.ih.package.xversion = ihu.version(pak.version);
    }
  } else if (pak && !_state.ih.options.patch) {
    // se il nome del package è stato passato ed esiste già una definizione e non è una patch
    if (pak.name == _state.ih.package.name) {
      //recupera la versione corrente
      _state.ih.package.xversion = ihu.version(pak.version);
    } else {
      _state.ih.error = 'Other package not allowed (current: "' + pak.name +
        '")\n\tuse --patch option to merging with other package!';
    }
  } else if (!pak && _state.ih.options.patch) {
    // se non esiste definizione ed è una patch
    _state.ih.error = 'Nothing to patch!\n\tinstall base package before.';
  }
  if (_state.ih.isExit()) return cb();

  if (!_state.ih.package.name) {
    _state.ih.error = 'Undefined package!\n\tuse: ' + info.name + ' <package> [<options>]';
  } else {
    _state.ih.relpath = path.join(ihc.constants.INSTALL_HERE_FOLDER, ihc.constants.NODE_MODULES_FOLDER, _state.ih.package.name);
  }
  _log('package: %s', JSON.stringify(_state.ih.package));
  cb();
};

exports.execPre = function(ih) {
  return function(cb) {
    if (_state.ih.options.info) return cb();
    ih.execPre(cb);
  }
};

exports.checkInfo = function(cb) {
  if (_state.ih.isExit()) return cb();
  const fn_config = path.join(_state.ih.temp, _state.ih.package.name, _constants.MYPAK_CONFIG);
  if (fs.existsSync(fn_config)) _state.pak = require(fn_config);

  if (_state.ih.options.info) {
    var info = '';
    const fn_config = path.join(_state.ih.temp, _state.ih.package.name, _constants.MYPAK_CONFIG);
    if (_state.pak) {
      info += (_state.pak.desc||'')+'\n'+JSON.stringify(_state.pak.types|[]);
    } else {
      info += 'Cannot retrieve mypak infos';
    }
    const fn_package = path.join(_state.ih.temp, _state.ih.package.name, ihc.constants.PACKAGE_CONFIG);
    if (_state.ih.options.verbose && fs.existsSync(fn_package)) {
      const pkg_json = require(fn_package);
      info += '\n'+JSON.stringify(pkg_json, null, 2);
    }
    _state.ih.exit = ['%s v.%s \n\n%s', _state.ih.package.name, _state.ih.package.version, info];
  }
  cb();
};

exports.checkPak = function(cb) {
  if (_state.ih.isExit()) return cb();
  if (_state.pak) {
    ihc.constants.GIT_IGNORE = _state.pak.gitignore || ihc.constants.GIT_IGNORE;
    if (!_state.ih.settings.name)
      _.extend(_state.ih.settings, _state.pak);
  }
  cb();
};

exports.checkPackageJson = function(cb) {
  if (_state.ih.isExit()) return cb();

  const fn_package = path.join(_state.ih.temp, _state.ih.package.name, ihc.constants.PACKAGE_CONFIG);
  if (fs.existsSync(fn_package)) _state.pkg = require(fn_package);
  // aggiorna i dati dei settings
  if (_state.pkg) {
    _state.ih.settings.version = _state.pkg.version;
    _state.ih.settings.name = _state.pkg.name;
    _log('SETTINGS: %s', JSON.stringify(_state.ih.settings, null, 2));
  }
  cb();
};

exports.execPost = function(ih) {
  return function (cb) {
    if (!!_state.ih.options.skipXPost) return cb();
    ih.execPost(cb);
  }
};