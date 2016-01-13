#!/usr/bin/env node
var path = require('path')
var nopt = require('nopt')
var noptUsage = require('nopt-usage')
var shelljs = require('shelljs')
var fs = require('fs')
var express = require('express')
var app = express()
require('express-ws')(app)

var knownOpts = {
  'expression': String,
  'help': Boolean,
  'verbose': Boolean
}
var shortHands = {
  'e': ['--expression'],
  'h': ['--help'],
  'v': ['--verbose']
}
var description = {
  'expression': 'expression to evaluate instead of a file',
  'help': 'display this help',
  'verbose': 'show results from intermediary stages'
}
var parsed = nopt(knownOpts, shortHands)
var missingArgument = (parsed.argv.remain.length < 1 && !parsed.expression)
var firstArgumentIndex = parsed.expression ? 0 : 1

if (parsed.help || missingArgument) {
  var usage = 'usage: run [options] file [A [A ...]]\n\n' +
    'Unified interface for running javascript functions in a browser.\n\n' +
    'positional arguments:\n' +
    '  file\t\tJavaScript file to execute in the browser\n' +
    '  A\t\tpositional argument(s) to pass to the function\n\n' +
    'optional arguments: \n' +
    noptUsage(knownOpts, shortHands, description)
  console.log(usage)
  process.exit(1)
}

app.use(express.static(path.join(__dirname, './public')))

function bashToJavaScript (a) {
  if (Number.parseInt(a, 10) || Number.parseFloat(a)) {
    return a.toString()
  } else {
    return "'" + a.toString() + "'"
  }
}
app.ws('/socket', function (ws, req) {
  var code = (parsed.expression
      ? parsed.expression
      : fs.readFileSync(parsed.argv.remain[0]).toString()) +
    '\n' +
    "if (typeof run === 'function') {\n" +
    '  run(' + parsed.argv.remain.slice(firstArgumentIndex).map(bashToJavaScript).join(',') + ')\n' +
    '}\n'

  var cmd = JSON.stringify({ 'type': 'eval', 'code': code })
  if (parsed.verbose) {
    console.log('Sending: ' + cmd)
  }
  ws.send(cmd)
  cmd = JSON.stringify({ 'type': 'done' })
  if (parsed.verbose) {
    console.log('Sending: ' + cmd)
  }
  ws.send(cmd)

  ws.on('message', function (msg) {
    if (parsed.verbose) {
      console.log('Received: ' + msg)
    }

    try {
      var o = JSON.parse(msg)
      if (o.type === 'done') {
        process.exit(0)
      } else if (o.type === 'status') {
        if (parsed.verbose && o.status === 'connected') {
          console.log('Connection confirmed')
        }
      } else if (o.type === 'output') {
        console.log(o.output)
      } else if (o.type === 'error') {
        process.stderr.write(o.message + '\n')
        process.exit(1)
      } else {
        if (parsed.verbose) {
          console.log('Unknown message: ' + msg)
        }
      }
    } catch (e) {
      if (parsed.verbose) {
        console.log('Invalid JSON from message: ' + msg)
      }
    }
  })

  process.stdin.on('readable', function () {
    var chunk = process.stdin.read()
    if (chunk !== null) {
      ws.send(chunk.toString())
    }
  })
})
exports.start = function (startCmd) {
  app.listen(8080, function () {
    var cmd = startCmd + ' http://localhost:8080/run.html'
    var status = shelljs.exec(cmd, {silent: !parsed.verbose})
    if (status.code !== 0) {
      console.log("Execution error for '" + cmd + "':")
      console.log(status.output)
      process.exit(1)
    }
  })
}
