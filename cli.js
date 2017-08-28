#!/usr/bin/env node
'use strict';

const MYPAK_FOLDER = '.mypak';
const NODE_MODULES_FOLDER = 'node_modules';
const MYPAK_CONFIG = 'mypak.json';
const PACKAGE_JSON = 'package.json';
const PACKAGES_JSON = 'packages.json';
const CHANGE_LOG = 'changelog.md';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ih = require('install-here');
const _ = require('lodash');
const u = require('./util.js');
const rimraf = require('rimraf');
const info = require('./package.json');
var _cache = require('./'+PACKAGES_JSON)||{};
var argv = require('yargs').argv;



// errori
var _error = null;
// argomento d'uscita
var _exit = null;
// opzioni
var _options = {};
// root di esecuzione
var _root = process.cwd();
// package info root
var _package = null;
// scanning result
var _state = {};

var Package = function(name, info) {
  this._name = name;
  if (_.isObject(info))
    _.extend(this, info);
};
Package.prototype = {
  _name: '',
  // checkLocals: function() {
  //   var self = this;
  //   var versions = {};
  //   for(var v in self.versions) {
  //     versions[v] = {deps:[], locals:[]};
  //     var vinfo = self.versions[v]||{};
  //     if (_.isArray(vinfo.locals)) {
  //       vinfo.locals.forEach(function(p){
  //         if (fs.existsSync(p)) {
  //           var pkg = require(path.join(p, PACKAGE_JSON));
  //           if (pkg) {
  //             if (!_.isArray(locals[pkg.version]))
  //               locals[pkg.version] = [];
  //             locals[pkg.version].push(vpath);
  //           }
  //         }
  //       });
  //     }
  //   }
  //   self.versions = versions;
  // }
  check: function(v) {

  }
};


function _isExit() {
  return _exit||_error;
}

function _handleErr(cb) {
  return function(err) {
    if (err) _error = err;
    cb();
  }
}

function _log(m, m1) {
  if (_options.verbose||_options.debug) {
    console.log(m);
  } else if (m1) {
    console.log(m1);
  }
}

function _logi(m) {
  process.stdout.write(m);
}

function _updateCache(cb) {
  const data = JSON.stringifY(_packages, null, 2);
  const pkgfn = path.join('');
  fs.writeFile(pkgfn, data, function(err) {
    if (err) return _handleErr(cb)(err);
    cb();
  });
}





function _init(cb) {
  _options = {
    verbose: argv.verbose,
    debug: argv.d || argv.debug,
    test: argv.t || argv.test,
    help: !!argv.h || argv.help
  };
  _state = {};
  _error = null;
  cb();
}

function _checkOptions(cb) {
  _exit = ['%s v.%s\nsoon available...', info.name, info.version];
  return cb();


  // if (_options.help) {
  //   var help ='\tmypak [<package>] [<options>]\n\n'+
  //     '\t<package>\tpackage name (optional)\n'+
  //     '\t<options>\toptions (optional):\n'+
  //     '\t\t--version,-v:\tshows version\n'+
  //     '\t\t--verbose:\tshow the verbose log\n'+
  //     '\t\t--debug,-d:\tworks in debug mode\n'+
  //     '\t\t--help,-h:\tshows the help\n';
  //   _exit = ['%s v.%s\n%s', info.name, info.version, help];
  // } else if (_options.version) {
  //   var v = u.version(info.version);
  //   var rgx =  new RegExp('## '+v+'[\n]*([^#]*)', 'g');
  //   var logfile = path.join(__dirname, CHANGE_LOG);
  //   var log = (fs.existsSync(logfile)) ? fs.readFileSync(logfile) : '';
  //   var m = rgx.exec(log);
  //   var cnglog = _options.verbose ? log : (m?m[1]:'');
  //   _exit = ['%s v.%s \n\n%s', info.name, info.version, cnglog];
  // } else {
  //   console.log('%s v.%s', info.name, info.version);
  // }
  // cb();
}

function _handleCache(cb) {
  if (_isExit()) return cb();
  switch (_options.cache) {
    case 'build':
      break;
    case 'clean':
    case 'clear':
    case 'del':
    case 'delete':
      _cache = {};
      _updateCache();
      break;
  }
}

function _loadCache(cb) {
  if (_isExit()) return cb();
  _log(null, 'loading cache....');
  //packages = packages||{};
  //for(var p in packages) {
    //packages[p] = new Package(p, packages[p]);
  //}
  cb();
}

function _isCompatible(v, tv) {
  //TODO: restituisce true se la versione 'v' è compatibile con la 'tv' (target version)
  return true;
}

function _checkPackage(cb) {
  if (_isExit()) return cb();
  var pkgroot = path.join(_root, _options.target, PACKAGE_JSON);
  _package = (fs.existsSync(pkgroot)) ? require(pkgroot) : null;
  if (!_package) {
    _error = 'Packages info not found!';
  }
  if (_isExit()) return cb();
  if (_options.debug) _log(null, 'package: '+JSON.stringify(_package));
  cb();
}

function _getFromCache(dep, ver, cb) {
  var xdep = packages[dep];
  if (xdep) {
    var v = _.find(_.keys(xdep), function(v){
      return _isCompatible(v, ver);
    });
    if (v) {
      //TODO: aggiunge le dipendenze
      cb(xdep[v], v);
    }
  }
  cb();
}

function _parseDeps(deps) {
  // 1. enumera tutto l'albero delle dipendenze locale
  //  1.1 per ogni dipendenza segna le librerie già installate localmente (aggiornando la cache)
  //  1.2 per ogni dipendenza segna le librerie già presenti in cache
  //
  //
  // 2. copia le librerie mancanti ma presenti in cache (aggiorna la cache)
  // 3. installa le librerie mancanti non presenti in cache (aggiorna la cache)

  for(var d in deps){
    _getFromCache(d, deps[d], function(local){
      if (!local) {
        _state.install[d] = deps[d];
      } else {
        _state.copy[d] = local;
      }
    });
  }
}

function _parse(cb) {
  if (_isExit()) return cb();
  if (!_package.dependencies || !_.keys(_package.dependencies).length){
    _exit = 'No dependencies!'
  } else {
    _log(null, 'checking dependencies tree....');
    _parseDeps(_package.dependencies);
  }
  cb();
}




















u.compose()
  .use(_init)
  .use(_checkOptions)
  .use(_handleCache)
  .use(_loadCache)
  .use(_checkPackage)
  .use(_parse)
  //.use(_xxxxxxx)
  .run(function() {
    if (_exit) {
      console.log.apply(null, _exit);
    } else if (_error) {
      if (_.isString(_error)) {
        console.error('\tERROR: '+_error);
      } else {
        throw _error;
      }
    } else {
      console.log('Done');
    }
  });