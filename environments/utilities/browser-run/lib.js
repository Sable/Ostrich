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
  'help': Boolean,
  'verbose': Boolean
}
var shortHands = {
  'h': ['--help'],
  'v': ['--verbose']
}
var description = {
  'help': 'Display this help',
  'verbose': 'Show results from intermediary stages'
}
var parsed = nopt(knownOpts, shortHands)

if (parsed.help || parsed.argv.remain.length < 1) {
  var usage = 'usage: run file [options]\n\n' +
    'positional arguments:\n' +
    '  file\tJavaScript file to execute in the browser\n\n' +
    'optional arguments: \n' +
    noptUsage(knownOpts, shortHands, description)
  console.log(usage)
  process.exit(1)
}

app.use(express.static(path.join(__dirname, './public')))

app.ws('/socket', function (ws, req) {
  var cmd = JSON.stringify({ 'type': 'eval', 'code': fs.readFileSync(parsed.argv.remain[0]).toString() })
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
      } else if (o.type === 'output') {
        console.log(o.output)
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
