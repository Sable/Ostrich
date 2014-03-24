// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    return rawList ? list : ret + flushList();
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 1000000000;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 616;


/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });







/* memory initializer */ allocate([84,104,101,32,116,111,116,97,108,32,50,68,32,70,70,84,32,116,105,109,101,32,102,111,114,32,37,100,32,120,32,37,100,32,115,105,122,101,32,119,97,115,32,37,108,102,32,115,101,99,111,110,100,115,33,10,0,0,0,0,0,0,0,0,84,104,101,32,116,111,116,97,108,32,49,68,32,70,70,84,32,116,105,109,101,32,102,111,114,32,37,100,32,115,105,122,101,32,119,97,115,32,37,108,102,32,115,101,99,111,110,100,115,33,10,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i64=_memset;

  function _llvm_lifetime_start() {}

  function _llvm_lifetime_end() {}

  
   
  Module["_rand_r"] = _rand_r;
  
  var ___rand_seed=allocate([0x0273459b, 0, 0, 0], "i32", ALLOC_STATIC); 
  Module["_rand"] = _rand;

  
  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      return FS.getStreamFromPtr(stream).fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }

  var _cos=Math_cos;

  var _sin=Math_sin;

  function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[((ptr)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((ptr)+(4))>>2)]=Math.floor((now-1000*Math.floor(now/1000))*1000); // microseconds
      return 0;
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _abort() {
      Module['abort']();
    }

  function ___errno_location() {
      return ___errno_state;
    }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }






  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");


var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'use asm';
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);

  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var ___rand_seed=env.___rand_seed|0;
  var NaN=+env.NaN;
  var Infinity=+env.Infinity;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var abort=env.abort;
  var assert=env.assert;
  var asmPrintInt=env.asmPrintInt;
  var asmPrintFloat=env.asmPrintFloat;
  var Math_min=env.min;
  var invoke_ii=env.invoke_ii;
  var invoke_v=env.invoke_v;
  var invoke_iii=env.invoke_iii;
  var invoke_vi=env.invoke_vi;
  var _llvm_lifetime_end=env._llvm_lifetime_end;
  var _sysconf=env._sysconf;
  var _abort=env._abort;
  var _fprintf=env._fprintf;
  var _printf=env._printf;
  var _fflush=env._fflush;
  var __reallyNegative=env.__reallyNegative;
  var ___setErrNo=env.___setErrNo;
  var _fwrite=env._fwrite;
  var _send=env._send;
  var _write=env._write;
  var _sin=env._sin;
  var __formatString=env.__formatString;
  var _gettimeofday=env._gettimeofday;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _fileno=env._fileno;
  var _cos=env._cos;
  var _pwrite=env._pwrite;
  var _sbrk=env._sbrk;
  var ___errno_location=env.___errno_location;
  var _llvm_lifetime_start=env._llvm_lifetime_start;
  var _mkport=env._mkport;
  var _time=env._time;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function _malloc($bytes) {
 $bytes = $bytes | 0;
 var $8 = 0, $9 = 0, $10 = 0, $11 = 0, $17 = 0, $18 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $35 = 0, $40 = 0, $45 = 0, $56 = 0, $59 = 0, $62 = 0, $64 = 0, $65 = 0, $67 = 0, $69 = 0, $71 = 0, $73 = 0, $75 = 0, $77 = 0, $79 = 0, $82 = 0, $83 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $100 = 0, $105 = 0, $106 = 0, $109 = 0, $111 = 0, $117 = 0, $120 = 0, $121 = 0, $122 = 0, $124 = 0, $125 = 0, $126 = 0, $132 = 0, $133 = 0, $_pre_phi = 0, $F4_0 = 0, $145 = 0, $150 = 0, $152 = 0, $153 = 0, $155 = 0, $157 = 0, $159 = 0, $161 = 0, $163 = 0, $165 = 0, $167 = 0, $172 = 0, $rsize_0_i = 0, $v_0_i = 0, $t_0_i = 0, $179 = 0, $183 = 0, $185 = 0, $189 = 0, $190 = 0, $192 = 0, $193 = 0, $196 = 0, $197 = 0, $201 = 0, $203 = 0, $207 = 0, $211 = 0, $215 = 0, $220 = 0, $221 = 0, $224 = 0, $225 = 0, $RP_0_i = 0, $R_0_i = 0, $227 = 0, $228 = 0, $231 = 0, $232 = 0, $R_1_i = 0, $243 = 0, $244 = 0, $257 = 0, $273 = 0, $285 = 0, $299 = 0, $303 = 0, $314 = 0, $317 = 0, $318 = 0, $319 = 0, $321 = 0, $322 = 0, $323 = 0, $329 = 0, $330 = 0, $_pre_phi_i = 0, $F1_0_i = 0, $346 = 0, $347 = 0, $348 = 0, $351 = 0, $352 = 0, $359 = 0, $360 = 0, $363 = 0, $365 = 0, $368 = 0, $373 = 0, $idx_0_i = 0, $381 = 0, $389 = 0, $rst_0_i = 0, $sizebits_0_i = 0, $t_0_i16 = 0, $rsize_0_i17 = 0, $v_0_i18 = 0, $394 = 0, $395 = 0, $rsize_1_i = 0, $v_1_i = 0, $401 = 0, $404 = 0, $rst_1_i = 0, $t_1_i = 0, $rsize_2_i = 0, $v_2_i = 0, $412 = 0, $415 = 0, $420 = 0, $422 = 0, $423 = 0, $425 = 0, $427 = 0, $429 = 0, $431 = 0, $433 = 0, $435 = 0, $437 = 0, $t_2_ph_i = 0, $v_332_i = 0, $rsize_331_i = 0, $t_230_i = 0, $447 = 0, $448 = 0, $_rsize_3_i = 0, $t_2_v_3_i = 0, $450 = 0, $453 = 0, $v_3_lcssa_i = 0, $rsize_3_lcssa_i = 0, $461 = 0, $462 = 0, $465 = 0, $466 = 0, $470 = 0, $472 = 0, $476 = 0, $480 = 0, $484 = 0, $489 = 0, $490 = 0, $493 = 0, $494 = 0, $RP_0_i19 = 0, $R_0_i20 = 0, $496 = 0, $497 = 0, $500 = 0, $501 = 0, $R_1_i22 = 0, $512 = 0, $513 = 0, $526 = 0, $542 = 0, $554 = 0, $568 = 0, $572 = 0, $583 = 0, $586 = 0, $588 = 0, $589 = 0, $590 = 0, $596 = 0, $597 = 0, $_pre_phi_i28 = 0, $F5_0_i = 0, $609 = 0, $610 = 0, $617 = 0, $618 = 0, $621 = 0, $623 = 0, $626 = 0, $631 = 0, $I7_0_i = 0, $638 = 0, $645 = 0, $646 = 0, $659 = 0, $665 = 0, $K12_027_i = 0, $T_026_i = 0, $679 = 0, $680 = 0, $T_0_lcssa_i = 0, $694 = 0, $695 = 0, $697 = 0, $nb_0 = 0, $713 = 0, $716 = 0, $717 = 0, $720 = 0, $735 = 0, $742 = 0, $745 = 0, $746 = 0, $747 = 0, $761 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $778 = 0, $781 = 0, $782 = 0, $790 = 0, $793 = 0, $sp_0_i_i = 0, $795 = 0, $796 = 0, $799 = 0, $805 = 0, $808 = 0, $811 = 0, $812 = 0, $813 = 0, $ssize_0_i = 0, $823 = 0, $824 = 0, $828 = 0, $834 = 0, $835 = 0, $839 = 0, $842 = 0, $846 = 0, $ssize_1_i = 0, $br_0_i = 0, $tsize_0_i = 0, $tbase_0_i = 0, $848 = 0, $855 = 0, $859 = 0, $ssize_2_i = 0, $tsize_0323841_i = 0, $tsize_1_i = 0, $875 = 0, $876 = 0, $880 = 0, $882 = 0, $tbase_247_i = 0, $tsize_246_i = 0, $884 = 0, $888 = 0, $891 = 0, $i_02_i_i = 0, $897 = 0, $899 = 0, $906 = 0, $912 = 0, $915 = 0, $sp_075_i = 0, $923 = 0, $924 = 0, $925 = 0, $930 = 0, $937 = 0, $943 = 0, $945 = 0, $951 = 0, $954 = 0, $964 = 0, $sp_168_i = 0, $966 = 0, $971 = 0, $978 = 0, $982 = 0, $989 = 0, $992 = 0, $999 = 0, $1000 = 0, $1001 = 0, $_sum_i21_i = 0, $1005 = 0, $1006 = 0, $1007 = 0, $1015 = 0, $1024 = 0, $_sum2_i23_i = 0, $1033 = 0, $1037 = 0, $1038 = 0, $1043 = 0, $1046 = 0, $1049 = 0, $1072 = 0, $_pre_phi62_i_i = 0, $1077 = 0, $1080 = 0, $1083 = 0, $1088 = 0, $1093 = 0, $1097 = 0, $_sum67_i_i = 0, $1103 = 0, $1104 = 0, $1108 = 0, $1109 = 0, $RP_0_i_i = 0, $R_0_i_i = 0, $1111 = 0, $1112 = 0, $1115 = 0, $1116 = 0, $R_1_i_i = 0, $1129 = 0, $1130 = 0, $1143 = 0, $_sum3233_i_i = 0, $1160 = 0, $1173 = 0, $qsize_0_i_i = 0, $oldfirst_0_i_i = 0, $1189 = 0, $1197 = 0, $1200 = 0, $1202 = 0, $1203 = 0, $1204 = 0, $1210 = 0, $1211 = 0, $_pre_phi_i25_i = 0, $F4_0_i_i = 0, $1223 = 0, $1224 = 0, $1231 = 0, $1232 = 0, $1235 = 0, $1237 = 0, $1240 = 0, $1245 = 0, $I7_0_i_i = 0, $1252 = 0, $1259 = 0, $1260 = 0, $1273 = 0, $1279 = 0, $K8_056_i_i = 0, $T_055_i_i = 0, $1293 = 0, $1294 = 0, $T_0_lcssa_i28_i = 0, $1308 = 0, $1309 = 0, $1311 = 0, $1325 = 0, $sp_0_i_i_i = 0, $1328 = 0, $1332 = 0, $1333 = 0, $1339 = 0, $1346 = 0, $1347 = 0, $1351 = 0, $1352 = 0, $1356 = 0, $1362 = 0, $1365 = 0, $1375 = 0, $1378 = 0, $1379 = 0, $1387 = 0, $1390 = 0, $1396 = 0, $1399 = 0, $1401 = 0, $1402 = 0, $1403 = 0, $1409 = 0, $1410 = 0, $_pre_phi_i_i = 0, $F_0_i_i = 0, $1420 = 0, $1421 = 0, $1428 = 0, $1429 = 0, $1432 = 0, $1434 = 0, $1437 = 0, $1442 = 0, $I1_0_i_i = 0, $1449 = 0, $1453 = 0, $1454 = 0, $1463 = 0, $1469 = 0, $K2_015_i_i = 0, $T_014_i_i = 0, $1483 = 0, $1484 = 0, $T_0_lcssa_i_i = 0, $1495 = 0, $1496 = 0, $1498 = 0, $1508 = 0, $1511 = 0, $1512 = 0, $1513 = 0, $mem_0 = 0, label = 0;
 do {
  if ($bytes >>> 0 < 245 >>> 0) {
   if ($bytes >>> 0 < 11 >>> 0) {
    $8 = 16;
   } else {
    $8 = $bytes + 11 & -8;
   }
   $9 = $8 >>> 3;
   $10 = HEAP32[38] | 0;
   $11 = $10 >>> ($9 >>> 0);
   if (($11 & 3 | 0) != 0) {
    $17 = ($11 & 1 ^ 1) + $9 | 0;
    $18 = $17 << 1;
    $20 = 192 + ($18 << 2) | 0;
    $21 = 192 + ($18 + 2 << 2) | 0;
    $22 = HEAP32[$21 >> 2] | 0;
    $23 = $22 + 8 | 0;
    $24 = HEAP32[$23 >> 2] | 0;
    do {
     if (($20 | 0) == ($24 | 0)) {
      HEAP32[38] = $10 & ~(1 << $17);
     } else {
      if ($24 >>> 0 < (HEAP32[42] | 0) >>> 0) {
       _abort();
       return 0;
      }
      $35 = $24 + 12 | 0;
      if ((HEAP32[$35 >> 2] | 0) == ($22 | 0)) {
       HEAP32[$35 >> 2] = $20;
       HEAP32[$21 >> 2] = $24;
       break;
      } else {
       _abort();
       return 0;
      }
     }
    } while (0);
    $40 = $17 << 3;
    HEAP32[$22 + 4 >> 2] = $40 | 3;
    $45 = $22 + ($40 | 4) | 0;
    HEAP32[$45 >> 2] = HEAP32[$45 >> 2] | 1;
    $mem_0 = $23;
    return $mem_0 | 0;
   }
   if (!($8 >>> 0 > (HEAP32[40] | 0) >>> 0)) {
    $nb_0 = $8;
    break;
   }
   if (($11 | 0) != 0) {
    $56 = 2 << $9;
    $59 = $11 << $9 & ($56 | -$56);
    $62 = ($59 & -$59) - 1 | 0;
    $64 = $62 >>> 12 & 16;
    $65 = $62 >>> ($64 >>> 0);
    $67 = $65 >>> 5 & 8;
    $69 = $65 >>> ($67 >>> 0);
    $71 = $69 >>> 2 & 4;
    $73 = $69 >>> ($71 >>> 0);
    $75 = $73 >>> 1 & 2;
    $77 = $73 >>> ($75 >>> 0);
    $79 = $77 >>> 1 & 1;
    $82 = ($67 | $64 | $71 | $75 | $79) + ($77 >>> ($79 >>> 0)) | 0;
    $83 = $82 << 1;
    $85 = 192 + ($83 << 2) | 0;
    $86 = 192 + ($83 + 2 << 2) | 0;
    $87 = HEAP32[$86 >> 2] | 0;
    $88 = $87 + 8 | 0;
    $89 = HEAP32[$88 >> 2] | 0;
    do {
     if (($85 | 0) == ($89 | 0)) {
      HEAP32[38] = $10 & ~(1 << $82);
     } else {
      if ($89 >>> 0 < (HEAP32[42] | 0) >>> 0) {
       _abort();
       return 0;
      }
      $100 = $89 + 12 | 0;
      if ((HEAP32[$100 >> 2] | 0) == ($87 | 0)) {
       HEAP32[$100 >> 2] = $85;
       HEAP32[$86 >> 2] = $89;
       break;
      } else {
       _abort();
       return 0;
      }
     }
    } while (0);
    $105 = $82 << 3;
    $106 = $105 - $8 | 0;
    HEAP32[$87 + 4 >> 2] = $8 | 3;
    $109 = $87;
    $111 = $109 + $8 | 0;
    HEAP32[$109 + ($8 | 4) >> 2] = $106 | 1;
    HEAP32[$109 + $105 >> 2] = $106;
    $117 = HEAP32[40] | 0;
    if (($117 | 0) != 0) {
     $120 = HEAP32[43] | 0;
     $121 = $117 >>> 3;
     $122 = $121 << 1;
     $124 = 192 + ($122 << 2) | 0;
     $125 = HEAP32[38] | 0;
     $126 = 1 << $121;
     do {
      if (($125 & $126 | 0) == 0) {
       HEAP32[38] = $125 | $126;
       $F4_0 = $124;
       $_pre_phi = 192 + ($122 + 2 << 2) | 0;
      } else {
       $132 = 192 + ($122 + 2 << 2) | 0;
       $133 = HEAP32[$132 >> 2] | 0;
       if (!($133 >>> 0 < (HEAP32[42] | 0) >>> 0)) {
        $F4_0 = $133;
        $_pre_phi = $132;
        break;
       }
       _abort();
       return 0;
      }
     } while (0);
     HEAP32[$_pre_phi >> 2] = $120;
     HEAP32[$F4_0 + 12 >> 2] = $120;
     HEAP32[$120 + 8 >> 2] = $F4_0;
     HEAP32[$120 + 12 >> 2] = $124;
    }
    HEAP32[40] = $106;
    HEAP32[43] = $111;
    $mem_0 = $88;
    return $mem_0 | 0;
   }
   $145 = HEAP32[39] | 0;
   if (($145 | 0) == 0) {
    $nb_0 = $8;
    break;
   }
   $150 = ($145 & -$145) - 1 | 0;
   $152 = $150 >>> 12 & 16;
   $153 = $150 >>> ($152 >>> 0);
   $155 = $153 >>> 5 & 8;
   $157 = $153 >>> ($155 >>> 0);
   $159 = $157 >>> 2 & 4;
   $161 = $157 >>> ($159 >>> 0);
   $163 = $161 >>> 1 & 2;
   $165 = $161 >>> ($163 >>> 0);
   $167 = $165 >>> 1 & 1;
   $172 = HEAP32[456 + (($155 | $152 | $159 | $163 | $167) + ($165 >>> ($167 >>> 0)) << 2) >> 2] | 0;
   $t_0_i = $172;
   $v_0_i = $172;
   $rsize_0_i = (HEAP32[$172 + 4 >> 2] & -8) - $8 | 0;
   while (1) {
    $179 = HEAP32[$t_0_i + 16 >> 2] | 0;
    if (($179 | 0) == 0) {
     $183 = HEAP32[$t_0_i + 20 >> 2] | 0;
     if (($183 | 0) == 0) {
      break;
     } else {
      $185 = $183;
     }
    } else {
     $185 = $179;
    }
    $189 = (HEAP32[$185 + 4 >> 2] & -8) - $8 | 0;
    $190 = $189 >>> 0 < $rsize_0_i >>> 0;
    $t_0_i = $185;
    $v_0_i = $190 ? $185 : $v_0_i;
    $rsize_0_i = $190 ? $189 : $rsize_0_i;
   }
   $192 = $v_0_i;
   $193 = HEAP32[42] | 0;
   if ($192 >>> 0 < $193 >>> 0) {
    _abort();
    return 0;
   }
   $196 = $192 + $8 | 0;
   $197 = $196;
   if (!($192 >>> 0 < $196 >>> 0)) {
    _abort();
    return 0;
   }
   $201 = HEAP32[$v_0_i + 24 >> 2] | 0;
   $203 = HEAP32[$v_0_i + 12 >> 2] | 0;
   do {
    if (($203 | 0) == ($v_0_i | 0)) {
     $220 = $v_0_i + 20 | 0;
     $221 = HEAP32[$220 >> 2] | 0;
     if (($221 | 0) == 0) {
      $224 = $v_0_i + 16 | 0;
      $225 = HEAP32[$224 >> 2] | 0;
      if (($225 | 0) == 0) {
       $R_1_i = 0;
       break;
      } else {
       $R_0_i = $225;
       $RP_0_i = $224;
      }
     } else {
      $R_0_i = $221;
      $RP_0_i = $220;
     }
     while (1) {
      $227 = $R_0_i + 20 | 0;
      $228 = HEAP32[$227 >> 2] | 0;
      if (($228 | 0) != 0) {
       $R_0_i = $228;
       $RP_0_i = $227;
       continue;
      }
      $231 = $R_0_i + 16 | 0;
      $232 = HEAP32[$231 >> 2] | 0;
      if (($232 | 0) == 0) {
       break;
      } else {
       $R_0_i = $232;
       $RP_0_i = $231;
      }
     }
     if ($RP_0_i >>> 0 < $193 >>> 0) {
      _abort();
      return 0;
     } else {
      HEAP32[$RP_0_i >> 2] = 0;
      $R_1_i = $R_0_i;
      break;
     }
    } else {
     $207 = HEAP32[$v_0_i + 8 >> 2] | 0;
     if ($207 >>> 0 < $193 >>> 0) {
      _abort();
      return 0;
     }
     $211 = $207 + 12 | 0;
     if ((HEAP32[$211 >> 2] | 0) != ($v_0_i | 0)) {
      _abort();
      return 0;
     }
     $215 = $203 + 8 | 0;
     if ((HEAP32[$215 >> 2] | 0) == ($v_0_i | 0)) {
      HEAP32[$211 >> 2] = $203;
      HEAP32[$215 >> 2] = $207;
      $R_1_i = $203;
      break;
     } else {
      _abort();
      return 0;
     }
    }
   } while (0);
   L78 : do {
    if (($201 | 0) != 0) {
     $243 = HEAP32[$v_0_i + 28 >> 2] | 0;
     $244 = 456 + ($243 << 2) | 0;
     do {
      if (($v_0_i | 0) == (HEAP32[$244 >> 2] | 0)) {
       HEAP32[$244 >> 2] = $R_1_i;
       if (($R_1_i | 0) != 0) {
        break;
       }
       HEAP32[39] = HEAP32[39] & ~(1 << $243);
       break L78;
      } else {
       if ($201 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
        return 0;
       }
       $257 = $201 + 16 | 0;
       if ((HEAP32[$257 >> 2] | 0) == ($v_0_i | 0)) {
        HEAP32[$257 >> 2] = $R_1_i;
       } else {
        HEAP32[$201 + 20 >> 2] = $R_1_i;
       }
       if (($R_1_i | 0) == 0) {
        break L78;
       }
      }
     } while (0);
     if ($R_1_i >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
      return 0;
     }
     HEAP32[$R_1_i + 24 >> 2] = $201;
     $273 = HEAP32[$v_0_i + 16 >> 2] | 0;
     do {
      if (($273 | 0) != 0) {
       if ($273 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
        return 0;
       } else {
        HEAP32[$R_1_i + 16 >> 2] = $273;
        HEAP32[$273 + 24 >> 2] = $R_1_i;
        break;
       }
      }
     } while (0);
     $285 = HEAP32[$v_0_i + 20 >> 2] | 0;
     if (($285 | 0) == 0) {
      break;
     }
     if ($285 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
      return 0;
     } else {
      HEAP32[$R_1_i + 20 >> 2] = $285;
      HEAP32[$285 + 24 >> 2] = $R_1_i;
      break;
     }
    }
   } while (0);
   if ($rsize_0_i >>> 0 < 16 >>> 0) {
    $299 = $rsize_0_i + $8 | 0;
    HEAP32[$v_0_i + 4 >> 2] = $299 | 3;
    $303 = $192 + ($299 + 4) | 0;
    HEAP32[$303 >> 2] = HEAP32[$303 >> 2] | 1;
   } else {
    HEAP32[$v_0_i + 4 >> 2] = $8 | 3;
    HEAP32[$192 + ($8 | 4) >> 2] = $rsize_0_i | 1;
    HEAP32[$192 + ($rsize_0_i + $8) >> 2] = $rsize_0_i;
    $314 = HEAP32[40] | 0;
    if (($314 | 0) != 0) {
     $317 = HEAP32[43] | 0;
     $318 = $314 >>> 3;
     $319 = $318 << 1;
     $321 = 192 + ($319 << 2) | 0;
     $322 = HEAP32[38] | 0;
     $323 = 1 << $318;
     do {
      if (($322 & $323 | 0) == 0) {
       HEAP32[38] = $322 | $323;
       $F1_0_i = $321;
       $_pre_phi_i = 192 + ($319 + 2 << 2) | 0;
      } else {
       $329 = 192 + ($319 + 2 << 2) | 0;
       $330 = HEAP32[$329 >> 2] | 0;
       if (!($330 >>> 0 < (HEAP32[42] | 0) >>> 0)) {
        $F1_0_i = $330;
        $_pre_phi_i = $329;
        break;
       }
       _abort();
       return 0;
      }
     } while (0);
     HEAP32[$_pre_phi_i >> 2] = $317;
     HEAP32[$F1_0_i + 12 >> 2] = $317;
     HEAP32[$317 + 8 >> 2] = $F1_0_i;
     HEAP32[$317 + 12 >> 2] = $321;
    }
    HEAP32[40] = $rsize_0_i;
    HEAP32[43] = $197;
   }
   $mem_0 = $v_0_i + 8 | 0;
   return $mem_0 | 0;
  } else {
   if ($bytes >>> 0 > 4294967231 >>> 0) {
    $nb_0 = -1;
    break;
   }
   $346 = $bytes + 11 | 0;
   $347 = $346 & -8;
   $348 = HEAP32[39] | 0;
   if (($348 | 0) == 0) {
    $nb_0 = $347;
    break;
   }
   $351 = -$347 | 0;
   $352 = $346 >>> 8;
   do {
    if (($352 | 0) == 0) {
     $idx_0_i = 0;
    } else {
     if ($347 >>> 0 > 16777215 >>> 0) {
      $idx_0_i = 31;
      break;
     }
     $359 = ($352 + 1048320 | 0) >>> 16 & 8;
     $360 = $352 << $359;
     $363 = ($360 + 520192 | 0) >>> 16 & 4;
     $365 = $360 << $363;
     $368 = ($365 + 245760 | 0) >>> 16 & 2;
     $373 = 14 - ($363 | $359 | $368) + ($365 << $368 >>> 15) | 0;
     $idx_0_i = $347 >>> (($373 + 7 | 0) >>> 0) & 1 | $373 << 1;
    }
   } while (0);
   $381 = HEAP32[456 + ($idx_0_i << 2) >> 2] | 0;
   L126 : do {
    if (($381 | 0) == 0) {
     $v_2_i = 0;
     $rsize_2_i = $351;
     $t_1_i = 0;
    } else {
     if (($idx_0_i | 0) == 31) {
      $389 = 0;
     } else {
      $389 = 25 - ($idx_0_i >>> 1) | 0;
     }
     $v_0_i18 = 0;
     $rsize_0_i17 = $351;
     $t_0_i16 = $381;
     $sizebits_0_i = $347 << $389;
     $rst_0_i = 0;
     while (1) {
      $394 = HEAP32[$t_0_i16 + 4 >> 2] & -8;
      $395 = $394 - $347 | 0;
      if ($395 >>> 0 < $rsize_0_i17 >>> 0) {
       if (($394 | 0) == ($347 | 0)) {
        $v_2_i = $t_0_i16;
        $rsize_2_i = $395;
        $t_1_i = $t_0_i16;
        break L126;
       } else {
        $v_1_i = $t_0_i16;
        $rsize_1_i = $395;
       }
      } else {
       $v_1_i = $v_0_i18;
       $rsize_1_i = $rsize_0_i17;
      }
      $401 = HEAP32[$t_0_i16 + 20 >> 2] | 0;
      $404 = HEAP32[$t_0_i16 + 16 + ($sizebits_0_i >>> 31 << 2) >> 2] | 0;
      $rst_1_i = ($401 | 0) == 0 | ($401 | 0) == ($404 | 0) ? $rst_0_i : $401;
      if (($404 | 0) == 0) {
       $v_2_i = $v_1_i;
       $rsize_2_i = $rsize_1_i;
       $t_1_i = $rst_1_i;
       break;
      } else {
       $v_0_i18 = $v_1_i;
       $rsize_0_i17 = $rsize_1_i;
       $t_0_i16 = $404;
       $sizebits_0_i = $sizebits_0_i << 1;
       $rst_0_i = $rst_1_i;
      }
     }
    }
   } while (0);
   if (($t_1_i | 0) == 0 & ($v_2_i | 0) == 0) {
    $412 = 2 << $idx_0_i;
    $415 = $348 & ($412 | -$412);
    if (($415 | 0) == 0) {
     $nb_0 = $347;
     break;
    }
    $420 = ($415 & -$415) - 1 | 0;
    $422 = $420 >>> 12 & 16;
    $423 = $420 >>> ($422 >>> 0);
    $425 = $423 >>> 5 & 8;
    $427 = $423 >>> ($425 >>> 0);
    $429 = $427 >>> 2 & 4;
    $431 = $427 >>> ($429 >>> 0);
    $433 = $431 >>> 1 & 2;
    $435 = $431 >>> ($433 >>> 0);
    $437 = $435 >>> 1 & 1;
    $t_2_ph_i = HEAP32[456 + (($425 | $422 | $429 | $433 | $437) + ($435 >>> ($437 >>> 0)) << 2) >> 2] | 0;
   } else {
    $t_2_ph_i = $t_1_i;
   }
   if (($t_2_ph_i | 0) == 0) {
    $rsize_3_lcssa_i = $rsize_2_i;
    $v_3_lcssa_i = $v_2_i;
   } else {
    $t_230_i = $t_2_ph_i;
    $rsize_331_i = $rsize_2_i;
    $v_332_i = $v_2_i;
    while (1) {
     $447 = (HEAP32[$t_230_i + 4 >> 2] & -8) - $347 | 0;
     $448 = $447 >>> 0 < $rsize_331_i >>> 0;
     $_rsize_3_i = $448 ? $447 : $rsize_331_i;
     $t_2_v_3_i = $448 ? $t_230_i : $v_332_i;
     $450 = HEAP32[$t_230_i + 16 >> 2] | 0;
     if (($450 | 0) != 0) {
      $t_230_i = $450;
      $rsize_331_i = $_rsize_3_i;
      $v_332_i = $t_2_v_3_i;
      continue;
     }
     $453 = HEAP32[$t_230_i + 20 >> 2] | 0;
     if (($453 | 0) == 0) {
      $rsize_3_lcssa_i = $_rsize_3_i;
      $v_3_lcssa_i = $t_2_v_3_i;
      break;
     } else {
      $t_230_i = $453;
      $rsize_331_i = $_rsize_3_i;
      $v_332_i = $t_2_v_3_i;
     }
    }
   }
   if (($v_3_lcssa_i | 0) == 0) {
    $nb_0 = $347;
    break;
   }
   if (!($rsize_3_lcssa_i >>> 0 < ((HEAP32[40] | 0) - $347 | 0) >>> 0)) {
    $nb_0 = $347;
    break;
   }
   $461 = $v_3_lcssa_i;
   $462 = HEAP32[42] | 0;
   if ($461 >>> 0 < $462 >>> 0) {
    _abort();
    return 0;
   }
   $465 = $461 + $347 | 0;
   $466 = $465;
   if (!($461 >>> 0 < $465 >>> 0)) {
    _abort();
    return 0;
   }
   $470 = HEAP32[$v_3_lcssa_i + 24 >> 2] | 0;
   $472 = HEAP32[$v_3_lcssa_i + 12 >> 2] | 0;
   do {
    if (($472 | 0) == ($v_3_lcssa_i | 0)) {
     $489 = $v_3_lcssa_i + 20 | 0;
     $490 = HEAP32[$489 >> 2] | 0;
     if (($490 | 0) == 0) {
      $493 = $v_3_lcssa_i + 16 | 0;
      $494 = HEAP32[$493 >> 2] | 0;
      if (($494 | 0) == 0) {
       $R_1_i22 = 0;
       break;
      } else {
       $R_0_i20 = $494;
       $RP_0_i19 = $493;
      }
     } else {
      $R_0_i20 = $490;
      $RP_0_i19 = $489;
     }
     while (1) {
      $496 = $R_0_i20 + 20 | 0;
      $497 = HEAP32[$496 >> 2] | 0;
      if (($497 | 0) != 0) {
       $R_0_i20 = $497;
       $RP_0_i19 = $496;
       continue;
      }
      $500 = $R_0_i20 + 16 | 0;
      $501 = HEAP32[$500 >> 2] | 0;
      if (($501 | 0) == 0) {
       break;
      } else {
       $R_0_i20 = $501;
       $RP_0_i19 = $500;
      }
     }
     if ($RP_0_i19 >>> 0 < $462 >>> 0) {
      _abort();
      return 0;
     } else {
      HEAP32[$RP_0_i19 >> 2] = 0;
      $R_1_i22 = $R_0_i20;
      break;
     }
    } else {
     $476 = HEAP32[$v_3_lcssa_i + 8 >> 2] | 0;
     if ($476 >>> 0 < $462 >>> 0) {
      _abort();
      return 0;
     }
     $480 = $476 + 12 | 0;
     if ((HEAP32[$480 >> 2] | 0) != ($v_3_lcssa_i | 0)) {
      _abort();
      return 0;
     }
     $484 = $472 + 8 | 0;
     if ((HEAP32[$484 >> 2] | 0) == ($v_3_lcssa_i | 0)) {
      HEAP32[$480 >> 2] = $472;
      HEAP32[$484 >> 2] = $476;
      $R_1_i22 = $472;
      break;
     } else {
      _abort();
      return 0;
     }
    }
   } while (0);
   L176 : do {
    if (($470 | 0) != 0) {
     $512 = HEAP32[$v_3_lcssa_i + 28 >> 2] | 0;
     $513 = 456 + ($512 << 2) | 0;
     do {
      if (($v_3_lcssa_i | 0) == (HEAP32[$513 >> 2] | 0)) {
       HEAP32[$513 >> 2] = $R_1_i22;
       if (($R_1_i22 | 0) != 0) {
        break;
       }
       HEAP32[39] = HEAP32[39] & ~(1 << $512);
       break L176;
      } else {
       if ($470 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
        return 0;
       }
       $526 = $470 + 16 | 0;
       if ((HEAP32[$526 >> 2] | 0) == ($v_3_lcssa_i | 0)) {
        HEAP32[$526 >> 2] = $R_1_i22;
       } else {
        HEAP32[$470 + 20 >> 2] = $R_1_i22;
       }
       if (($R_1_i22 | 0) == 0) {
        break L176;
       }
      }
     } while (0);
     if ($R_1_i22 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
      return 0;
     }
     HEAP32[$R_1_i22 + 24 >> 2] = $470;
     $542 = HEAP32[$v_3_lcssa_i + 16 >> 2] | 0;
     do {
      if (($542 | 0) != 0) {
       if ($542 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
        return 0;
       } else {
        HEAP32[$R_1_i22 + 16 >> 2] = $542;
        HEAP32[$542 + 24 >> 2] = $R_1_i22;
        break;
       }
      }
     } while (0);
     $554 = HEAP32[$v_3_lcssa_i + 20 >> 2] | 0;
     if (($554 | 0) == 0) {
      break;
     }
     if ($554 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
      return 0;
     } else {
      HEAP32[$R_1_i22 + 20 >> 2] = $554;
      HEAP32[$554 + 24 >> 2] = $R_1_i22;
      break;
     }
    }
   } while (0);
   L204 : do {
    if ($rsize_3_lcssa_i >>> 0 < 16 >>> 0) {
     $568 = $rsize_3_lcssa_i + $347 | 0;
     HEAP32[$v_3_lcssa_i + 4 >> 2] = $568 | 3;
     $572 = $461 + ($568 + 4) | 0;
     HEAP32[$572 >> 2] = HEAP32[$572 >> 2] | 1;
    } else {
     HEAP32[$v_3_lcssa_i + 4 >> 2] = $347 | 3;
     HEAP32[$461 + ($347 | 4) >> 2] = $rsize_3_lcssa_i | 1;
     HEAP32[$461 + ($rsize_3_lcssa_i + $347) >> 2] = $rsize_3_lcssa_i;
     $583 = $rsize_3_lcssa_i >>> 3;
     if ($rsize_3_lcssa_i >>> 0 < 256 >>> 0) {
      $586 = $583 << 1;
      $588 = 192 + ($586 << 2) | 0;
      $589 = HEAP32[38] | 0;
      $590 = 1 << $583;
      do {
       if (($589 & $590 | 0) == 0) {
        HEAP32[38] = $589 | $590;
        $F5_0_i = $588;
        $_pre_phi_i28 = 192 + ($586 + 2 << 2) | 0;
       } else {
        $596 = 192 + ($586 + 2 << 2) | 0;
        $597 = HEAP32[$596 >> 2] | 0;
        if (!($597 >>> 0 < (HEAP32[42] | 0) >>> 0)) {
         $F5_0_i = $597;
         $_pre_phi_i28 = $596;
         break;
        }
        _abort();
        return 0;
       }
      } while (0);
      HEAP32[$_pre_phi_i28 >> 2] = $466;
      HEAP32[$F5_0_i + 12 >> 2] = $466;
      HEAP32[$461 + ($347 + 8) >> 2] = $F5_0_i;
      HEAP32[$461 + ($347 + 12) >> 2] = $588;
      break;
     }
     $609 = $465;
     $610 = $rsize_3_lcssa_i >>> 8;
     do {
      if (($610 | 0) == 0) {
       $I7_0_i = 0;
      } else {
       if ($rsize_3_lcssa_i >>> 0 > 16777215 >>> 0) {
        $I7_0_i = 31;
        break;
       }
       $617 = ($610 + 1048320 | 0) >>> 16 & 8;
       $618 = $610 << $617;
       $621 = ($618 + 520192 | 0) >>> 16 & 4;
       $623 = $618 << $621;
       $626 = ($623 + 245760 | 0) >>> 16 & 2;
       $631 = 14 - ($621 | $617 | $626) + ($623 << $626 >>> 15) | 0;
       $I7_0_i = $rsize_3_lcssa_i >>> (($631 + 7 | 0) >>> 0) & 1 | $631 << 1;
      }
     } while (0);
     $638 = 456 + ($I7_0_i << 2) | 0;
     HEAP32[$461 + ($347 + 28) >> 2] = $I7_0_i;
     HEAP32[$461 + ($347 + 20) >> 2] = 0;
     HEAP32[$461 + ($347 + 16) >> 2] = 0;
     $645 = HEAP32[39] | 0;
     $646 = 1 << $I7_0_i;
     if (($645 & $646 | 0) == 0) {
      HEAP32[39] = $645 | $646;
      HEAP32[$638 >> 2] = $609;
      HEAP32[$461 + ($347 + 24) >> 2] = $638;
      HEAP32[$461 + ($347 + 12) >> 2] = $609;
      HEAP32[$461 + ($347 + 8) >> 2] = $609;
      break;
     }
     $659 = HEAP32[$638 >> 2] | 0;
     if (($I7_0_i | 0) == 31) {
      $665 = 0;
     } else {
      $665 = 25 - ($I7_0_i >>> 1) | 0;
     }
     L225 : do {
      if ((HEAP32[$659 + 4 >> 2] & -8 | 0) == ($rsize_3_lcssa_i | 0)) {
       $T_0_lcssa_i = $659;
      } else {
       $T_026_i = $659;
       $K12_027_i = $rsize_3_lcssa_i << $665;
       while (1) {
        $679 = $T_026_i + 16 + ($K12_027_i >>> 31 << 2) | 0;
        $680 = HEAP32[$679 >> 2] | 0;
        if (($680 | 0) == 0) {
         break;
        }
        if ((HEAP32[$680 + 4 >> 2] & -8 | 0) == ($rsize_3_lcssa_i | 0)) {
         $T_0_lcssa_i = $680;
         break L225;
        } else {
         $T_026_i = $680;
         $K12_027_i = $K12_027_i << 1;
        }
       }
       if ($679 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
        return 0;
       } else {
        HEAP32[$679 >> 2] = $609;
        HEAP32[$461 + ($347 + 24) >> 2] = $T_026_i;
        HEAP32[$461 + ($347 + 12) >> 2] = $609;
        HEAP32[$461 + ($347 + 8) >> 2] = $609;
        break L204;
       }
      }
     } while (0);
     $694 = $T_0_lcssa_i + 8 | 0;
     $695 = HEAP32[$694 >> 2] | 0;
     $697 = HEAP32[42] | 0;
     if ($T_0_lcssa_i >>> 0 < $697 >>> 0) {
      _abort();
      return 0;
     }
     if ($695 >>> 0 < $697 >>> 0) {
      _abort();
      return 0;
     } else {
      HEAP32[$695 + 12 >> 2] = $609;
      HEAP32[$694 >> 2] = $609;
      HEAP32[$461 + ($347 + 8) >> 2] = $695;
      HEAP32[$461 + ($347 + 12) >> 2] = $T_0_lcssa_i;
      HEAP32[$461 + ($347 + 24) >> 2] = 0;
      break;
     }
    }
   } while (0);
   $mem_0 = $v_3_lcssa_i + 8 | 0;
   return $mem_0 | 0;
  }
 } while (0);
 $713 = HEAP32[40] | 0;
 if (!($nb_0 >>> 0 > $713 >>> 0)) {
  $716 = $713 - $nb_0 | 0;
  $717 = HEAP32[43] | 0;
  if ($716 >>> 0 > 15 >>> 0) {
   $720 = $717;
   HEAP32[43] = $720 + $nb_0;
   HEAP32[40] = $716;
   HEAP32[$720 + ($nb_0 + 4) >> 2] = $716 | 1;
   HEAP32[$720 + $713 >> 2] = $716;
   HEAP32[$717 + 4 >> 2] = $nb_0 | 3;
  } else {
   HEAP32[40] = 0;
   HEAP32[43] = 0;
   HEAP32[$717 + 4 >> 2] = $713 | 3;
   $735 = $717 + ($713 + 4) | 0;
   HEAP32[$735 >> 2] = HEAP32[$735 >> 2] | 1;
  }
  $mem_0 = $717 + 8 | 0;
  return $mem_0 | 0;
 }
 $742 = HEAP32[41] | 0;
 if ($nb_0 >>> 0 < $742 >>> 0) {
  $745 = $742 - $nb_0 | 0;
  HEAP32[41] = $745;
  $746 = HEAP32[44] | 0;
  $747 = $746;
  HEAP32[44] = $747 + $nb_0;
  HEAP32[$747 + ($nb_0 + 4) >> 2] = $745 | 1;
  HEAP32[$746 + 4 >> 2] = $nb_0 | 3;
  $mem_0 = $746 + 8 | 0;
  return $mem_0 | 0;
 }
 do {
  if ((HEAP32[32] | 0) == 0) {
   $761 = _sysconf(30) | 0;
   if (($761 - 1 & $761 | 0) == 0) {
    HEAP32[34] = $761;
    HEAP32[33] = $761;
    HEAP32[35] = -1;
    HEAP32[36] = -1;
    HEAP32[37] = 0;
    HEAP32[149] = 0;
    HEAP32[32] = (_time(0) | 0) & -16 ^ 1431655768;
    break;
   } else {
    _abort();
    return 0;
   }
  }
 } while (0);
 $770 = $nb_0 + 48 | 0;
 $771 = HEAP32[34] | 0;
 $772 = $nb_0 + 47 | 0;
 $773 = $771 + $772 | 0;
 $774 = -$771 | 0;
 $775 = $773 & $774;
 if (!($775 >>> 0 > $nb_0 >>> 0)) {
  $mem_0 = 0;
  return $mem_0 | 0;
 }
 $778 = HEAP32[148] | 0;
 do {
  if (($778 | 0) != 0) {
   $781 = HEAP32[146] | 0;
   $782 = $781 + $775 | 0;
   if ($782 >>> 0 <= $781 >>> 0 | $782 >>> 0 > $778 >>> 0) {
    $mem_0 = 0;
   } else {
    break;
   }
   return $mem_0 | 0;
  }
 } while (0);
 L269 : do {
  if ((HEAP32[149] & 4 | 0) == 0) {
   $790 = HEAP32[44] | 0;
   L271 : do {
    if (($790 | 0) == 0) {
     label = 182;
    } else {
     $793 = $790;
     $sp_0_i_i = 600;
     while (1) {
      $795 = $sp_0_i_i | 0;
      $796 = HEAP32[$795 >> 2] | 0;
      if (!($796 >>> 0 > $793 >>> 0)) {
       $799 = $sp_0_i_i + 4 | 0;
       if (($796 + (HEAP32[$799 >> 2] | 0) | 0) >>> 0 > $793 >>> 0) {
        break;
       }
      }
      $805 = HEAP32[$sp_0_i_i + 8 >> 2] | 0;
      if (($805 | 0) == 0) {
       label = 182;
       break L271;
      } else {
       $sp_0_i_i = $805;
      }
     }
     if (($sp_0_i_i | 0) == 0) {
      label = 182;
      break;
     }
     $839 = $773 - (HEAP32[41] | 0) & $774;
     if (!($839 >>> 0 < 2147483647 >>> 0)) {
      $tsize_0323841_i = 0;
      break;
     }
     $842 = _sbrk($839 | 0) | 0;
     $846 = ($842 | 0) == ((HEAP32[$795 >> 2] | 0) + (HEAP32[$799 >> 2] | 0) | 0);
     $tbase_0_i = $846 ? $842 : -1;
     $tsize_0_i = $846 ? $839 : 0;
     $br_0_i = $842;
     $ssize_1_i = $839;
     label = 191;
    }
   } while (0);
   do {
    if ((label | 0) == 182) {
     $808 = _sbrk(0) | 0;
     if (($808 | 0) == -1) {
      $tsize_0323841_i = 0;
      break;
     }
     $811 = $808;
     $812 = HEAP32[33] | 0;
     $813 = $812 - 1 | 0;
     if (($813 & $811 | 0) == 0) {
      $ssize_0_i = $775;
     } else {
      $ssize_0_i = $775 - $811 + ($813 + $811 & -$812) | 0;
     }
     $823 = HEAP32[146] | 0;
     $824 = $823 + $ssize_0_i | 0;
     if (!($ssize_0_i >>> 0 > $nb_0 >>> 0 & $ssize_0_i >>> 0 < 2147483647 >>> 0)) {
      $tsize_0323841_i = 0;
      break;
     }
     $828 = HEAP32[148] | 0;
     if (($828 | 0) != 0) {
      if ($824 >>> 0 <= $823 >>> 0 | $824 >>> 0 > $828 >>> 0) {
       $tsize_0323841_i = 0;
       break;
      }
     }
     $834 = _sbrk($ssize_0_i | 0) | 0;
     $835 = ($834 | 0) == ($808 | 0);
     $tbase_0_i = $835 ? $808 : -1;
     $tsize_0_i = $835 ? $ssize_0_i : 0;
     $br_0_i = $834;
     $ssize_1_i = $ssize_0_i;
     label = 191;
    }
   } while (0);
   L291 : do {
    if ((label | 0) == 191) {
     $848 = -$ssize_1_i | 0;
     if (!(($tbase_0_i | 0) == -1)) {
      $tsize_246_i = $tsize_0_i;
      $tbase_247_i = $tbase_0_i;
      label = 202;
      break L269;
     }
     do {
      if (($br_0_i | 0) != -1 & $ssize_1_i >>> 0 < 2147483647 >>> 0 & $ssize_1_i >>> 0 < $770 >>> 0) {
       $855 = HEAP32[34] | 0;
       $859 = $772 - $ssize_1_i + $855 & -$855;
       if (!($859 >>> 0 < 2147483647 >>> 0)) {
        $ssize_2_i = $ssize_1_i;
        break;
       }
       if ((_sbrk($859 | 0) | 0) == -1) {
        _sbrk($848 | 0) | 0;
        $tsize_0323841_i = $tsize_0_i;
        break L291;
       } else {
        $ssize_2_i = $859 + $ssize_1_i | 0;
        break;
       }
      } else {
       $ssize_2_i = $ssize_1_i;
      }
     } while (0);
     if (($br_0_i | 0) == -1) {
      $tsize_0323841_i = $tsize_0_i;
     } else {
      $tsize_246_i = $ssize_2_i;
      $tbase_247_i = $br_0_i;
      label = 202;
      break L269;
     }
    }
   } while (0);
   HEAP32[149] = HEAP32[149] | 4;
   $tsize_1_i = $tsize_0323841_i;
   label = 199;
  } else {
   $tsize_1_i = 0;
   label = 199;
  }
 } while (0);
 do {
  if ((label | 0) == 199) {
   if (!($775 >>> 0 < 2147483647 >>> 0)) {
    break;
   }
   $875 = _sbrk($775 | 0) | 0;
   $876 = _sbrk(0) | 0;
   if (!(($876 | 0) != -1 & ($875 | 0) != -1 & $875 >>> 0 < $876 >>> 0)) {
    break;
   }
   $880 = $876 - $875 | 0;
   $882 = $880 >>> 0 > ($nb_0 + 40 | 0) >>> 0;
   if ($882) {
    $tsize_246_i = $882 ? $880 : $tsize_1_i;
    $tbase_247_i = $875;
    label = 202;
   }
  }
 } while (0);
 do {
  if ((label | 0) == 202) {
   $884 = (HEAP32[146] | 0) + $tsize_246_i | 0;
   HEAP32[146] = $884;
   if ($884 >>> 0 > (HEAP32[147] | 0) >>> 0) {
    HEAP32[147] = $884;
   }
   $888 = HEAP32[44] | 0;
   L311 : do {
    if (($888 | 0) == 0) {
     $891 = HEAP32[42] | 0;
     if (($891 | 0) == 0 | $tbase_247_i >>> 0 < $891 >>> 0) {
      HEAP32[42] = $tbase_247_i;
     }
     HEAP32[150] = $tbase_247_i;
     HEAP32[151] = $tsize_246_i;
     HEAP32[153] = 0;
     HEAP32[47] = HEAP32[32];
     HEAP32[46] = -1;
     $i_02_i_i = 0;
     do {
      $897 = $i_02_i_i << 1;
      $899 = 192 + ($897 << 2) | 0;
      HEAP32[192 + ($897 + 3 << 2) >> 2] = $899;
      HEAP32[192 + ($897 + 2 << 2) >> 2] = $899;
      $i_02_i_i = $i_02_i_i + 1 | 0;
     } while ($i_02_i_i >>> 0 < 32 >>> 0);
     $906 = $tbase_247_i + 8 | 0;
     if (($906 & 7 | 0) == 0) {
      $912 = 0;
     } else {
      $912 = -$906 & 7;
     }
     $915 = $tsize_246_i - 40 - $912 | 0;
     HEAP32[44] = $tbase_247_i + $912;
     HEAP32[41] = $915;
     HEAP32[$tbase_247_i + ($912 + 4) >> 2] = $915 | 1;
     HEAP32[$tbase_247_i + ($tsize_246_i - 36) >> 2] = 40;
     HEAP32[45] = HEAP32[36];
    } else {
     $sp_075_i = 600;
     while (1) {
      $923 = HEAP32[$sp_075_i >> 2] | 0;
      $924 = $sp_075_i + 4 | 0;
      $925 = HEAP32[$924 >> 2] | 0;
      if (($tbase_247_i | 0) == ($923 + $925 | 0)) {
       label = 214;
       break;
      }
      $930 = HEAP32[$sp_075_i + 8 >> 2] | 0;
      if (($930 | 0) == 0) {
       break;
      } else {
       $sp_075_i = $930;
      }
     }
     do {
      if ((label | 0) == 214) {
       if ((HEAP32[$sp_075_i + 12 >> 2] & 8 | 0) != 0) {
        break;
       }
       $937 = $888;
       if (!($937 >>> 0 >= $923 >>> 0 & $937 >>> 0 < $tbase_247_i >>> 0)) {
        break;
       }
       HEAP32[$924 >> 2] = $925 + $tsize_246_i;
       $943 = (HEAP32[41] | 0) + $tsize_246_i | 0;
       $945 = $888 + 8 | 0;
       if (($945 & 7 | 0) == 0) {
        $951 = 0;
       } else {
        $951 = -$945 & 7;
       }
       $954 = $943 - $951 | 0;
       HEAP32[44] = $937 + $951;
       HEAP32[41] = $954;
       HEAP32[$937 + ($951 + 4) >> 2] = $954 | 1;
       HEAP32[$937 + ($943 + 4) >> 2] = 40;
       HEAP32[45] = HEAP32[36];
       break L311;
      }
     } while (0);
     if ($tbase_247_i >>> 0 < (HEAP32[42] | 0) >>> 0) {
      HEAP32[42] = $tbase_247_i;
     }
     $964 = $tbase_247_i + $tsize_246_i | 0;
     $sp_168_i = 600;
     while (1) {
      $966 = $sp_168_i | 0;
      if ((HEAP32[$966 >> 2] | 0) == ($964 | 0)) {
       label = 224;
       break;
      }
      $971 = HEAP32[$sp_168_i + 8 >> 2] | 0;
      if (($971 | 0) == 0) {
       break;
      } else {
       $sp_168_i = $971;
      }
     }
     do {
      if ((label | 0) == 224) {
       if ((HEAP32[$sp_168_i + 12 >> 2] & 8 | 0) != 0) {
        break;
       }
       HEAP32[$966 >> 2] = $tbase_247_i;
       $978 = $sp_168_i + 4 | 0;
       HEAP32[$978 >> 2] = (HEAP32[$978 >> 2] | 0) + $tsize_246_i;
       $982 = $tbase_247_i + 8 | 0;
       if (($982 & 7 | 0) == 0) {
        $989 = 0;
       } else {
        $989 = -$982 & 7;
       }
       $992 = $tbase_247_i + ($tsize_246_i + 8) | 0;
       if (($992 & 7 | 0) == 0) {
        $999 = 0;
       } else {
        $999 = -$992 & 7;
       }
       $1000 = $tbase_247_i + ($999 + $tsize_246_i) | 0;
       $1001 = $1000;
       $_sum_i21_i = $989 + $nb_0 | 0;
       $1005 = $tbase_247_i + $_sum_i21_i | 0;
       $1006 = $1005;
       $1007 = $1000 - ($tbase_247_i + $989) - $nb_0 | 0;
       HEAP32[$tbase_247_i + ($989 + 4) >> 2] = $nb_0 | 3;
       L348 : do {
        if (($1001 | 0) == (HEAP32[44] | 0)) {
         $1015 = (HEAP32[41] | 0) + $1007 | 0;
         HEAP32[41] = $1015;
         HEAP32[44] = $1006;
         HEAP32[$tbase_247_i + ($_sum_i21_i + 4) >> 2] = $1015 | 1;
        } else {
         if (($1001 | 0) == (HEAP32[43] | 0)) {
          $1024 = (HEAP32[40] | 0) + $1007 | 0;
          HEAP32[40] = $1024;
          HEAP32[43] = $1006;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 4) >> 2] = $1024 | 1;
          HEAP32[$tbase_247_i + ($1024 + $_sum_i21_i) >> 2] = $1024;
          break;
         }
         $_sum2_i23_i = $tsize_246_i + 4 | 0;
         $1033 = HEAP32[$tbase_247_i + ($_sum2_i23_i + $999) >> 2] | 0;
         if (($1033 & 3 | 0) == 1) {
          $1037 = $1033 & -8;
          $1038 = $1033 >>> 3;
          L356 : do {
           if ($1033 >>> 0 < 256 >>> 0) {
            $1043 = HEAP32[$tbase_247_i + (($999 | 8) + $tsize_246_i) >> 2] | 0;
            $1046 = HEAP32[$tbase_247_i + ($tsize_246_i + 12 + $999) >> 2] | 0;
            $1049 = 192 + ($1038 << 1 << 2) | 0;
            do {
             if (($1043 | 0) != ($1049 | 0)) {
              if ($1043 >>> 0 < (HEAP32[42] | 0) >>> 0) {
               _abort();
               return 0;
              }
              if ((HEAP32[$1043 + 12 >> 2] | 0) == ($1001 | 0)) {
               break;
              }
              _abort();
              return 0;
             }
            } while (0);
            if (($1046 | 0) == ($1043 | 0)) {
             HEAP32[38] = HEAP32[38] & ~(1 << $1038);
             break;
            }
            do {
             if (($1046 | 0) == ($1049 | 0)) {
              $_pre_phi62_i_i = $1046 + 8 | 0;
             } else {
              if ($1046 >>> 0 < (HEAP32[42] | 0) >>> 0) {
               _abort();
               return 0;
              }
              $1072 = $1046 + 8 | 0;
              if ((HEAP32[$1072 >> 2] | 0) == ($1001 | 0)) {
               $_pre_phi62_i_i = $1072;
               break;
              }
              _abort();
              return 0;
             }
            } while (0);
            HEAP32[$1043 + 12 >> 2] = $1046;
            HEAP32[$_pre_phi62_i_i >> 2] = $1043;
           } else {
            $1077 = $1000;
            $1080 = HEAP32[$tbase_247_i + (($999 | 24) + $tsize_246_i) >> 2] | 0;
            $1083 = HEAP32[$tbase_247_i + ($tsize_246_i + 12 + $999) >> 2] | 0;
            do {
             if (($1083 | 0) == ($1077 | 0)) {
              $_sum67_i_i = $999 | 16;
              $1103 = $tbase_247_i + ($_sum2_i23_i + $_sum67_i_i) | 0;
              $1104 = HEAP32[$1103 >> 2] | 0;
              if (($1104 | 0) == 0) {
               $1108 = $tbase_247_i + ($_sum67_i_i + $tsize_246_i) | 0;
               $1109 = HEAP32[$1108 >> 2] | 0;
               if (($1109 | 0) == 0) {
                $R_1_i_i = 0;
                break;
               } else {
                $R_0_i_i = $1109;
                $RP_0_i_i = $1108;
               }
              } else {
               $R_0_i_i = $1104;
               $RP_0_i_i = $1103;
              }
              while (1) {
               $1111 = $R_0_i_i + 20 | 0;
               $1112 = HEAP32[$1111 >> 2] | 0;
               if (($1112 | 0) != 0) {
                $R_0_i_i = $1112;
                $RP_0_i_i = $1111;
                continue;
               }
               $1115 = $R_0_i_i + 16 | 0;
               $1116 = HEAP32[$1115 >> 2] | 0;
               if (($1116 | 0) == 0) {
                break;
               } else {
                $R_0_i_i = $1116;
                $RP_0_i_i = $1115;
               }
              }
              if ($RP_0_i_i >>> 0 < (HEAP32[42] | 0) >>> 0) {
               _abort();
               return 0;
              } else {
               HEAP32[$RP_0_i_i >> 2] = 0;
               $R_1_i_i = $R_0_i_i;
               break;
              }
             } else {
              $1088 = HEAP32[$tbase_247_i + (($999 | 8) + $tsize_246_i) >> 2] | 0;
              if ($1088 >>> 0 < (HEAP32[42] | 0) >>> 0) {
               _abort();
               return 0;
              }
              $1093 = $1088 + 12 | 0;
              if ((HEAP32[$1093 >> 2] | 0) != ($1077 | 0)) {
               _abort();
               return 0;
              }
              $1097 = $1083 + 8 | 0;
              if ((HEAP32[$1097 >> 2] | 0) == ($1077 | 0)) {
               HEAP32[$1093 >> 2] = $1083;
               HEAP32[$1097 >> 2] = $1088;
               $R_1_i_i = $1083;
               break;
              } else {
               _abort();
               return 0;
              }
             }
            } while (0);
            if (($1080 | 0) == 0) {
             break;
            }
            $1129 = HEAP32[$tbase_247_i + ($tsize_246_i + 28 + $999) >> 2] | 0;
            $1130 = 456 + ($1129 << 2) | 0;
            do {
             if (($1077 | 0) == (HEAP32[$1130 >> 2] | 0)) {
              HEAP32[$1130 >> 2] = $R_1_i_i;
              if (($R_1_i_i | 0) != 0) {
               break;
              }
              HEAP32[39] = HEAP32[39] & ~(1 << $1129);
              break L356;
             } else {
              if ($1080 >>> 0 < (HEAP32[42] | 0) >>> 0) {
               _abort();
               return 0;
              }
              $1143 = $1080 + 16 | 0;
              if ((HEAP32[$1143 >> 2] | 0) == ($1077 | 0)) {
               HEAP32[$1143 >> 2] = $R_1_i_i;
              } else {
               HEAP32[$1080 + 20 >> 2] = $R_1_i_i;
              }
              if (($R_1_i_i | 0) == 0) {
               break L356;
              }
             }
            } while (0);
            if ($R_1_i_i >>> 0 < (HEAP32[42] | 0) >>> 0) {
             _abort();
             return 0;
            }
            HEAP32[$R_1_i_i + 24 >> 2] = $1080;
            $_sum3233_i_i = $999 | 16;
            $1160 = HEAP32[$tbase_247_i + ($_sum3233_i_i + $tsize_246_i) >> 2] | 0;
            do {
             if (($1160 | 0) != 0) {
              if ($1160 >>> 0 < (HEAP32[42] | 0) >>> 0) {
               _abort();
               return 0;
              } else {
               HEAP32[$R_1_i_i + 16 >> 2] = $1160;
               HEAP32[$1160 + 24 >> 2] = $R_1_i_i;
               break;
              }
             }
            } while (0);
            $1173 = HEAP32[$tbase_247_i + ($_sum2_i23_i + $_sum3233_i_i) >> 2] | 0;
            if (($1173 | 0) == 0) {
             break;
            }
            if ($1173 >>> 0 < (HEAP32[42] | 0) >>> 0) {
             _abort();
             return 0;
            } else {
             HEAP32[$R_1_i_i + 20 >> 2] = $1173;
             HEAP32[$1173 + 24 >> 2] = $R_1_i_i;
             break;
            }
           }
          } while (0);
          $oldfirst_0_i_i = $tbase_247_i + (($1037 | $999) + $tsize_246_i) | 0;
          $qsize_0_i_i = $1037 + $1007 | 0;
         } else {
          $oldfirst_0_i_i = $1001;
          $qsize_0_i_i = $1007;
         }
         $1189 = $oldfirst_0_i_i + 4 | 0;
         HEAP32[$1189 >> 2] = HEAP32[$1189 >> 2] & -2;
         HEAP32[$tbase_247_i + ($_sum_i21_i + 4) >> 2] = $qsize_0_i_i | 1;
         HEAP32[$tbase_247_i + ($qsize_0_i_i + $_sum_i21_i) >> 2] = $qsize_0_i_i;
         $1197 = $qsize_0_i_i >>> 3;
         if ($qsize_0_i_i >>> 0 < 256 >>> 0) {
          $1200 = $1197 << 1;
          $1202 = 192 + ($1200 << 2) | 0;
          $1203 = HEAP32[38] | 0;
          $1204 = 1 << $1197;
          do {
           if (($1203 & $1204 | 0) == 0) {
            HEAP32[38] = $1203 | $1204;
            $F4_0_i_i = $1202;
            $_pre_phi_i25_i = 192 + ($1200 + 2 << 2) | 0;
           } else {
            $1210 = 192 + ($1200 + 2 << 2) | 0;
            $1211 = HEAP32[$1210 >> 2] | 0;
            if (!($1211 >>> 0 < (HEAP32[42] | 0) >>> 0)) {
             $F4_0_i_i = $1211;
             $_pre_phi_i25_i = $1210;
             break;
            }
            _abort();
            return 0;
           }
          } while (0);
          HEAP32[$_pre_phi_i25_i >> 2] = $1006;
          HEAP32[$F4_0_i_i + 12 >> 2] = $1006;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $F4_0_i_i;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $1202;
          break;
         }
         $1223 = $1005;
         $1224 = $qsize_0_i_i >>> 8;
         do {
          if (($1224 | 0) == 0) {
           $I7_0_i_i = 0;
          } else {
           if ($qsize_0_i_i >>> 0 > 16777215 >>> 0) {
            $I7_0_i_i = 31;
            break;
           }
           $1231 = ($1224 + 1048320 | 0) >>> 16 & 8;
           $1232 = $1224 << $1231;
           $1235 = ($1232 + 520192 | 0) >>> 16 & 4;
           $1237 = $1232 << $1235;
           $1240 = ($1237 + 245760 | 0) >>> 16 & 2;
           $1245 = 14 - ($1235 | $1231 | $1240) + ($1237 << $1240 >>> 15) | 0;
           $I7_0_i_i = $qsize_0_i_i >>> (($1245 + 7 | 0) >>> 0) & 1 | $1245 << 1;
          }
         } while (0);
         $1252 = 456 + ($I7_0_i_i << 2) | 0;
         HEAP32[$tbase_247_i + ($_sum_i21_i + 28) >> 2] = $I7_0_i_i;
         HEAP32[$tbase_247_i + ($_sum_i21_i + 20) >> 2] = 0;
         HEAP32[$tbase_247_i + ($_sum_i21_i + 16) >> 2] = 0;
         $1259 = HEAP32[39] | 0;
         $1260 = 1 << $I7_0_i_i;
         if (($1259 & $1260 | 0) == 0) {
          HEAP32[39] = $1259 | $1260;
          HEAP32[$1252 >> 2] = $1223;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 24) >> 2] = $1252;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $1223;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $1223;
          break;
         }
         $1273 = HEAP32[$1252 >> 2] | 0;
         if (($I7_0_i_i | 0) == 31) {
          $1279 = 0;
         } else {
          $1279 = 25 - ($I7_0_i_i >>> 1) | 0;
         }
         L445 : do {
          if ((HEAP32[$1273 + 4 >> 2] & -8 | 0) == ($qsize_0_i_i | 0)) {
           $T_0_lcssa_i28_i = $1273;
          } else {
           $T_055_i_i = $1273;
           $K8_056_i_i = $qsize_0_i_i << $1279;
           while (1) {
            $1293 = $T_055_i_i + 16 + ($K8_056_i_i >>> 31 << 2) | 0;
            $1294 = HEAP32[$1293 >> 2] | 0;
            if (($1294 | 0) == 0) {
             break;
            }
            if ((HEAP32[$1294 + 4 >> 2] & -8 | 0) == ($qsize_0_i_i | 0)) {
             $T_0_lcssa_i28_i = $1294;
             break L445;
            } else {
             $T_055_i_i = $1294;
             $K8_056_i_i = $K8_056_i_i << 1;
            }
           }
           if ($1293 >>> 0 < (HEAP32[42] | 0) >>> 0) {
            _abort();
            return 0;
           } else {
            HEAP32[$1293 >> 2] = $1223;
            HEAP32[$tbase_247_i + ($_sum_i21_i + 24) >> 2] = $T_055_i_i;
            HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $1223;
            HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $1223;
            break L348;
           }
          }
         } while (0);
         $1308 = $T_0_lcssa_i28_i + 8 | 0;
         $1309 = HEAP32[$1308 >> 2] | 0;
         $1311 = HEAP32[42] | 0;
         if ($T_0_lcssa_i28_i >>> 0 < $1311 >>> 0) {
          _abort();
          return 0;
         }
         if ($1309 >>> 0 < $1311 >>> 0) {
          _abort();
          return 0;
         } else {
          HEAP32[$1309 + 12 >> 2] = $1223;
          HEAP32[$1308 >> 2] = $1223;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 8) >> 2] = $1309;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 12) >> 2] = $T_0_lcssa_i28_i;
          HEAP32[$tbase_247_i + ($_sum_i21_i + 24) >> 2] = 0;
          break;
         }
        }
       } while (0);
       $mem_0 = $tbase_247_i + ($989 | 8) | 0;
       return $mem_0 | 0;
      }
     } while (0);
     $1325 = $888;
     $sp_0_i_i_i = 600;
     while (1) {
      $1328 = HEAP32[$sp_0_i_i_i >> 2] | 0;
      if (!($1328 >>> 0 > $1325 >>> 0)) {
       $1332 = HEAP32[$sp_0_i_i_i + 4 >> 2] | 0;
       $1333 = $1328 + $1332 | 0;
       if ($1333 >>> 0 > $1325 >>> 0) {
        break;
       }
      }
      $sp_0_i_i_i = HEAP32[$sp_0_i_i_i + 8 >> 2] | 0;
     }
     $1339 = $1328 + ($1332 - 39) | 0;
     if (($1339 & 7 | 0) == 0) {
      $1346 = 0;
     } else {
      $1346 = -$1339 & 7;
     }
     $1347 = $1328 + ($1332 - 47 + $1346) | 0;
     $1351 = $1347 >>> 0 < ($888 + 16 | 0) >>> 0 ? $1325 : $1347;
     $1352 = $1351 + 8 | 0;
     $1356 = $tbase_247_i + 8 | 0;
     if (($1356 & 7 | 0) == 0) {
      $1362 = 0;
     } else {
      $1362 = -$1356 & 7;
     }
     $1365 = $tsize_246_i - 40 - $1362 | 0;
     HEAP32[44] = $tbase_247_i + $1362;
     HEAP32[41] = $1365;
     HEAP32[$tbase_247_i + ($1362 + 4) >> 2] = $1365 | 1;
     HEAP32[$tbase_247_i + ($tsize_246_i - 36) >> 2] = 40;
     HEAP32[45] = HEAP32[36];
     HEAP32[$1351 + 4 >> 2] = 27;
     HEAP32[$1352 >> 2] = HEAP32[150];
     HEAP32[$1352 + 4 >> 2] = HEAP32[151];
     HEAP32[$1352 + 8 >> 2] = HEAP32[152];
     HEAP32[$1352 + 12 >> 2] = HEAP32[153];
     HEAP32[150] = $tbase_247_i;
     HEAP32[151] = $tsize_246_i;
     HEAP32[153] = 0;
     HEAP32[152] = $1352;
     $1375 = $1351 + 28 | 0;
     HEAP32[$1375 >> 2] = 7;
     if (($1351 + 32 | 0) >>> 0 < $1333 >>> 0) {
      $1378 = $1375;
      while (1) {
       $1379 = $1378 + 4 | 0;
       HEAP32[$1379 >> 2] = 7;
       if (($1378 + 8 | 0) >>> 0 < $1333 >>> 0) {
        $1378 = $1379;
       } else {
        break;
       }
      }
     }
     if (($1351 | 0) == ($1325 | 0)) {
      break;
     }
     $1387 = $1351 - $888 | 0;
     $1390 = $1325 + ($1387 + 4) | 0;
     HEAP32[$1390 >> 2] = HEAP32[$1390 >> 2] & -2;
     HEAP32[$888 + 4 >> 2] = $1387 | 1;
     HEAP32[$1325 + $1387 >> 2] = $1387;
     $1396 = $1387 >>> 3;
     if ($1387 >>> 0 < 256 >>> 0) {
      $1399 = $1396 << 1;
      $1401 = 192 + ($1399 << 2) | 0;
      $1402 = HEAP32[38] | 0;
      $1403 = 1 << $1396;
      do {
       if (($1402 & $1403 | 0) == 0) {
        HEAP32[38] = $1402 | $1403;
        $F_0_i_i = $1401;
        $_pre_phi_i_i = 192 + ($1399 + 2 << 2) | 0;
       } else {
        $1409 = 192 + ($1399 + 2 << 2) | 0;
        $1410 = HEAP32[$1409 >> 2] | 0;
        if (!($1410 >>> 0 < (HEAP32[42] | 0) >>> 0)) {
         $F_0_i_i = $1410;
         $_pre_phi_i_i = $1409;
         break;
        }
        _abort();
        return 0;
       }
      } while (0);
      HEAP32[$_pre_phi_i_i >> 2] = $888;
      HEAP32[$F_0_i_i + 12 >> 2] = $888;
      HEAP32[$888 + 8 >> 2] = $F_0_i_i;
      HEAP32[$888 + 12 >> 2] = $1401;
      break;
     }
     $1420 = $888;
     $1421 = $1387 >>> 8;
     do {
      if (($1421 | 0) == 0) {
       $I1_0_i_i = 0;
      } else {
       if ($1387 >>> 0 > 16777215 >>> 0) {
        $I1_0_i_i = 31;
        break;
       }
       $1428 = ($1421 + 1048320 | 0) >>> 16 & 8;
       $1429 = $1421 << $1428;
       $1432 = ($1429 + 520192 | 0) >>> 16 & 4;
       $1434 = $1429 << $1432;
       $1437 = ($1434 + 245760 | 0) >>> 16 & 2;
       $1442 = 14 - ($1432 | $1428 | $1437) + ($1434 << $1437 >>> 15) | 0;
       $I1_0_i_i = $1387 >>> (($1442 + 7 | 0) >>> 0) & 1 | $1442 << 1;
      }
     } while (0);
     $1449 = 456 + ($I1_0_i_i << 2) | 0;
     HEAP32[$888 + 28 >> 2] = $I1_0_i_i;
     HEAP32[$888 + 20 >> 2] = 0;
     HEAP32[$888 + 16 >> 2] = 0;
     $1453 = HEAP32[39] | 0;
     $1454 = 1 << $I1_0_i_i;
     if (($1453 & $1454 | 0) == 0) {
      HEAP32[39] = $1453 | $1454;
      HEAP32[$1449 >> 2] = $1420;
      HEAP32[$888 + 24 >> 2] = $1449;
      HEAP32[$888 + 12 >> 2] = $888;
      HEAP32[$888 + 8 >> 2] = $888;
      break;
     }
     $1463 = HEAP32[$1449 >> 2] | 0;
     if (($I1_0_i_i | 0) == 31) {
      $1469 = 0;
     } else {
      $1469 = 25 - ($I1_0_i_i >>> 1) | 0;
     }
     L499 : do {
      if ((HEAP32[$1463 + 4 >> 2] & -8 | 0) == ($1387 | 0)) {
       $T_0_lcssa_i_i = $1463;
      } else {
       $T_014_i_i = $1463;
       $K2_015_i_i = $1387 << $1469;
       while (1) {
        $1483 = $T_014_i_i + 16 + ($K2_015_i_i >>> 31 << 2) | 0;
        $1484 = HEAP32[$1483 >> 2] | 0;
        if (($1484 | 0) == 0) {
         break;
        }
        if ((HEAP32[$1484 + 4 >> 2] & -8 | 0) == ($1387 | 0)) {
         $T_0_lcssa_i_i = $1484;
         break L499;
        } else {
         $T_014_i_i = $1484;
         $K2_015_i_i = $K2_015_i_i << 1;
        }
       }
       if ($1483 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
        return 0;
       } else {
        HEAP32[$1483 >> 2] = $1420;
        HEAP32[$888 + 24 >> 2] = $T_014_i_i;
        HEAP32[$888 + 12 >> 2] = $888;
        HEAP32[$888 + 8 >> 2] = $888;
        break L311;
       }
      }
     } while (0);
     $1495 = $T_0_lcssa_i_i + 8 | 0;
     $1496 = HEAP32[$1495 >> 2] | 0;
     $1498 = HEAP32[42] | 0;
     if ($T_0_lcssa_i_i >>> 0 < $1498 >>> 0) {
      _abort();
      return 0;
     }
     if ($1496 >>> 0 < $1498 >>> 0) {
      _abort();
      return 0;
     } else {
      HEAP32[$1496 + 12 >> 2] = $1420;
      HEAP32[$1495 >> 2] = $1420;
      HEAP32[$888 + 8 >> 2] = $1496;
      HEAP32[$888 + 12 >> 2] = $T_0_lcssa_i_i;
      HEAP32[$888 + 24 >> 2] = 0;
      break;
     }
    }
   } while (0);
   $1508 = HEAP32[41] | 0;
   if (!($1508 >>> 0 > $nb_0 >>> 0)) {
    break;
   }
   $1511 = $1508 - $nb_0 | 0;
   HEAP32[41] = $1511;
   $1512 = HEAP32[44] | 0;
   $1513 = $1512;
   HEAP32[44] = $1513 + $nb_0;
   HEAP32[$1513 + ($nb_0 + 4) >> 2] = $1511 | 1;
   HEAP32[$1512 + 4 >> 2] = $nb_0 | 3;
   $mem_0 = $1512 + 8 | 0;
   return $mem_0 | 0;
  }
 } while (0);
 HEAP32[(___errno_location() | 0) >> 2] = 12;
 $mem_0 = 0;
 return $mem_0 | 0;
}
function _free($mem) {
 $mem = $mem | 0;
 var $3 = 0, $4 = 0, $5 = 0, $10 = 0, $11 = 0, $14 = 0, $15 = 0, $16 = 0, $21 = 0, $_sum3 = 0, $24 = 0, $25 = 0, $26 = 0, $32 = 0, $37 = 0, $40 = 0, $43 = 0, $64 = 0, $_pre_phi85 = 0, $69 = 0, $72 = 0, $75 = 0, $80 = 0, $84 = 0, $88 = 0, $94 = 0, $95 = 0, $99 = 0, $100 = 0, $RP_0 = 0, $R_0 = 0, $102 = 0, $103 = 0, $106 = 0, $107 = 0, $R_1 = 0, $119 = 0, $120 = 0, $133 = 0, $150 = 0, $163 = 0, $176 = 0, $psize_0 = 0, $p_0 = 0, $188 = 0, $192 = 0, $193 = 0, $203 = 0, $214 = 0, $221 = 0, $222 = 0, $227 = 0, $230 = 0, $233 = 0, $256 = 0, $_pre_phi83 = 0, $261 = 0, $264 = 0, $267 = 0, $272 = 0, $277 = 0, $281 = 0, $287 = 0, $288 = 0, $292 = 0, $293 = 0, $RP9_0 = 0, $R7_0 = 0, $295 = 0, $296 = 0, $299 = 0, $300 = 0, $R7_1 = 0, $313 = 0, $314 = 0, $327 = 0, $344 = 0, $357 = 0, $psize_1 = 0, $382 = 0, $385 = 0, $387 = 0, $388 = 0, $389 = 0, $395 = 0, $396 = 0, $_pre_phi = 0, $F16_0 = 0, $406 = 0, $407 = 0, $414 = 0, $415 = 0, $418 = 0, $420 = 0, $423 = 0, $428 = 0, $I18_0 = 0, $435 = 0, $439 = 0, $440 = 0, $449 = 0, $455 = 0, $K19_072 = 0, $T_071 = 0, $469 = 0, $470 = 0, $T_0_lcssa = 0, $481 = 0, $482 = 0, $484 = 0, $496 = 0, $sp_0_in_i = 0, $sp_0_i = 0;
 if (($mem | 0) == 0) {
  return;
 }
 $3 = $mem - 8 | 0;
 $4 = $3;
 $5 = HEAP32[42] | 0;
 if ($3 >>> 0 < $5 >>> 0) {
  _abort();
 }
 $10 = HEAP32[$mem - 4 >> 2] | 0;
 $11 = $10 & 3;
 if (($11 | 0) == 1) {
  _abort();
 }
 $14 = $10 & -8;
 $15 = $mem + ($14 - 8) | 0;
 $16 = $15;
 L10 : do {
  if (($10 & 1 | 0) == 0) {
   $21 = HEAP32[$3 >> 2] | 0;
   if (($11 | 0) == 0) {
    return;
   }
   $_sum3 = -8 - $21 | 0;
   $24 = $mem + $_sum3 | 0;
   $25 = $24;
   $26 = $21 + $14 | 0;
   if ($24 >>> 0 < $5 >>> 0) {
    _abort();
   }
   if (($25 | 0) == (HEAP32[43] | 0)) {
    $176 = $mem + ($14 - 4) | 0;
    if ((HEAP32[$176 >> 2] & 3 | 0) != 3) {
     $p_0 = $25;
     $psize_0 = $26;
     break;
    }
    HEAP32[40] = $26;
    HEAP32[$176 >> 2] = HEAP32[$176 >> 2] & -2;
    HEAP32[$mem + ($_sum3 + 4) >> 2] = $26 | 1;
    HEAP32[$15 >> 2] = $26;
    return;
   }
   $32 = $21 >>> 3;
   if ($21 >>> 0 < 256 >>> 0) {
    $37 = HEAP32[$mem + ($_sum3 + 8) >> 2] | 0;
    $40 = HEAP32[$mem + ($_sum3 + 12) >> 2] | 0;
    $43 = 192 + ($32 << 1 << 2) | 0;
    do {
     if (($37 | 0) != ($43 | 0)) {
      if ($37 >>> 0 < $5 >>> 0) {
       _abort();
      }
      if ((HEAP32[$37 + 12 >> 2] | 0) == ($25 | 0)) {
       break;
      }
      _abort();
     }
    } while (0);
    if (($40 | 0) == ($37 | 0)) {
     HEAP32[38] = HEAP32[38] & ~(1 << $32);
     $p_0 = $25;
     $psize_0 = $26;
     break;
    }
    do {
     if (($40 | 0) == ($43 | 0)) {
      $_pre_phi85 = $40 + 8 | 0;
     } else {
      if ($40 >>> 0 < $5 >>> 0) {
       _abort();
      }
      $64 = $40 + 8 | 0;
      if ((HEAP32[$64 >> 2] | 0) == ($25 | 0)) {
       $_pre_phi85 = $64;
       break;
      }
      _abort();
     }
    } while (0);
    HEAP32[$37 + 12 >> 2] = $40;
    HEAP32[$_pre_phi85 >> 2] = $37;
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
   $69 = $24;
   $72 = HEAP32[$mem + ($_sum3 + 24) >> 2] | 0;
   $75 = HEAP32[$mem + ($_sum3 + 12) >> 2] | 0;
   do {
    if (($75 | 0) == ($69 | 0)) {
     $94 = $mem + ($_sum3 + 20) | 0;
     $95 = HEAP32[$94 >> 2] | 0;
     if (($95 | 0) == 0) {
      $99 = $mem + ($_sum3 + 16) | 0;
      $100 = HEAP32[$99 >> 2] | 0;
      if (($100 | 0) == 0) {
       $R_1 = 0;
       break;
      } else {
       $R_0 = $100;
       $RP_0 = $99;
      }
     } else {
      $R_0 = $95;
      $RP_0 = $94;
     }
     while (1) {
      $102 = $R_0 + 20 | 0;
      $103 = HEAP32[$102 >> 2] | 0;
      if (($103 | 0) != 0) {
       $R_0 = $103;
       $RP_0 = $102;
       continue;
      }
      $106 = $R_0 + 16 | 0;
      $107 = HEAP32[$106 >> 2] | 0;
      if (($107 | 0) == 0) {
       break;
      } else {
       $R_0 = $107;
       $RP_0 = $106;
      }
     }
     if ($RP_0 >>> 0 < $5 >>> 0) {
      _abort();
     } else {
      HEAP32[$RP_0 >> 2] = 0;
      $R_1 = $R_0;
      break;
     }
    } else {
     $80 = HEAP32[$mem + ($_sum3 + 8) >> 2] | 0;
     if ($80 >>> 0 < $5 >>> 0) {
      _abort();
     }
     $84 = $80 + 12 | 0;
     if ((HEAP32[$84 >> 2] | 0) != ($69 | 0)) {
      _abort();
     }
     $88 = $75 + 8 | 0;
     if ((HEAP32[$88 >> 2] | 0) == ($69 | 0)) {
      HEAP32[$84 >> 2] = $75;
      HEAP32[$88 >> 2] = $80;
      $R_1 = $75;
      break;
     } else {
      _abort();
     }
    }
   } while (0);
   if (($72 | 0) == 0) {
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
   $119 = HEAP32[$mem + ($_sum3 + 28) >> 2] | 0;
   $120 = 456 + ($119 << 2) | 0;
   do {
    if (($69 | 0) == (HEAP32[$120 >> 2] | 0)) {
     HEAP32[$120 >> 2] = $R_1;
     if (($R_1 | 0) != 0) {
      break;
     }
     HEAP32[39] = HEAP32[39] & ~(1 << $119);
     $p_0 = $25;
     $psize_0 = $26;
     break L10;
    } else {
     if ($72 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
     }
     $133 = $72 + 16 | 0;
     if ((HEAP32[$133 >> 2] | 0) == ($69 | 0)) {
      HEAP32[$133 >> 2] = $R_1;
     } else {
      HEAP32[$72 + 20 >> 2] = $R_1;
     }
     if (($R_1 | 0) == 0) {
      $p_0 = $25;
      $psize_0 = $26;
      break L10;
     }
    }
   } while (0);
   if ($R_1 >>> 0 < (HEAP32[42] | 0) >>> 0) {
    _abort();
   }
   HEAP32[$R_1 + 24 >> 2] = $72;
   $150 = HEAP32[$mem + ($_sum3 + 16) >> 2] | 0;
   do {
    if (($150 | 0) != 0) {
     if ($150 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
     } else {
      HEAP32[$R_1 + 16 >> 2] = $150;
      HEAP32[$150 + 24 >> 2] = $R_1;
      break;
     }
    }
   } while (0);
   $163 = HEAP32[$mem + ($_sum3 + 20) >> 2] | 0;
   if (($163 | 0) == 0) {
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
   if ($163 >>> 0 < (HEAP32[42] | 0) >>> 0) {
    _abort();
   } else {
    HEAP32[$R_1 + 20 >> 2] = $163;
    HEAP32[$163 + 24 >> 2] = $R_1;
    $p_0 = $25;
    $psize_0 = $26;
    break;
   }
  } else {
   $p_0 = $4;
   $psize_0 = $14;
  }
 } while (0);
 $188 = $p_0;
 if (!($188 >>> 0 < $15 >>> 0)) {
  _abort();
 }
 $192 = $mem + ($14 - 4) | 0;
 $193 = HEAP32[$192 >> 2] | 0;
 if (($193 & 1 | 0) == 0) {
  _abort();
 }
 do {
  if (($193 & 2 | 0) == 0) {
   if (($16 | 0) == (HEAP32[44] | 0)) {
    $203 = (HEAP32[41] | 0) + $psize_0 | 0;
    HEAP32[41] = $203;
    HEAP32[44] = $p_0;
    HEAP32[$p_0 + 4 >> 2] = $203 | 1;
    if (($p_0 | 0) != (HEAP32[43] | 0)) {
     return;
    }
    HEAP32[43] = 0;
    HEAP32[40] = 0;
    return;
   }
   if (($16 | 0) == (HEAP32[43] | 0)) {
    $214 = (HEAP32[40] | 0) + $psize_0 | 0;
    HEAP32[40] = $214;
    HEAP32[43] = $p_0;
    HEAP32[$p_0 + 4 >> 2] = $214 | 1;
    HEAP32[$188 + $214 >> 2] = $214;
    return;
   }
   $221 = ($193 & -8) + $psize_0 | 0;
   $222 = $193 >>> 3;
   L112 : do {
    if ($193 >>> 0 < 256 >>> 0) {
     $227 = HEAP32[$mem + $14 >> 2] | 0;
     $230 = HEAP32[$mem + ($14 | 4) >> 2] | 0;
     $233 = 192 + ($222 << 1 << 2) | 0;
     do {
      if (($227 | 0) != ($233 | 0)) {
       if ($227 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
       }
       if ((HEAP32[$227 + 12 >> 2] | 0) == ($16 | 0)) {
        break;
       }
       _abort();
      }
     } while (0);
     if (($230 | 0) == ($227 | 0)) {
      HEAP32[38] = HEAP32[38] & ~(1 << $222);
      break;
     }
     do {
      if (($230 | 0) == ($233 | 0)) {
       $_pre_phi83 = $230 + 8 | 0;
      } else {
       if ($230 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
       }
       $256 = $230 + 8 | 0;
       if ((HEAP32[$256 >> 2] | 0) == ($16 | 0)) {
        $_pre_phi83 = $256;
        break;
       }
       _abort();
      }
     } while (0);
     HEAP32[$227 + 12 >> 2] = $230;
     HEAP32[$_pre_phi83 >> 2] = $227;
    } else {
     $261 = $15;
     $264 = HEAP32[$mem + ($14 + 16) >> 2] | 0;
     $267 = HEAP32[$mem + ($14 | 4) >> 2] | 0;
     do {
      if (($267 | 0) == ($261 | 0)) {
       $287 = $mem + ($14 + 12) | 0;
       $288 = HEAP32[$287 >> 2] | 0;
       if (($288 | 0) == 0) {
        $292 = $mem + ($14 + 8) | 0;
        $293 = HEAP32[$292 >> 2] | 0;
        if (($293 | 0) == 0) {
         $R7_1 = 0;
         break;
        } else {
         $R7_0 = $293;
         $RP9_0 = $292;
        }
       } else {
        $R7_0 = $288;
        $RP9_0 = $287;
       }
       while (1) {
        $295 = $R7_0 + 20 | 0;
        $296 = HEAP32[$295 >> 2] | 0;
        if (($296 | 0) != 0) {
         $R7_0 = $296;
         $RP9_0 = $295;
         continue;
        }
        $299 = $R7_0 + 16 | 0;
        $300 = HEAP32[$299 >> 2] | 0;
        if (($300 | 0) == 0) {
         break;
        } else {
         $R7_0 = $300;
         $RP9_0 = $299;
        }
       }
       if ($RP9_0 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
       } else {
        HEAP32[$RP9_0 >> 2] = 0;
        $R7_1 = $R7_0;
        break;
       }
      } else {
       $272 = HEAP32[$mem + $14 >> 2] | 0;
       if ($272 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
       }
       $277 = $272 + 12 | 0;
       if ((HEAP32[$277 >> 2] | 0) != ($261 | 0)) {
        _abort();
       }
       $281 = $267 + 8 | 0;
       if ((HEAP32[$281 >> 2] | 0) == ($261 | 0)) {
        HEAP32[$277 >> 2] = $267;
        HEAP32[$281 >> 2] = $272;
        $R7_1 = $267;
        break;
       } else {
        _abort();
       }
      }
     } while (0);
     if (($264 | 0) == 0) {
      break;
     }
     $313 = HEAP32[$mem + ($14 + 20) >> 2] | 0;
     $314 = 456 + ($313 << 2) | 0;
     do {
      if (($261 | 0) == (HEAP32[$314 >> 2] | 0)) {
       HEAP32[$314 >> 2] = $R7_1;
       if (($R7_1 | 0) != 0) {
        break;
       }
       HEAP32[39] = HEAP32[39] & ~(1 << $313);
       break L112;
      } else {
       if ($264 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
       }
       $327 = $264 + 16 | 0;
       if ((HEAP32[$327 >> 2] | 0) == ($261 | 0)) {
        HEAP32[$327 >> 2] = $R7_1;
       } else {
        HEAP32[$264 + 20 >> 2] = $R7_1;
       }
       if (($R7_1 | 0) == 0) {
        break L112;
       }
      }
     } while (0);
     if ($R7_1 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
     }
     HEAP32[$R7_1 + 24 >> 2] = $264;
     $344 = HEAP32[$mem + ($14 + 8) >> 2] | 0;
     do {
      if (($344 | 0) != 0) {
       if ($344 >>> 0 < (HEAP32[42] | 0) >>> 0) {
        _abort();
       } else {
        HEAP32[$R7_1 + 16 >> 2] = $344;
        HEAP32[$344 + 24 >> 2] = $R7_1;
        break;
       }
      }
     } while (0);
     $357 = HEAP32[$mem + ($14 + 12) >> 2] | 0;
     if (($357 | 0) == 0) {
      break;
     }
     if ($357 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
     } else {
      HEAP32[$R7_1 + 20 >> 2] = $357;
      HEAP32[$357 + 24 >> 2] = $R7_1;
      break;
     }
    }
   } while (0);
   HEAP32[$p_0 + 4 >> 2] = $221 | 1;
   HEAP32[$188 + $221 >> 2] = $221;
   if (($p_0 | 0) != (HEAP32[43] | 0)) {
    $psize_1 = $221;
    break;
   }
   HEAP32[40] = $221;
   return;
  } else {
   HEAP32[$192 >> 2] = $193 & -2;
   HEAP32[$p_0 + 4 >> 2] = $psize_0 | 1;
   HEAP32[$188 + $psize_0 >> 2] = $psize_0;
   $psize_1 = $psize_0;
  }
 } while (0);
 $382 = $psize_1 >>> 3;
 if ($psize_1 >>> 0 < 256 >>> 0) {
  $385 = $382 << 1;
  $387 = 192 + ($385 << 2) | 0;
  $388 = HEAP32[38] | 0;
  $389 = 1 << $382;
  do {
   if (($388 & $389 | 0) == 0) {
    HEAP32[38] = $388 | $389;
    $F16_0 = $387;
    $_pre_phi = 192 + ($385 + 2 << 2) | 0;
   } else {
    $395 = 192 + ($385 + 2 << 2) | 0;
    $396 = HEAP32[$395 >> 2] | 0;
    if (!($396 >>> 0 < (HEAP32[42] | 0) >>> 0)) {
     $F16_0 = $396;
     $_pre_phi = $395;
     break;
    }
    _abort();
   }
  } while (0);
  HEAP32[$_pre_phi >> 2] = $p_0;
  HEAP32[$F16_0 + 12 >> 2] = $p_0;
  HEAP32[$p_0 + 8 >> 2] = $F16_0;
  HEAP32[$p_0 + 12 >> 2] = $387;
  return;
 }
 $406 = $p_0;
 $407 = $psize_1 >>> 8;
 do {
  if (($407 | 0) == 0) {
   $I18_0 = 0;
  } else {
   if ($psize_1 >>> 0 > 16777215 >>> 0) {
    $I18_0 = 31;
    break;
   }
   $414 = ($407 + 1048320 | 0) >>> 16 & 8;
   $415 = $407 << $414;
   $418 = ($415 + 520192 | 0) >>> 16 & 4;
   $420 = $415 << $418;
   $423 = ($420 + 245760 | 0) >>> 16 & 2;
   $428 = 14 - ($418 | $414 | $423) + ($420 << $423 >>> 15) | 0;
   $I18_0 = $psize_1 >>> (($428 + 7 | 0) >>> 0) & 1 | $428 << 1;
  }
 } while (0);
 $435 = 456 + ($I18_0 << 2) | 0;
 HEAP32[$p_0 + 28 >> 2] = $I18_0;
 HEAP32[$p_0 + 20 >> 2] = 0;
 HEAP32[$p_0 + 16 >> 2] = 0;
 $439 = HEAP32[39] | 0;
 $440 = 1 << $I18_0;
 L199 : do {
  if (($439 & $440 | 0) == 0) {
   HEAP32[39] = $439 | $440;
   HEAP32[$435 >> 2] = $406;
   HEAP32[$p_0 + 24 >> 2] = $435;
   HEAP32[$p_0 + 12 >> 2] = $p_0;
   HEAP32[$p_0 + 8 >> 2] = $p_0;
  } else {
   $449 = HEAP32[$435 >> 2] | 0;
   if (($I18_0 | 0) == 31) {
    $455 = 0;
   } else {
    $455 = 25 - ($I18_0 >>> 1) | 0;
   }
   L205 : do {
    if ((HEAP32[$449 + 4 >> 2] & -8 | 0) == ($psize_1 | 0)) {
     $T_0_lcssa = $449;
    } else {
     $T_071 = $449;
     $K19_072 = $psize_1 << $455;
     while (1) {
      $469 = $T_071 + 16 + ($K19_072 >>> 31 << 2) | 0;
      $470 = HEAP32[$469 >> 2] | 0;
      if (($470 | 0) == 0) {
       break;
      }
      if ((HEAP32[$470 + 4 >> 2] & -8 | 0) == ($psize_1 | 0)) {
       $T_0_lcssa = $470;
       break L205;
      } else {
       $T_071 = $470;
       $K19_072 = $K19_072 << 1;
      }
     }
     if ($469 >>> 0 < (HEAP32[42] | 0) >>> 0) {
      _abort();
     } else {
      HEAP32[$469 >> 2] = $406;
      HEAP32[$p_0 + 24 >> 2] = $T_071;
      HEAP32[$p_0 + 12 >> 2] = $p_0;
      HEAP32[$p_0 + 8 >> 2] = $p_0;
      break L199;
     }
    }
   } while (0);
   $481 = $T_0_lcssa + 8 | 0;
   $482 = HEAP32[$481 >> 2] | 0;
   $484 = HEAP32[42] | 0;
   if ($T_0_lcssa >>> 0 < $484 >>> 0) {
    _abort();
   }
   if ($482 >>> 0 < $484 >>> 0) {
    _abort();
   } else {
    HEAP32[$482 + 12 >> 2] = $406;
    HEAP32[$481 >> 2] = $406;
    HEAP32[$p_0 + 8 >> 2] = $482;
    HEAP32[$p_0 + 12 >> 2] = $T_0_lcssa;
    HEAP32[$p_0 + 24 >> 2] = 0;
    break;
   }
  }
 } while (0);
 $496 = (HEAP32[46] | 0) - 1 | 0;
 HEAP32[46] = $496;
 if (($496 | 0) == 0) {
  $sp_0_in_i = 608;
 } else {
  return;
 }
 while (1) {
  $sp_0_i = HEAP32[$sp_0_in_i >> 2] | 0;
  if (($sp_0_i | 0) == 0) {
   break;
  } else {
   $sp_0_in_i = $sp_0_i + 8 | 0;
  }
 }
 HEAP32[46] = -1;
 return;
}
function _FFT_2D($x, $N) {
 $x = $x | 0;
 $N = $N | 0;
 var $t_i1 = 0, $t_i = 0, $3 = 0, $4 = 0, $i_08 = 0, $13 = 0, $14 = 0, $15 = 0, $17 = 0, $19 = 0, $j_01_us_i = 0, $23 = 0, $24 = 0, $27 = 0, $30 = 0, $i_02_us_i = 0, $33 = 0, $i_17 = 0, $34 = 0, $35 = 0, $40 = 0, $42 = 0, $j_01_us_i3 = 0, $47 = 0, $48 = 0, $51 = 0, $54 = 0, $i_02_us_i4 = 0, $57 = 0, $58 = 0, $$etemp$4$0 = 0, $$etemp$4$1 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 $t_i1 = sp | 0;
 $t_i = sp + 16 | 0;
 $3 = _malloc($N << 2) | 0;
 $4 = ($N | 0) > 0;
 if ($4) {
  $i_08 = 0;
 } else {
  $58 = $t_i1;
  $$etemp$4$0 = 16;
  $$etemp$4$1 = 0;
  STACKTOP = sp;
  return $3 | 0;
 }
 do {
  HEAP32[$3 + ($i_08 << 2) >> 2] = _FFT_simple(HEAP32[$x + ($i_08 << 2) >> 2] | 0, $N) | 0;
  $i_08 = $i_08 + 1 | 0;
 } while (($i_08 | 0) < ($N | 0));
 $13 = $t_i;
 $14 = ($N | 0) / 2 | 0;
 $15 = ($N | 0) > 1;
 if ($15) {
  $i_02_us_i = 0;
  while (1) {
   $33 = $x + ($i_02_us_i << 2) | 0;
   $j_01_us_i = 0;
   do {
    $23 = (HEAP32[$33 >> 2] | 0) + ($j_01_us_i << 4) | 0;
    HEAP32[$13 >> 2] = HEAP32[$23 >> 2];
    HEAP32[$13 + 4 >> 2] = HEAP32[$23 + 4 >> 2];
    HEAP32[$13 + 8 >> 2] = HEAP32[$23 + 8 >> 2];
    HEAP32[$13 + 12 >> 2] = HEAP32[$23 + 12 >> 2];
    $24 = $x + ($j_01_us_i << 2) | 0;
    $27 = (HEAP32[$24 >> 2] | 0) + ($i_02_us_i << 4) | 0;
    HEAP32[$23 >> 2] = HEAP32[$27 >> 2];
    HEAP32[$23 + 4 >> 2] = HEAP32[$27 + 4 >> 2];
    HEAP32[$23 + 8 >> 2] = HEAP32[$27 + 8 >> 2];
    HEAP32[$23 + 12 >> 2] = HEAP32[$27 + 12 >> 2];
    $30 = (HEAP32[$24 >> 2] | 0) + ($i_02_us_i << 4) | 0;
    HEAP32[$30 >> 2] = HEAP32[$13 >> 2];
    HEAP32[$30 + 4 >> 2] = HEAP32[$13 + 4 >> 2];
    HEAP32[$30 + 8 >> 2] = HEAP32[$13 + 8 >> 2];
    HEAP32[$30 + 12 >> 2] = HEAP32[$13 + 12 >> 2];
    $j_01_us_i = $j_01_us_i + 1 | 0;
   } while (($j_01_us_i | 0) < ($14 | 0));
   $17 = $i_02_us_i + 1 | 0;
   if (($17 | 0) < ($14 | 0)) {
    $i_02_us_i = $17;
   } else {
    $19 = $15;
    break;
   }
  }
 } else {
  $19 = 0;
 }
 if ($4) {
  $i_17 = 0;
  do {
   $34 = $3 + ($i_17 << 2) | 0;
   $35 = HEAP32[$34 >> 2] | 0;
   HEAP32[$34 >> 2] = _FFT_simple($35, $N) | 0;
   _free($35);
   $i_17 = $i_17 + 1 | 0;
  } while (($i_17 | 0) < ($N | 0));
 }
 $40 = $t_i1;
 if ($19) {
  $i_02_us_i4 = 0;
 } else {
  $58 = $40;
  $$etemp$4$0 = 16;
  $$etemp$4$1 = 0;
  STACKTOP = sp;
  return $3 | 0;
 }
 while (1) {
  $57 = $x + ($i_02_us_i4 << 2) | 0;
  $j_01_us_i3 = 0;
  do {
   $47 = (HEAP32[$57 >> 2] | 0) + ($j_01_us_i3 << 4) | 0;
   HEAP32[$40 >> 2] = HEAP32[$47 >> 2];
   HEAP32[$40 + 4 >> 2] = HEAP32[$47 + 4 >> 2];
   HEAP32[$40 + 8 >> 2] = HEAP32[$47 + 8 >> 2];
   HEAP32[$40 + 12 >> 2] = HEAP32[$47 + 12 >> 2];
   $48 = $x + ($j_01_us_i3 << 2) | 0;
   $51 = (HEAP32[$48 >> 2] | 0) + ($i_02_us_i4 << 4) | 0;
   HEAP32[$47 >> 2] = HEAP32[$51 >> 2];
   HEAP32[$47 + 4 >> 2] = HEAP32[$51 + 4 >> 2];
   HEAP32[$47 + 8 >> 2] = HEAP32[$51 + 8 >> 2];
   HEAP32[$47 + 12 >> 2] = HEAP32[$51 + 12 >> 2];
   $54 = (HEAP32[$48 >> 2] | 0) + ($i_02_us_i4 << 4) | 0;
   HEAP32[$54 >> 2] = HEAP32[$40 >> 2];
   HEAP32[$54 + 4 >> 2] = HEAP32[$40 + 4 >> 2];
   HEAP32[$54 + 8 >> 2] = HEAP32[$40 + 8 >> 2];
   HEAP32[$54 + 12 >> 2] = HEAP32[$40 + 12 >> 2];
   $j_01_us_i3 = $j_01_us_i3 + 1 | 0;
  } while (($j_01_us_i3 | 0) < ($14 | 0));
  $42 = $i_02_us_i4 + 1 | 0;
  if (($42 | 0) < ($14 | 0)) {
   $i_02_us_i4 = $42;
  } else {
   $58 = $40;
   break;
  }
 }
 $$etemp$4$0 = 16;
 $$etemp$4$1 = 0;
 STACKTOP = sp;
 return $3 | 0;
}
function _FFT_simple($x, $N) {
 $x = $x | 0;
 $N = $N | 0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $6 = 0, $7 = 0, $10 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $k_05 = 0, $21 = 0, $23 = 0, $24 = 0, $28 = 0, $29 = 0, $32 = 0, $33 = 0, $34 = 0.0, $35 = 0, $36 = 0, $37 = 0, $k_12 = 0, $39 = 0, $43 = 0, $k_21 = 0, $48 = 0, $49 = 0, $50 = 0, $53 = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 $1 = sp | 0;
 $2 = sp + 16 | 0;
 $3 = sp + 32 | 0;
 $4 = sp + 48 | 0;
 $6 = _malloc($N << 4) | 0;
 $7 = $6;
 if (($N | 0) == 1) {
  $10 = $x;
  HEAP32[$6 >> 2] = HEAP32[$10 >> 2];
  HEAP32[$6 + 4 >> 2] = HEAP32[$10 + 4 >> 2];
  HEAP32[$6 + 8 >> 2] = HEAP32[$10 + 8 >> 2];
  HEAP32[$6 + 12 >> 2] = HEAP32[$10 + 12 >> 2];
  STACKTOP = sp;
  return $7 | 0;
 }
 $13 = $N << 3 & 2147483640;
 $14 = _malloc($13) | 0;
 $15 = $14;
 $16 = _malloc($13) | 0;
 $17 = $16;
 $18 = ($N | 0) / 2 | 0;
 $19 = ($N | 0) > 1;
 if ($19) {
  $k_05 = 0;
  do {
   $21 = $k_05 << 1;
   $23 = $15 + ($k_05 << 4) | 0;
   $24 = $x + ($21 << 4) | 0;
   HEAP32[$23 >> 2] = HEAP32[$24 >> 2];
   HEAP32[$23 + 4 >> 2] = HEAP32[$24 + 4 >> 2];
   HEAP32[$23 + 8 >> 2] = HEAP32[$24 + 8 >> 2];
   HEAP32[$23 + 12 >> 2] = HEAP32[$24 + 12 >> 2];
   $28 = $17 + ($k_05 << 4) | 0;
   $29 = $x + (($21 | 1) << 4) | 0;
   HEAP32[$28 >> 2] = HEAP32[$29 >> 2];
   HEAP32[$28 + 4 >> 2] = HEAP32[$29 + 4 >> 2];
   HEAP32[$28 + 8 >> 2] = HEAP32[$29 + 8 >> 2];
   HEAP32[$28 + 12 >> 2] = HEAP32[$29 + 12 >> 2];
   $k_05 = $k_05 + 1 | 0;
  } while (($k_05 | 0) < ($18 | 0));
 }
 $32 = _FFT_simple($15, $18) | 0;
 $33 = _FFT_simple($17, $18) | 0;
 do {
  if ($19) {
   $34 = +($N | 0);
   $35 = $2;
   $k_12 = 0;
   do {
    $39 = $33 + ($k_12 << 4) | 0;
    _complex_from_polar($1, 1.0, +($k_12 | 0) * -6.283185307179586 / $34);
    _complex_mult($2, $1, $39);
    $43 = $39;
    HEAP32[$43 >> 2] = HEAP32[$35 >> 2];
    HEAP32[$43 + 4 >> 2] = HEAP32[$35 + 4 >> 2];
    HEAP32[$43 + 8 >> 2] = HEAP32[$35 + 8 >> 2];
    HEAP32[$43 + 12 >> 2] = HEAP32[$35 + 12 >> 2];
    $k_12 = $k_12 + 1 | 0;
   } while (($k_12 | 0) < ($18 | 0));
   if (!$19) {
    break;
   }
   $36 = $3;
   $37 = $4;
   $k_21 = 0;
   do {
    $48 = $32 + ($k_21 << 4) | 0;
    $49 = $33 + ($k_21 << 4) | 0;
    _complex_add($3, $48, $49);
    $50 = $7 + ($k_21 << 4) | 0;
    HEAP32[$50 >> 2] = HEAP32[$36 >> 2];
    HEAP32[$50 + 4 >> 2] = HEAP32[$36 + 4 >> 2];
    HEAP32[$50 + 8 >> 2] = HEAP32[$36 + 8 >> 2];
    HEAP32[$50 + 12 >> 2] = HEAP32[$36 + 12 >> 2];
    _complex_sub($4, $48, $49);
    $53 = $7 + ($k_21 + $18 << 4) | 0;
    HEAP32[$53 >> 2] = HEAP32[$37 >> 2];
    HEAP32[$53 + 4 >> 2] = HEAP32[$37 + 4 >> 2];
    HEAP32[$53 + 8 >> 2] = HEAP32[$37 + 8 >> 2];
    HEAP32[$53 + 12 >> 2] = HEAP32[$37 + 12 >> 2];
    $k_21 = $k_21 + 1 | 0;
   } while (($k_21 | 0) < ($18 | 0));
  }
 } while (0);
 _free($14);
 _free($16);
 _free($33);
 _free($32);
 STACKTOP = sp;
 return $7 | 0;
}
function _main() {
 var $sw = 0, $1 = 0, $2 = 0, $i_01_i = 0, $20 = 0.0, $22 = 0, $23 = 0, $i_05 = 0, $26 = 0, $i_01_i1 = 0, $48 = 0.0, $i_14 = 0, tempVarArgs = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 $sw = sp | 0;
 $1 = _malloc(16384) | 0;
 $2 = $1;
 $i_01_i = 0;
 do {
  HEAPF64[$2 + ($i_01_i << 4) >> 3] = +(_rand() | 0) * 4.656612873077393e-10 * 2.0 + -1.0;
  HEAPF64[$2 + ($i_01_i << 4) + 8 >> 3] = +(_rand() | 0) * 4.656612873077393e-10 * 2.0 + -1.0;
  $i_01_i = $i_01_i + 1 | 0;
 } while (($i_01_i | 0) < 1024);
 _stopwatch_start($sw);
 _FFT_simple($2, 1024) | 0;
 _stopwatch_stop($sw);
 $20 = +_get_interval_by_sec($sw);
 _printf(72, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 16 | 0, HEAP32[tempVarArgs >> 2] = 1024, HEAPF64[tempVarArgs + 8 >> 3] = $20, tempVarArgs) | 0) | 0;
 STACKTOP = tempVarArgs;
 $22 = _malloc(4096) | 0;
 $23 = $22;
 $i_05 = 0;
 do {
  $26 = _malloc(16384) | 0;
  $i_01_i1 = 0;
  do {
   HEAPF64[$26 + ($i_01_i1 << 4) >> 3] = +(_rand() | 0) * 4.656612873077393e-10 * 2.0 + -1.0;
   HEAPF64[$26 + ($i_01_i1 << 4) + 8 >> 3] = +(_rand() | 0) * 4.656612873077393e-10 * 2.0 + -1.0;
   $i_01_i1 = $i_01_i1 + 1 | 0;
  } while (($i_01_i1 | 0) < 1024);
  HEAP32[$23 + ($i_05 << 2) >> 2] = $26;
  $i_05 = $i_05 + 1 | 0;
 } while (($i_05 | 0) < 1024);
 _stopwatch_start($sw);
 _FFT_2D($23, 1024) | 0;
 _stopwatch_stop($sw);
 $48 = +_get_interval_by_sec($sw);
 _printf(8, (tempVarArgs = STACKTOP, STACKTOP = STACKTOP + 24 | 0, HEAP32[tempVarArgs >> 2] = 1024, HEAP32[tempVarArgs + 8 >> 2] = 1024, HEAPF64[tempVarArgs + 16 >> 3] = $48, tempVarArgs) | 0) | 0;
 STACKTOP = tempVarArgs;
 _free($1);
 $i_14 = 0;
 do {
  _free(HEAP32[$23 + ($i_14 << 2) >> 2] | 0);
  $i_14 = $i_14 + 1 | 0;
 } while (($i_14 | 0) < 1024);
 _free($22);
 STACKTOP = sp;
 return 0;
}
function _complex_mult($agg_result, $left, $right) {
 $agg_result = $agg_result | 0;
 $left = $left | 0;
 $right = $right | 0;
 var $2 = 0.0, $4 = 0.0, $7 = 0.0, $9 = 0.0, tempParam = 0, sp = 0;
 sp = STACKTOP;
 tempParam = $left;
 $left = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[$left >> 2] = HEAP32[tempParam >> 2];
 HEAP32[$left + 4 >> 2] = HEAP32[tempParam + 4 >> 2];
 HEAP32[$left + 8 >> 2] = HEAP32[tempParam + 8 >> 2];
 HEAP32[$left + 12 >> 2] = HEAP32[tempParam + 12 >> 2];
 tempParam = $right;
 $right = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[$right >> 2] = HEAP32[tempParam >> 2];
 HEAP32[$right + 4 >> 2] = HEAP32[tempParam + 4 >> 2];
 HEAP32[$right + 8 >> 2] = HEAP32[tempParam + 8 >> 2];
 HEAP32[$right + 12 >> 2] = HEAP32[tempParam + 12 >> 2];
 $2 = +HEAPF64[$left >> 3];
 $4 = +HEAPF64[$right >> 3];
 $7 = +HEAPF64[$left + 8 >> 3];
 $9 = +HEAPF64[$right + 8 >> 3];
 HEAPF64[$agg_result >> 3] = $2 * $4 - $7 * $9;
 HEAPF64[$agg_result + 8 >> 3] = $4 * $7 + $2 * $9;
 STACKTOP = sp;
 return;
}
function _complex_sub($agg_result, $left, $right) {
 $agg_result = $agg_result | 0;
 $left = $left | 0;
 $right = $right | 0;
 var $10 = 0.0, tempParam = 0, sp = 0;
 sp = STACKTOP;
 tempParam = $left;
 $left = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[$left >> 2] = HEAP32[tempParam >> 2];
 HEAP32[$left + 4 >> 2] = HEAP32[tempParam + 4 >> 2];
 HEAP32[$left + 8 >> 2] = HEAP32[tempParam + 8 >> 2];
 HEAP32[$left + 12 >> 2] = HEAP32[tempParam + 12 >> 2];
 tempParam = $right;
 $right = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[$right >> 2] = HEAP32[tempParam >> 2];
 HEAP32[$right + 4 >> 2] = HEAP32[tempParam + 4 >> 2];
 HEAP32[$right + 8 >> 2] = HEAP32[tempParam + 8 >> 2];
 HEAP32[$right + 12 >> 2] = HEAP32[tempParam + 12 >> 2];
 $10 = +HEAPF64[$left + 8 >> 3] - +HEAPF64[$right + 8 >> 3];
 HEAPF64[$agg_result >> 3] = +HEAPF64[$left >> 3] - +HEAPF64[$right >> 3];
 HEAPF64[$agg_result + 8 >> 3] = $10;
 STACKTOP = sp;
 return;
}
function _complex_add($agg_result, $left, $right) {
 $agg_result = $agg_result | 0;
 $left = $left | 0;
 $right = $right | 0;
 var $10 = 0.0, tempParam = 0, sp = 0;
 sp = STACKTOP;
 tempParam = $left;
 $left = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[$left >> 2] = HEAP32[tempParam >> 2];
 HEAP32[$left + 4 >> 2] = HEAP32[tempParam + 4 >> 2];
 HEAP32[$left + 8 >> 2] = HEAP32[tempParam + 8 >> 2];
 HEAP32[$left + 12 >> 2] = HEAP32[tempParam + 12 >> 2];
 tempParam = $right;
 $right = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[$right >> 2] = HEAP32[tempParam >> 2];
 HEAP32[$right + 4 >> 2] = HEAP32[tempParam + 4 >> 2];
 HEAP32[$right + 8 >> 2] = HEAP32[tempParam + 8 >> 2];
 HEAP32[$right + 12 >> 2] = HEAP32[tempParam + 12 >> 2];
 $10 = +HEAPF64[$left + 8 >> 3] + +HEAPF64[$right + 8 >> 3];
 HEAPF64[$agg_result >> 3] = +HEAPF64[$left >> 3] + +HEAPF64[$right >> 3];
 HEAPF64[$agg_result + 8 >> 3] = $10;
 STACKTOP = sp;
 return;
}
function _memcpy(dest, src, num) {
 dest = dest | 0;
 src = src | 0;
 num = num | 0;
 var ret = 0;
 if ((num | 0) >= 4096) return _emscripten_memcpy_big(dest | 0, src | 0, num | 0) | 0;
 ret = dest | 0;
 if ((dest & 3) == (src & 3)) {
  while (dest & 3) {
   if ((num | 0) == 0) return ret | 0;
   HEAP8[dest] = HEAP8[src] | 0;
   dest = dest + 1 | 0;
   src = src + 1 | 0;
   num = num - 1 | 0;
  }
  while ((num | 0) >= 4) {
   HEAP32[dest >> 2] = HEAP32[src >> 2];
   dest = dest + 4 | 0;
   src = src + 4 | 0;
   num = num - 4 | 0;
  }
 }
 while ((num | 0) > 0) {
  HEAP8[dest] = HEAP8[src] | 0;
  dest = dest + 1 | 0;
  src = src + 1 | 0;
  num = num - 1 | 0;
 }
 return ret | 0;
}
function _memset(ptr, value, num) {
 ptr = ptr | 0;
 value = value | 0;
 num = num | 0;
 var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
 stop = ptr + num | 0;
 if ((num | 0) >= 20) {
  value = value & 255;
  unaligned = ptr & 3;
  value4 = value | value << 8 | value << 16 | value << 24;
  stop4 = stop & ~3;
  if (unaligned) {
   unaligned = ptr + 4 - unaligned | 0;
   while ((ptr | 0) < (unaligned | 0)) {
    HEAP8[ptr] = value;
    ptr = ptr + 1 | 0;
   }
  }
  while ((ptr | 0) < (stop4 | 0)) {
   HEAP32[ptr >> 2] = value4;
   ptr = ptr + 4 | 0;
  }
 }
 while ((ptr | 0) < (stop | 0)) {
  HEAP8[ptr] = value;
  ptr = ptr + 1 | 0;
 }
 return ptr - num | 0;
}
function copyTempDouble(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0];
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0];
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0];
 HEAP8[tempDoublePtr + 4 | 0] = HEAP8[ptr + 4 | 0];
 HEAP8[tempDoublePtr + 5 | 0] = HEAP8[ptr + 5 | 0];
 HEAP8[tempDoublePtr + 6 | 0] = HEAP8[ptr + 6 | 0];
 HEAP8[tempDoublePtr + 7 | 0] = HEAP8[ptr + 7 | 0];
}
function _complex_from_polar($agg_result, $r, $theta_radians) {
 $agg_result = $agg_result | 0;
 $r = +$r;
 $theta_radians = +$theta_radians;
 var $4 = 0.0;
 $4 = +Math_sin($theta_radians) * $r;
 HEAPF64[$agg_result >> 3] = +Math_cos($theta_radians) * $r;
 HEAPF64[$agg_result + 8 >> 3] = $4;
 return;
}
function _get_interval_by_sec($sw) {
 $sw = $sw | 0;
 var $_0 = 0.0;
 if (($sw | 0) == 0) {
  $_0 = 0.0;
  return +$_0;
 }
 $_0 = +((HEAP32[$sw + 8 >> 2] | 0) - (HEAP32[$sw >> 2] | 0) | 0) + +((HEAP32[$sw + 12 >> 2] | 0) - (HEAP32[$sw + 4 >> 2] | 0) | 0) / 1.0e6;
 return +$_0;
}
function copyTempFloat(ptr) {
 ptr = ptr | 0;
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1 | 0] = HEAP8[ptr + 1 | 0];
 HEAP8[tempDoublePtr + 2 | 0] = HEAP8[ptr + 2 | 0];
 HEAP8[tempDoublePtr + 3 | 0] = HEAP8[ptr + 3 | 0];
}
function _rand_r(seedp) {
 seedp = seedp | 0;
 var val = 0;
 val = (Math_imul(HEAP32[seedp >> 2] | 0, 31010991) | 0) + 1735287159 & 2147483647;
 HEAP32[seedp >> 2] = val;
 return val | 0;
}
function stackAlloc(size) {
 size = size | 0;
 var ret = 0;
 ret = STACKTOP;
 STACKTOP = STACKTOP + size | 0;
 STACKTOP = STACKTOP + 7 & -8;
 return ret | 0;
}
function _stopwatch_start($sw) {
 $sw = $sw | 0;
 if (($sw | 0) == 0) {
  return;
 }
 _memset($sw | 0, 0, 16) | 0;
 _gettimeofday($sw | 0, 0) | 0;
 return;
}
function setThrew(threw, value) {
 threw = threw | 0;
 value = value | 0;
 if ((__THREW__ | 0) == 0) {
  __THREW__ = threw;
  threwValue = value;
 }
}
function dynCall_iii(index, a1, a2) {
 index = index | 0;
 a1 = a1 | 0;
 a2 = a2 | 0;
 return FUNCTION_TABLE_iii[index & 1](a1 | 0, a2 | 0) | 0;
}
function _strlen(ptr) {
 ptr = ptr | 0;
 var curr = 0;
 curr = ptr;
 while (HEAP8[curr] | 0) {
  curr = curr + 1 | 0;
 }
 return curr - ptr | 0;
}
function _stopwatch_stop($sw) {
 $sw = $sw | 0;
 if (($sw | 0) == 0) {
  return;
 }
 _gettimeofday($sw + 8 | 0, 0) | 0;
 return;
}
function dynCall_ii(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 return FUNCTION_TABLE_ii[index & 1](a1 | 0) | 0;
}
function dynCall_vi(index, a1) {
 index = index | 0;
 a1 = a1 | 0;
 FUNCTION_TABLE_vi[index & 1](a1 | 0);
}
function dynCall_v(index) {
 index = index | 0;
 FUNCTION_TABLE_v[index & 1]();
}
function b2(p0, p1) {
 p0 = p0 | 0;
 p1 = p1 | 0;
 abort(2);
 return 0;
}
function setTempRet9(value) {
 value = value | 0;
 tempRet9 = value;
}
function setTempRet8(value) {
 value = value | 0;
 tempRet8 = value;
}
function setTempRet7(value) {
 value = value | 0;
 tempRet7 = value;
}
function setTempRet6(value) {
 value = value | 0;
 tempRet6 = value;
}
function setTempRet5(value) {
 value = value | 0;
 tempRet5 = value;
}
function setTempRet4(value) {
 value = value | 0;
 tempRet4 = value;
}
function setTempRet3(value) {
 value = value | 0;
 tempRet3 = value;
}
function setTempRet2(value) {
 value = value | 0;
 tempRet2 = value;
}
function setTempRet1(value) {
 value = value | 0;
 tempRet1 = value;
}
function setTempRet0(value) {
 value = value | 0;
 tempRet0 = value;
}
function stackRestore(top) {
 top = top | 0;
 STACKTOP = top;
}
function b0(p0) {
 p0 = p0 | 0;
 abort(0);
 return 0;
}
function _rand() {
 return _rand_r(___rand_seed) | 0;
}
function stackSave() {
 return STACKTOP | 0;
}
function b3(p0) {
 p0 = p0 | 0;
 abort(3);
}
function b1() {
 abort(1);
}
function runPostSets() {
}

// EMSCRIPTEN_END_FUNCS
  var FUNCTION_TABLE_ii = [b0,b0];
  
  var FUNCTION_TABLE_v = [b1,b1];
  
  var FUNCTION_TABLE_iii = [b2,b2];
  
  var FUNCTION_TABLE_vi = [b3,b3];
  

  return { _strlen: _strlen, _free: _free, _main: _main, _rand_r: _rand_r, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, _rand: _rand, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, setTempRet1: setTempRet1, setTempRet2: setTempRet2, setTempRet3: setTempRet3, setTempRet4: setTempRet4, setTempRet5: setTempRet5, setTempRet6: setTempRet6, setTempRet7: setTempRet7, setTempRet8: setTempRet8, setTempRet9: setTempRet9, dynCall_ii: dynCall_ii, dynCall_v: dynCall_v, dynCall_iii: dynCall_iii, dynCall_vi: dynCall_vi };
})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_vi": invoke_vi, "_llvm_lifetime_end": _llvm_lifetime_end, "_sysconf": _sysconf, "_abort": _abort, "_fprintf": _fprintf, "_printf": _printf, "_fflush": _fflush, "__reallyNegative": __reallyNegative, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_write": _write, "_sin": _sin, "__formatString": __formatString, "_gettimeofday": _gettimeofday, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_fileno": _fileno, "_cos": _cos, "_pwrite": _pwrite, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_llvm_lifetime_start": _llvm_lifetime_start, "_mkport": _mkport, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "___rand_seed": ___rand_seed, "NaN": NaN, "Infinity": Infinity }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _rand_r = Module["_rand_r"] = asm["_rand_r"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _rand = Module["_rand"] = asm["_rand"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






