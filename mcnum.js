var mn = (typeof exports === "undefined") ? (exports = {}) : (exports);
if (typeof global !== "undefined") {
    global.mn = exports;
}
exports.double = {}
exports.int = {};
exports.types = [];
exports.private = {};
exports.private.flatten = function _flatten_array(arr) {
    return [].concat.apply([], arr);
};
exports.private.getNextIndex = function _getNextIndex(i, current, shape, stride) {
    i = i | 0;
    var l = shape.length | 0;
    while ((--l) >= 0 && (++current[l] >= shape[l])) {
        i -= (--current[l] * stride[l]) | 0;
        current[l] = 0;
    }
    if (l < 0) {
        return -1;
    }
    return i + stride[l];
};
exports.private.transposeDimension = function _transposeStride_exports(obj, dim1, dim2) {
    var i = 0,
        l = obj.length,
        newDim = Array.apply([], obj);
    dim1 = dim1 | 0;
    dim2 = dim2 | 0 || 1;
    if (l === 1) {
        newDim = [1, obj[0]];
        l = 2;
    }
    if (dim1 < l && dim2 < l) {
        var t = newDim[dim1];
        newDim[dim1] = newDim[dim2];
        newDim[dim2] = t;
    }
    return newDim;
};
var I32A = Int32Array;
(function() {
    exports.types.push(Int32Array.name);
    I32A.prototype.STRIDED = false;
    I32A.prototype.map = function I32Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Int32Array = function Int32ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 4];
                length = stride || ((data.byteLength - offsetReal) / 4);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 4) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 4);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new I32A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function I32AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Int32Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Int32Array(size);
        } else {
            obj = new Int32Array(size, shape);
        }
        return obj;
    };

    function I32AReshape(shape) {
        return new Int32Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function I32ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Int32Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(I32A.prototype, "clone", {
        __proto__: null,
        value: I32AClone
    });
    Object.defineProperty(I32A.prototype, "reshape", {
        __proto__: null,
        value: I32AReshape
    });
    Object.defineProperty(I32A.prototype, "slice", {
        __proto__: null,
        value: I32ASlice
    });
    Object.defineProperty(I32A.prototype, "class", {
        __proto__: null,
        value: Int32Array
    });
}());
var I16A = Int16Array;
(function() {
    exports.types.push(Int16Array.name);
    I16A.prototype.STRIDED = false;
    I16A.prototype.map = function I16Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Int16Array = function Int16ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 2];
                length = stride || ((data.byteLength - offsetReal) / 2);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 2) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 2);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new I16A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function I16AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Int16Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Int16Array(size);
        } else {
            obj = new Int16Array(size, shape);
        }
        return obj;
    };

    function I16AReshape(shape) {
        return new Int16Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function I16ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Int16Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(I16A.prototype, "clone", {
        __proto__: null,
        value: I16AClone
    });
    Object.defineProperty(I16A.prototype, "reshape", {
        __proto__: null,
        value: I16AReshape
    });
    Object.defineProperty(I16A.prototype, "slice", {
        __proto__: null,
        value: I16ASlice
    });
    Object.defineProperty(I16A.prototype, "class", {
        __proto__: null,
        value: Int16Array
    });
}());
var I8A = Int8Array;
(function() {
    exports.types.push(Int8Array.name);
    I8A.prototype.STRIDED = false;
    I8A.prototype.map = function I8Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Int8Array = function Int8ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 1];
                length = stride || ((data.byteLength - offsetReal) / 1);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 1) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 1);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new I8A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function I8AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Int8Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Int8Array(size);
        } else {
            obj = new Int8Array(size, shape);
        }
        return obj;
    };

    function I8AReshape(shape) {
        return new Int8Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function I8ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Int8Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(I8A.prototype, "clone", {
        __proto__: null,
        value: I8AClone
    });
    Object.defineProperty(I8A.prototype, "reshape", {
        __proto__: null,
        value: I8AReshape
    });
    Object.defineProperty(I8A.prototype, "slice", {
        __proto__: null,
        value: I8ASlice
    });
    Object.defineProperty(I8A.prototype, "class", {
        __proto__: null,
        value: Int8Array
    });
}());
var UI32A = Uint32Array;
(function() {
    exports.types.push(Uint32Array.name);
    UI32A.prototype.STRIDED = false;
    UI32A.prototype.map = function UI32Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Uint32Array = function Uint32ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 4];
                length = stride || ((data.byteLength - offsetReal) / 4);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 4) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 4);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new UI32A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function UI32AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Uint32Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Uint32Array(size);
        } else {
            obj = new Uint32Array(size, shape);
        }
        return obj;
    };

    function UI32AReshape(shape) {
        return new Uint32Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function UI32ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Uint32Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(UI32A.prototype, "clone", {
        __proto__: null,
        value: UI32AClone
    });
    Object.defineProperty(UI32A.prototype, "reshape", {
        __proto__: null,
        value: UI32AReshape
    });
    Object.defineProperty(UI32A.prototype, "slice", {
        __proto__: null,
        value: UI32ASlice
    });
    Object.defineProperty(UI32A.prototype, "class", {
        __proto__: null,
        value: Uint32Array
    });
}());
var UI16A = Uint16Array;
(function() {
    exports.types.push(Uint16Array.name);
    UI16A.prototype.STRIDED = false;
    UI16A.prototype.map = function UI16Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Uint16Array = function Uint16ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 2];
                length = stride || ((data.byteLength - offsetReal) / 2);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 2) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 2);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new UI16A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function UI16AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Uint16Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Uint16Array(size);
        } else {
            obj = new Uint16Array(size, shape);
        }
        return obj;
    };

    function UI16AReshape(shape) {
        return new Uint16Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function UI16ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Uint16Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(UI16A.prototype, "clone", {
        __proto__: null,
        value: UI16AClone
    });
    Object.defineProperty(UI16A.prototype, "reshape", {
        __proto__: null,
        value: UI16AReshape
    });
    Object.defineProperty(UI16A.prototype, "slice", {
        __proto__: null,
        value: UI16ASlice
    });
    Object.defineProperty(UI16A.prototype, "class", {
        __proto__: null,
        value: Uint16Array
    });
}());
var UI8A = Uint8Array;
(function() {
    exports.types.push(Uint8Array.name);
    UI8A.prototype.STRIDED = false;
    UI8A.prototype.map = function UI8Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Uint8Array = function Uint8ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 1];
                length = stride || ((data.byteLength - offsetReal) / 1);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 1) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 1);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new UI8A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function UI8AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Uint8Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Uint8Array(size);
        } else {
            obj = new Uint8Array(size, shape);
        }
        return obj;
    };

    function UI8AReshape(shape) {
        return new Uint8Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function UI8ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Uint8Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(UI8A.prototype, "clone", {
        __proto__: null,
        value: UI8AClone
    });
    Object.defineProperty(UI8A.prototype, "reshape", {
        __proto__: null,
        value: UI8AReshape
    });
    Object.defineProperty(UI8A.prototype, "slice", {
        __proto__: null,
        value: UI8ASlice
    });
    Object.defineProperty(UI8A.prototype, "class", {
        __proto__: null,
        value: Uint8Array
    });
}());
var UI8CA = Uint8ClampedArray;
(function() {
    exports.types.push(Uint8ClampedArray.name);
    UI8CA.prototype.STRIDED = false;
    UI8CA.prototype.map = function UI8CAmap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Uint8ClampedArray = function Uint8ClampedArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 1];
                length = stride || ((data.byteLength - offsetReal) / 1);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 1) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 1);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new UI8CA(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function UI8CAClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Uint8ClampedArray(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Uint8ClampedArray(size);
        } else {
            obj = new Uint8ClampedArray(size, shape);
        }
        return obj;
    };

    function UI8CAReshape(shape) {
        return new Uint8ClampedArray(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function UI8CASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Uint8ClampedArray(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(UI8CA.prototype, "clone", {
        __proto__: null,
        value: UI8CAClone
    });
    Object.defineProperty(UI8CA.prototype, "reshape", {
        __proto__: null,
        value: UI8CAReshape
    });
    Object.defineProperty(UI8CA.prototype, "slice", {
        __proto__: null,
        value: UI8CASlice
    });
    Object.defineProperty(UI8CA.prototype, "class", {
        __proto__: null,
        value: Uint8ClampedArray
    });
}());
var F32A = Float32Array;
(function() {
    exports.types.push(Float32Array.name);
    F32A.prototype.STRIDED = false;
    F32A.prototype.map = function F32Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Float32Array = function Float32ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 4];
                length = stride || ((data.byteLength - offsetReal) / 4);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 4) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 4);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new F32A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function F32AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Float32Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Float32Array(size);
        } else {
            obj = new Float32Array(size, shape);
        }
        return obj;
    };

    function F32AReshape(shape) {
        return new Float32Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function F32ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Float32Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(F32A.prototype, "clone", {
        __proto__: null,
        value: F32AClone
    });
    Object.defineProperty(F32A.prototype, "reshape", {
        __proto__: null,
        value: F32AReshape
    });
    Object.defineProperty(F32A.prototype, "slice", {
        __proto__: null,
        value: F32ASlice
    });
    Object.defineProperty(F32A.prototype, "class", {
        __proto__: null,
        value: Float32Array
    });
}());
var F64A = Float64Array;
(function() {
    exports.types.push(Float64Array.name);
    F64A.prototype.STRIDED = false;
    F64A.prototype.map = function F64Amap(callback) {
        var shape = this.shape,
            stride = this.stride,
            i = this.offset | 0,
            current = new I32A(shape.length);
        if (!this.STRIDED) {
            for (; i < this.size; i++ | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        } else {
            for (; i > -1; i = exports.private.getNextIndex(i, current, shape, stride) | 0) {
                this[i] = callback.call(this[i], this[i], current, this) || this[i];
            }
        }
        return this;
    };
    Float64Array = function Float64ArrayConstruct(data, shape, stride, offset, length, byteOffset) {
        offset = offset | 0;
        length = length | 0;
        var obj, i = 0,
            size = 1,
            d = 0,
            offsetReal = 0;
        if (data.constructor.name === "ArrayBuffer") {
            if (!shape || !shape.length) {
                offsetReal = shape >>> 0;
                shape = stride ? [stride] : [(data.byteLength - offsetReal) / 8];
                length = stride || ((data.byteLength - offsetReal) / 8);
                stride = [1];
                offset = 0;
            } else if (!stride || !stride.length) {
                offsetReal = (stride * 8) >>> 0;
                length = offset || ((data.byteLength - offsetReal) / 8);
                offset = 0;
            } else {
                offsetReal = byteOffset | 0;
            }
        } else if (data.length && data[0].length) {
            shape = [data.length | 0];
            while (data[0].length) {
                shape.push(data[0].length | 0);
                data = exports.private.flatten(data);
            }
        }
        obj = new F64A(data, offsetReal, length);
        if (!shape || !shape.length) {
            if (!data.shape || !data.shape.length) {
                shape = [obj.length];
            } else {
                shape = data.shape;
            }
        }
        d = shape.length;
        if (!stride || !stride.length) {
            stride = new Array(d);
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                stride[i] = size;
                size *= shape[i];
            }
        } else {
            for (i = (d - 1) | 0; i >= 0;
                (--i) | 0) {
                size *= shape[i];
            }
        }
        var indexArg = [],
            code = "(this.offset|0)";
        for (i = 0; i < d;
            (i++) | 0) {
            code = code + "+" + stride[i] + "*(i" + i + "|0)";
            indexArg.push("i" + i);
        }
        var index = new Function(indexArg, "return " + code + ";");
        var get = new Function(indexArg, "return this[" + code + "];");
        var set = new Function(indexArg, "value", "this[" + code + "] = value;");
        Object.defineProperty(obj, "shape", {
            __proto__: null,
            value: new I32A(shape)
        });
        Object.defineProperty(obj, "stride", {
            __proto__: null,
            value: new I32A(stride)
        });
        Object.defineProperty(obj, "offset", {
            __proto__: null,
            value: (offset | 0)
        });
        Object.defineProperty(obj, "size", {
            __proto__: null,
            value: (size | 0)
        });
        Object.defineProperty(obj, "index", {
            __proto__: null,
            value: index
        });
        Object.defineProperty(obj, "get", {
            __proto__: null,
            value: get
        });
        Object.defineProperty(obj, "set", {
            __proto__: null,
            value: set
        });
        return obj;
    };

    function F64AClone(size, shape) {
        var obj;
        if (!size) {
            obj = new Float64Array(this, this.shape, this.stride, this.offset);
            obj.STRIDED = this.STRIDED;
        } else if (!shape.length) {
            obj = new Float64Array(size);
        } else {
            obj = new Float64Array(size, shape);
        }
        return obj;
    };

    function F64AReshape(shape) {
        return new Float64Array(this.buffer, shape, 0, this.offset, this.length, this.byteOffset);
    };

    function F64ASlice(lower, upper) {
        var i = 0,
            l = this.shape.length,
            off = this.offset;
        for (i = 0; i < l;
            (++i) | 0) {
            if (upper[i] | 0 < 0) {
                upper[i] = this.shape[i];
            }
            if (lower[i] | 0 >= 0) {
                var temp = lower[i] | 0;
                off += (this.stride[i] * temp) | 0;
                lower[i] = (upper[i] - temp) | 0;
            }
        }
        var obj = new Float64Array(this.buffer, lower, 0, off, this.length, this.byteOffset);
        obj.STRIDED = true;
        return obj;
    };
    Object.defineProperty(F64A.prototype, "clone", {
        __proto__: null,
        value: F64AClone
    });
    Object.defineProperty(F64A.prototype, "reshape", {
        __proto__: null,
        value: F64AReshape
    });
    Object.defineProperty(F64A.prototype, "slice", {
        __proto__: null,
        value: F64ASlice
    });
    Object.defineProperty(F64A.prototype, "class", {
        __proto__: null,
        value: Float64Array
    });
}());
exports.zeros = function zeros(dimension, className) {
    className = className || Float64Array;
    var mul = 1;
    if (!dimension) {
        return 0;
    }
    if (!dimension.length) {
        mul = dimension | 0;
        dimension = [mul];
    } else {
        var l = dimension.length | 0;
        mul = 1;
        for (var i = 0;
            (i < l) | 0;
            (++i) | 0) {
            mul = (mul * dimension[i]) | 0;
        }
    }
    return new className(mul, dimension);
}
exports.ones = function ones(dimension, className) {
    className = className || Float64Array;
    var mul = 1,
        obj;
    if (!dimension) {
        return 1;
    }
    if (!dimension.length) {
        mul = dimension | 0;
        dimension = [mul];
    } else {
        var l = dimension.length | 0;
        mul = 1;
        for (var i = 0;
            (i < l) | 0;
            (++i) | 0) {
            mul = (mul * dimension[i]) | 0;
        }
    }
    obj = new className(mul, dimension);
    for (var i = 0; i < mul;
        (i++) | 0) {
        obj[i] = 1;
    }
    return obj;
}
exports.rand = function rand(dimension, className) {
    className = className || Float64Array;
    var mul = 1,
        obj;
    if (!dimension) {
        return Math.random();
    }
    if (!dimension.length) {
        mul = dimension | 0;
        dimension = [mul];
    } else {
        var l = dimension.length | 0;
        mul = 1;
        for (var i = 0;
            (i < l) | 0;
            (++i) | 0) {
            mul = (mul * dimension[i]) | 0;
        }
    }
    obj = new className(mul, dimension);
    for (var i = 0; i < mul;
        (i++) | 0) {
        obj[i] = Math.random();
    }
    return obj;
}
exports.linspace = function linspace(start, stop, n, className) {
    start = +start;
    stop = +stop;
    n = n | 0;
    className = className || Float64Array;
    if (n < 1) n = 100;
    if (n == 1) {
        return new className([start], [1], [1], 0);
    }
    step = (stop - start) / (+(n - 1));
    return exports.private.allocateRange(start, stop, step, n, className);
}
exports.range = function range(start, stop, step, className) {
    start = +start;
    stop = +stop;
    className = className || Float64Array;
    if (!step) {
        step = stop < start ? -1 : 1;
    }
    step = +step;
    var n = ~~Math.floor((stop - start + (step < 0 ? -1 : 1)) / step);
    if (n <= 1) {
        return new className([start], [1], [1], 0);
    }
    return exports.private.allocateRange(start, stop, step, n, className);
}
exports.identity = function identity(n, className) {
    n = +n;
    className = className || Float64Array;
    var i = 0,
        obj = new className(n * n, [n, n], [n, 1]);
    for (; i < n; i++) {
        obj[i * n + i] = 1;
    }
    return obj;
}
exports.private.allocateRange = function _allocateRange(start, stop, step, n, className) {
    start = +start;
    stop = +stop;
    step = +step, n = n | 0;
    var obj = new className(n, [n], [1], 0);
    for (var i = 0; i < n;
        (i++) | 0) {
        obj[i] = start;
        start += step;
    }
    return obj;
}
exports.fill = function fill(obj, val) {
    val = +val;
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v, i, obj) {
            obj[i] = val;
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = val;
        }
    }
    return obj;
};
exports.negate = function negate(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v, i, obj) {
            obj[i] = -1 * obj[i];
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = -1 * obj[i];
        }
    }
    return obj;
};
exports.sin = function sin(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.sinV(obj);
    } else {
        obj = +Math.sin(obj);
    }
    return obj;
};
exports.sinV = function sinV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.sin(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.sin(obj[i]);
        }
    }
    return obj;
};
exports.cos = function cos(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.cosV(obj);
    } else {
        obj = +Math.cos(obj);
    }
    return obj;
};
exports.cosV = function cosV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.cos(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.cos(obj[i]);
        }
    }
    return obj;
};
exports.abs = function abs(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.absV(obj);
    } else {
        obj = +Math.abs(obj);
    }
    return obj;
};
exports.absV = function absV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.abs(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.abs(obj[i]);
        }
    }
    return obj;
};
exports.sqrt = function sqrt(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.sqrtV(obj);
    } else {
        obj = +Math.sqrt(obj);
    }
    return obj;
};
exports.sqrtV = function sqrtV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.sqrt(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.sqrt(obj[i]);
        }
    }
    return obj;
};
exports.exp = function exp(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.expV(obj);
    } else {
        obj = +Math.exp(obj);
    }
    return obj;
};
exports.expV = function expV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.exp(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.exp(obj[i]);
        }
    }
    return obj;
};
exports.ceil = function ceil(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.ceilV(obj);
    } else {
        obj = +Math.ceil(obj);
    }
    return obj;
};
exports.ceilV = function ceilV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.ceil(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.ceil(obj[i]);
        }
    }
    return obj;
};
exports.floor = function floor(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.floorV(obj);
    } else {
        obj = +Math.floor(obj);
    }
    return obj;
};
exports.floorV = function floorV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.floor(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.floor(obj[i]);
        }
    }
    return obj;
};
exports.round = function round(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n > 0) {
        exports.roundV(obj);
    } else {
        obj = +Math.round(obj);
    }
    return obj;
};
exports.roundV = function roundV(obj) {
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v) {
            return +Math.round(v);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            obj[i] = +Math.round(obj[i]);
        }
    }
    return obj;
};
exports.sum = function sum(obj) {
    var s = 0;
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v, i, obj) {
            s += obj[i];
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            s += obj[i];
        }
    }
    return s;
};
exports.average = function average(obj) {
    var s = 0;
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v, i, obj) {
            s += obj[i];
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            s += obj[i];
        }
    }
    return (s / n);
};
exports.norm2 = function norm2(obj) {
    var s = 0;
    var i = 0,
        n = obj.length | 0;
    if (n !== obj.size) {
        obj.map(function(v, i, obj) {
            s += (obj[i] * obj[i]);
        });
    } else {
        for (var i = 0; i < n;
            (i++) | 0) {
            s += (obj[i] * obj[i]);
        }
    }
    return (+Math.sqrt(s));
};
exports.transpose = function transpose(obj, dim1, dim2) {
    var newShape = exports.private.transposeDimension(obj.shape, dim1, dim2),
        newStride = exports.private.transposeDimension(obj.stride, dim1, dim2);
    var ret = new obj.class(obj.buffer, newShape, newStride, obj.offset, obj.length, obj.byteOffset);
    ret.STRIDED = true;
    return ret;
};
exports.add = function add(obj1, obj2, out) {
    var t = "add";
    t += obj1.size ? "V" : "S";
    t += obj2.size ? "V" : "S";
    return exports[t](obj1, obj2, out);
};
exports.addSS = function addSS(a, b, out) {
    a = +a;
    b = +b;
    out = +(a + b);
    return out;
};
exports.addSV = function addSV(s, obj, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = s + obj[i];
    };
    return out;;
};
exports.addVS = function addVS(obj, s, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = obj[i] + s;
    };
    return out;;
};
exports.addVV = function addVV(obj1, obj2, out) {
    var shape1 = obj1.shape[0],
        shape2 = obj1.shape[1],
        i = 0,
        size = obj1.size | 0;
    if (!out || size != out.size) {
        out = obj1.clone(size, obj1.shape);
    }
    for (var i = 0; i < size;
        (i++) | 0) {
        out[i] = (obj1[i] | 0) + (obj2[i] | 0);
    }
    return out;
};
exports.addeq = function addeq(obj1, obj2) {
    return exports.add(obj1, obj2, obj1);
};
exports.subtract = function subtract(obj1, obj2, out) {
    var t = "subtract";
    t += obj1.size ? "V" : "S";
    t += obj2.size ? "V" : "S";
    return exports[t](obj1, obj2, out);
};
exports.subtractSS = function subtractSS(a, b, out) {
    a = +a;
    b = +b;
    out = +(a - b);
    return out;
};
exports.subtractSV = function subtractSV(s, obj, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = s - obj[i];
    };
    return out;;
};
exports.subtractVS = function subtractVS(obj, s, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = obj[i] - s;
    };
    return out;;
};
exports.subtractVV = function subtractVV(obj1, obj2, out) {
    var shape1 = obj1.shape[0],
        shape2 = obj1.shape[1],
        i = 0,
        size = obj1.size | 0;
    if (!out || size != out.size) {
        out = obj1.clone(size, obj1.shape);
    }
    for (var i = 0; i < size;
        (i++) | 0) {
        out[i] = (obj1[i] | 0) - (obj2[i] | 0);
    }
    return out;
};
exports.subtracteq = function subtracteq(obj1, obj2) {
    return exports.subtract(obj1, obj2, obj1);
};
exports.dot = function dot(obj1, obj2, out) {
    var t = "dot";
    t += obj1.size ? "V" : "S";
    t += obj2.size ? "V" : "S";
    return exports[t](obj1, obj2, out);
};
exports.dotSS = function dotSS(a, b, out) {
    a = +a;
    b = +b;
    out = +(a * b);
    return out;
};
exports.dotSV = function dotSV(s, obj, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = s * obj[i];
    };
    return out;;
};
exports.dotVS = function dotVS(obj, s, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = obj[i] * s;
    };
    return out;;
};
exports.dotVV = function dotVV(obj1, obj2, out) {
    var shape1 = obj1.shape[0],
        shape2 = obj1.shape[1],
        i = 0,
        size = obj1.size | 0;
    if (!out || size != out.size) {
        out = obj1.clone(size, obj1.shape);
    }
    for (var i = 0; i < size;
        (i++) | 0) {
        out[i] = (obj1[i] | 0) * (obj2[i] | 0);
    }
    return out;
};
exports.doteq = function doteq(obj1, obj2) {
    return exports.dot(obj1, obj2, obj1);
};
exports.divide = function divide(obj1, obj2, out) {
    var t = "divide";
    t += obj1.size ? "V" : "S";
    t += obj2.size ? "V" : "S";
    return exports[t](obj1, obj2, out);
};
exports.divideSS = function divideSS(a, b, out) {
    a = +a;
    b = +b;
    out = +(a / b);
    return out;
};
exports.divideSV = function divideSV(s, obj, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = s / obj[i];
    };
    return out;;
};
exports.divideVS = function divideVS(obj, s, out) {
    s = +s;
    var i = 0,
        l = obj.length;
    if (!out || obj.size != out.size) {
        out = obj.clone();
    }
    for (var i = 0; i < l;
        (i++) | 0) {
        out[i] = obj[i] / s;
    };
    return out;;
};
exports.divideVV = function divideVV(obj1, obj2, out) {
    var shape1 = obj1.shape[0],
        shape2 = obj1.shape[1],
        i = 0,
        size = obj1.size | 0;
    if (!out || size != out.size) {
        out = obj1.clone(size, obj1.shape);
    }
    for (var i = 0; i < size;
        (i++) | 0) {
        out[i] = (obj1[i] | 0) / (obj2[i] | 0);
    }
    return out;
};
exports.divideeq = function divideeq(obj1, obj2) {
    return exports.divide(obj1, obj2, obj1);
};