#!/usr/bin/env node

var dir = require('node-dir')
var path = require('path')
var fs = require('fs')
var pointer = require('json-pointer')
var validator = require('is-my-json-valid')
var shelljs = require('shelljs')
var extend = require('extend')

function deepcopy (o) {
  return extend(true, {}, o)
}

var suiteRootDir = path.join(__dirname, '/../../../')

// Validate the configuration schema first
var configSchemaPath = path.join(__dirname, '/config-schema.json')
var configSchemaString = fs.readFileSync(configSchemaPath)
var configSchema
try {
  configSchema = JSON.parse(configSchemaString)
} catch (e) {
  throw new Error("Configuration schema '" + configSchemaPath + "' is invalid JSON. Try jsonlint.com to fix it.")
}

var validateJSONSchemaV4 = validator(
  JSON.parse(fs.readFileSync(path.join(__dirname, '/schema.json'))),
  {
    greedy: true,
    verbose: true
  })
validateJSONSchemaV4(configSchema)
if (validateJSONSchemaV4.errors !== null) {
  throw new Error(validateJSONSchemaV4.errors)
}

function getConfigFromFileSystem (dirRoot, cb) {
  var validateConfig = validator(
    configSchema,
    {
      greedy: true,
      verbose: true
    })

  var types = pointer.get(configSchema, '/config-type-name-list')
  var collections = types.map(function (s) { return s + 's' })
  var shortNamePattern = configSchema.definitions['short-name'].pattern.slice(1, -1)
  var pathParser = new RegExp('(' + collections.join('|') + ')\/' + shortNamePattern, 'g')

  function keepConfigPaths (paths) {
    return paths.filter(function (file) {
      return file.match(RegExp('(' + types.join('|') + ').json$'))
    })
  }

  function parseConfig (p) {
    try {
      var config = JSON.parse(fs.readFileSync(p))
      validateConfig(config)
      if (validateConfig.errors !== null) {
        cb(validateConfig.errors, {})
      }
    } catch (e) {
      cb("Invalid JSON in configuration '" + p + "':\n" + e.toString(), {})
    }
    return config
  }

  function validateSemantics (config) {
    function error (msg) {
      return {
        'error': 'Semantic Validation Error',
        'message': msg
      }
    }

    // 1. Ensure a benchmark has at least one implementation
    for (var b in config.benchmarks) {
      if (!config.benchmarks[b].hasOwnProperty('implementations')) {
        return error("Benchmark '" + b + "' has no 'implementations' directory")
      }

      if (Object.keys(config.benchmarks[b].implementations).length < 1) {
        return error("Benchmark '" + b + "' has no implementation folder or configuration file")
      }
    }

    return null
  }

  function addLocation (node, p) {
    node.location = path.dirname(p)
    return node
  }

  function importConfig (older, newer) {
    for (var p in newer) {
      older[p] = newer[p]
    }
  }

  function parsePath (p) {
    var r = p.match(pathParser)
    if (r === null) {
      throw new Error("Invalid path '" + p + "'")
    }
    return r.map(function (s) { return s.split('/') })
  }

  function computeList (config, key, resultKey) {
    var list = []
    for (var k in config[key]) {
      list.push(k)
    }
    config[resultKey] = list
  }

  function computeImplementationList (config) {
    var implementations = {}
    for (var b in config.benchmarks) {
      for (var i in config.benchmarks[b].implementations) {
        implementations[i] = true
      }
    }

    var list = []
    for (i in implementations) {
      list.push(i)
    }

    config['implementation-list'] = list
  }

  function updateGlobalConfig (config, json) {
    var configPath = parsePath(json.location)
    var node = config

    configPath.forEach(function (pair) {
      var collectionName = pair[0]
      var shortName = pair[1]

      if (collections.indexOf(collectionName) < 0) {
        return new Error("Invalid collection '" + collectionName + "'")
      }

      var collection = node[collectionName] || (node[collectionName] = {})
      node = collection[shortName] || (collection[shortName] = {'short-name': shortName})
    })

    importConfig(node, json)
    return null
  }

  var validateRelativePath = validator(
    pointer.get(configSchema, '/definitions/relative-path'))

  function isRelativePath (o) {
    validateRelativePath(o)
    return validateRelativePath.errors === null
  }

  var validateSuiteRootPath = validator(
    pointer.get(configSchema, '/definitions/suite-root-path'))

  function isSuiteRootPath (o) {
    validateSuiteRootPath(o)
    return validateSuiteRootPath.errors === null
  }

  function resolvePaths (config) {
    function traverse (o, location) {
      if (o.hasOwnProperty('location')) {
        location = o.location
      }

      for (var i in o) {
        if (location) {
          if (isRelativePath(o[i])) {
            o[i] = path.join(location, o[i])
          } else if (isSuiteRootPath(o[i])) {
            o[i] = { 'file': path.join(suiteRootDir, o[i]['suite-root']) }
          }
        }

        if (o[i] !== null && typeof (o[i]) === 'object') {
          // going on step down in the object tree!!
          traverse(o[i], location)
        }
      }
    }

    traverse(config, null)
  }

  function resolveExecutablePaths (config) {
    function traverse (o, location) {
      if (o.hasOwnProperty('executable-name')) {
        if (!o.hasOwnProperty('executable-path')) {
          var suitePath = path.join(location, o['executable-name'])
          var systemPath = shelljs.which(o['executable-name'])
          if (shelljs.test('-e', suitePath)) {
            o['executable-path'] = suitePath
          } else if (systemPath !== null) {
            o['executable-path'] = systemPath
          } else {
            cb("Could not resolve executable path for compiler '" +
              o['executable-name'] + '' + "' specified in " + location, null)
            process.exit(1)
          }
        }
      }

      for (var i in o) {
        if (o[i] !== null && typeof (o[i]) === 'object') {
          // going on step down in the object tree!!
          traverse(o[i], o[i].hasOwnProperty('location') ? o[i].location : location)
        }
      }
    }

    traverse(config, suiteRootDir)
  }

  dir.files(dirRoot, function (err, files) {
    if (err) cb(err, null)

    var globalConfig = {}

    keepConfigPaths(files).forEach(function (p) {
      var config = parseConfig(p)
      err = updateGlobalConfig(globalConfig, addLocation(config, p))
      if (err) {
        cb(err, null)
        process.exit(1)
      }
    })
    err = validateSemantics(globalConfig)
    if (err) {
      cb(err, null)
      process.exit(1)
    }

    computeList(globalConfig, 'benchmarks', 'benchmark-list')
    computeList(globalConfig, 'compilers', 'compiler-list')
    computeList(globalConfig, 'environments', 'environment-list')
    computeImplementationList(globalConfig)

    resolvePaths(globalConfig)
    resolveExecutablePaths(globalConfig)

    globalConfig.schema = configSchema

    cb(null, globalConfig)
  })
}

exports.config = getConfigFromFileSystem
exports.createMatcher = function (p) {
  var schemaCopy = deepcopy(configSchema)
  if (!pointer.has(configSchema, p)) {
    throw new Error('Invalid pointer ' + p + ' for matcher')
  }
  schemaCopy.oneOf = [ {'$ref': '#' + p} ]
  var matcher = validator(schemaCopy)

  return function (o) {
    matcher(o)
    return matcher.errors === null
  }
}

var isResolvedValue = exports.createMatcher('/definitions/resolved-value')
var isFilePath = exports.createMatcher('/definitions/file-path')
var macros = {
  '/experiment/input-size': function (config, v, options) {
    return {
      'config': '/benchmark/input-size/' + v
    }
  },
  '/experiment/input-file': function (config, v, options) {
    var silentState = shelljs.config.silent
    shelljs.config.silent = true
    var cmd = path.join(config.benchmark.location, '/input/get') + ' ' + v[0] + ' ' + v[1]
    var status = shelljs.exec(cmd)
    shelljs.config.silent = silentState

    if (status.code !== 0) {
      throw new Error('Expand input-file: Execution error for ' + cmd + ':')
    }

    var filePath = {
      'file': status.output
    }

    if (!isFilePath(filePath)) {
      // Be lenient with file path output including a trailing newline
      var m = filePath.file.match('(.*)\n+$')
      if (m) {
        var cleanFilePath = {
          'file': m[1]
        }
        if (isFilePath(cleanFilePath)) {
          return cleanFilePath
        }
        filePath = cleanFilePath
      }

      throw new Error("Invalid output from '" + cmd + "', expected a file path, instead got:\n'" + status.output + "'")
    }

    return filePath
  },
  '/definitions/expandable-reference': function (config, v, options) {
    if (!pointer.has(config, v.expand)) {
      if (options.strict) {
        throw new Error('could not find expandable reference: ' + v.expand)
      }
      return v
    }

    if (options.macros.hasOwnProperty(v.expand)) {
      return options.macros[v.expand](config, options.traverse(pointer.get(config, v.expand)), options)
    } else {
      return v
    }
  },
  '/definitions/configuration-reference': function (config, v, options) {
    if (pointer.has(config, v.config)) {
      return pointer.get(config, v.config)
    } else {
      if (options.strict) {
        throw new Error('Invalid reference to ' + v.config)
      } else {
        return v
      }
    }
  },
  '/definitions/file-path-object': function (config, v, options) {
    return v.file
  },
  '/definitions/prefix-object': function (config, v, options) {
    if (isResolvedValue(v.value)) {
      var value = v.value
      if (Array.prototype.isPrototypeOf(value)) {
        return value.map(function (s) {
          return v.prefix + s
        })
      } else {
        return v.prefix + value
      }
    } else {
      return v
    }
  }
}

exports.expand = function (config, options) {
  var option_defaults = {
    'strict': false,
    'macros': macros
  }
  options = options || {}
  options.strict = options.strict || option_defaults.strict

  // Macro expansions maybe be either listed in an array to use
  // the default definitions or completely specified using functions
  // by following the calling protocol
  if (options.hasOwnProperty('macros')) {
    if (Array.prototype.isPrototypeOf(options.macros)) {
      for (var i = 0; i < options.macros.length; ++i) {
        var dict = {}
        var p = options.macros[i]
        if (macros.hasOwnProperty(p)) {
          dict[p] = option_defaults.macros[p]
        }
      }
      options.macros = dict
    }
  } else {
    options.macros = option_defaults.macros
  }

  // Just-In-Time dispatcher for macro expansion,
  // performance may be improved by code generation
  // using a switch case rather than linear search
  // through an array
  var dispatch = (function (config, options) {
    var match = []
    var pointer = []
    for (var p in options.macros) {
      if (p.match(/^\/definitions\//)) {
        match.push(exports.createMatcher(p))
        pointer.push(p)
      }
    }
    return function (v) {
      for (var i = 0; i < match.length; ++i) {
        if (match[i](v)) {
          return options.macros[pointer[i]](config, v, options)
        }
      }
      return v
    }
  })(config, options)

  // Bottom-up tree rewriting with fixed-point expansion
  function traverse (o) {
    for (var i in o) {
      var v = o[i]
      if (v !== null && typeof (v) === 'object') {
        traverse(v)
      }
      var before = v
      var after = null
      while (true) {
        after = dispatch(before)
        if (JSON.stringify(before) === JSON.stringify(after)) {
          break
        }
        before = after
      }
      o[i] = after
    }

    return o
  }

  options.traverse = traverse
  traverse(config)
}

function flattenArray (array) {
  function recurse (a) {
    for (var i = 0; i < a.length; ++i) {
      var v = a[i]
      if (Array.prototype.isPrototypeOf(v)) {
        recurse(v)
      } else {
        flat.push(v)
      }
    }
  }

  if (Array.prototype.isPrototypeOf(array)) {
    var flat = []
    recurse(array)
    return flat
  } else {
    return array
  }
}
exports.flattenArray = flattenArray
