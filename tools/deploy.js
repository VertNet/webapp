#!/usr/bin/env node

var sys = require('sys');
var fs = require('fs');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var log = require('console').log;
var util = require('util'), error = util.error,
    debug = util.debug, inspect = util.inspect;
var Step = require('step');
var _ = require('underscore');
_.mixin(require('underscore.string'));
var wrench = require('wrench');
var request = require('request');
var clc = require('cli-color');
var argv = require('optimist')
    .usage('Build and deploy app.\nUsage: $0')
    .default('h', 'vertnet-dev.appspot.com')
    .alias('h', 'host')
    .describe('h', 'App host')
    .alias('v', 'major_version')
    .describe('v', 'App major version number')
    .argv;

if (argv._.length === 0) {
  log(clc.red('Error: Expected a <app_directory> argument.'));
  process.exit(1);
}

var rel = argv._[0];
if (!_.endsWith(rel, '/'))
  rel += '/';
if (argv.v)
  argv.v = parseInt(argv.v);

function puts(err, stdout, stderr) {
  sys.puts(stdout);
}

function check(err) {
  if (err) {
    log('Error: ' + err);
    log(clc.red('Build failed.'));
    process.exit(1);
  }
}

var nv;
var dir = 'build';
Step(
  function () {
    // Get current app version.
    log('Getting default app\'s full version info ... ' + 'http://' + argv.host + '/_ah/info/version');
    request('http://' + argv.host + '/_ah/info/version', this);
  },
  function (err, res, body) {
    check(err);
    if (res.statusCode === 200) {
      // if (body.length < 50) { // Hack to filter error body
      //   var tmp = body.split('.');
      //   tmp = tmp[0].split('-');
      //   if (!argv.v || argv.v == tmp[0]) // major v req is default
      //     nv = tmp[0] + '-' + (parseInt(tmp[1]) + 1);
      //   else nv = argv.v + '-0';
      // } else {
      //   if (!argv.v)
      //     check('There is no default app version. Please supply --major_version.');
      //   nv = argv.v + '-0'; // no default
      // }
      nv = '0-0-2-wip-0';
      this();
    } else
      check('Could not get default app version (wait a few secs and try again).');
  },
  function () {
    // Run grunt tasks from Gruntfile.js
    log('Starting statics build for new version ' + clc.underline(nv) + ' ...');
    log('dir:' + dir);
    exec('grunt build --dir=' + dir, this);
  },
  // Clean up.
  function (err, stdout, stderr) {
    check(err);
    log('rel:' + rel + ' dir:' + dir);
    fs.renameSync(rel + dir + '/js/main.js', rel + dir + '/min.js');
    fs.renameSync(rel + dir + '/js/libs/store/store.min.js', rel + dir + '/store.min.js');
    wrench.rmdirSyncRecursive(rel + dir + '/js');
    fs.mkdirSync(rel + dir + '/js');
    fs.renameSync(rel + dir + '/min.js', rel + dir + '/js/min.js');
    fs.renameSync(rel + dir + '/store.min.js', rel + dir + '/js/store.min.js');
    wrench.rmdirSyncRecursive(rel + dir + '/templates');
    var min = fs.readFileSync(rel + dir + '/js/min.js', 'utf8');
    var banner = '/*\n * hylo.com v' + nv + '\n */\n';
    var vvar = 'var __hv = "' + nv + '";';
    fs.writeFileSync(rel + dir + '/js/min.js', banner + vvar + min);
    this();
  },
  function (err) {
    log('Compiled statics to ' + clc.underline(rel + dir) + '.');
    log('Deploying to production environment ...');
    exec('appcfg.py --oauth2 update -V ' + nv + ' ' + rel, this);
  },
  function (err, stdout, stderr) {
    check(err);
    log('Setting default app version to ' + clc.underline(nv) + ' ...');
    exec('appcfg.py --oauth2 set_default_version -V ' + nv + ' ' + rel, this);
  },
  function (err, stdout, stderr) {
    check(err);
    log('Removing compiled statics at ' + clc.underline(rel + dir) + '.');
    wrench.rmdirSyncRecursive(rel + dir);
    // Done.
    log(clc.green('Build complete!'));
    process.exit(0);
  }
);
