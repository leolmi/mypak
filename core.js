'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const u = require('./util.js');
const ihu = require('install-here');
const info = require('./package.json');

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

// gestisce le modifiche al package.json
function _managePkg(xdata, ndata) {
  try {
    var xpkg = JSON.parse(xdata);
    var npkg = JSON.parse(ndata);
    ihu.managePkg(npkg, xpkg);
    // aggiorna i dati dei settings
    _state.ih.settings.version = npkg.version;
    _state.ih.settings.name = npkg.name;
    xdata = JSON.stringify(xpkg, null, 2);
  } catch(err){
    console.error(err);
  }

  return xdata;
}

function _manageFile(data, file) {
  const type = path.extname(file||'').slice(1).toLowerCase();
  const types = (_state.ih.settings.types||'').split(',');
  _.keys(u.replacers, function(k) {
    if ((!types.length || types.indexOf(k)>-1) && _.isFunction(u.replacers[k][type]))
      data = u.replacers[k][type](data, _state);
  });
  return data;
}

exports.init = function(a, ih) {
  return function(cb) {
    _state.ih = ih.state;
    _state.ih.config = _constants.MYPAK_CONFIG;
    _state.ih.managePkg = _managePkg;
    _state.ih.manageFile = _manageFile;
    ih.init(a)();
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

  if (!_state.ih.package.name) {
    // se non viene passato il nome esplicitamente e non è una patch
    // si aspetta di aggiornare il package esistente
    if (!_state.ih.options.patch && pak) {
      _state.ih.package.name = pak.name;
      _state.ih.package.xversion = ihu.version(pak.version);
    }
  } else if (pak && !_state.options.patch) {
    // se il nome del package è stato passato ed esiste già una definizione e non è una patch
    if (pak.name == _state.ih.package.name) {
      //recupera la versione corrente
      _state.ih.package.xversion = u.version(pak.version);
    } else {
      _state.ih.error = 'Other package not allowed (current: "' + pak.name +
        '")\n\tuse --patch option to merging with other package!';
    }
  } else if (!pak && _state.options.patch) {
    // se non esiste definizione ed è una patch
    _state.ih.error = 'Nothing to patch!\n\tinstall base package before.';
  }
  if (_state.ih.isExit()) return cb();

  if (!_state.ih.package.name) {
    _state.ih.error = 'Undefined package!\n\tuse: ' + info.name + ' <package> [<options>]';
  } else {
    _state.ih.relpath = path.join(ihu.constants.INSTALL_HERE_FOLDER, ihu.constants.NODE_MODULES_FOLDER, _state.ih.package.name);
  }
  if (_state.ih.options.debug) ihu.log(null, 'package: ' + JSON.stringify(_state.ih.package));
  cb();
};
