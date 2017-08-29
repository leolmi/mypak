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
  .use(ih.execPre)
  .use(ih.install)
  .use(ih.delete)
  .use(ih.replace)
  .use(ih.replaceDep)
  .use(ih.deleteTempPath)
  .use(ih.saveSettings)
  .use(ih.execPost)
  .run(ih.report);



// mypack                                 >>>     aggiorna il package

// mypack mpk-sections-site --name rds    >>>     installa il package con il nome