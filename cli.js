#!/usr/bin/env node
'use strict';

const u = require('install-here/util');
const ih = require('install-here/core');
const mp = require('./core.js');
const a = require('yargs').argv;

u.compose()
  .use(mp.init(a, ih))
  .use(mp.checkMyPak)
  .use(mp.checkOptions)
  .use(mp.checkPackage)
  .use(ih.retrievePackageVersion)
  .use(ih.checkVersion)
  .use(ih.checkTest)
  .use(ih.deleteTempPath)
  .use(ih.createTempPath)
  .use(mp.execPre(ih))
  .use(ih.install)
  .use(mp.checkInfo)
  .use(mp.checkPak)
  .use(mp.checkPackageJson)
  .use(ih.delete)
  .use(ih.replace)
  .use(ih.replaceDep)
  .use(ih.deleteTempPath)
  .use(ih.checkGitIgnore)
  .use(ih.saveSettings)
  .use(mp.execPost(ih))
  .run(ih.report);


// mypack                                 >>>     aggiorna il package
// mypack mpk-sections-site --name rds    >>>     installa il package con il nome