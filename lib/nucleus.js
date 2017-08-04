/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2015 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

;

var UUID = {
	v4: function() {
		var chars = '0123456789abcdef'.split('');

		var uuid = [], rnd = Math.random, r;
		uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		uuid[14] = '4'; // version 4

		for (var i = 0; i < 36; i++) {
			if (!uuid[i]) {
				r = 0 | rnd()*16;
				uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r & 0xf];
			}
		}

		return uuid.join('');
	}
};
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/
/*
 * $Id: base64.js,v 2.12 2013/05/06 07:54:20 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *    http://opensource.org/licenses/mit-license
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */

(function(global) {
    'use strict';
    // existing version for noConflict()
    var _Base64 = global.Base64;
    var version = "2.1.4";
    // if node.js, we use Buffer
    var buffer;
    if (typeof module !== 'undefined' && module.exports) {
        buffer = require('buffer').Buffer;
    }
    // constants
    var b64chars
        = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var b64tab = function(bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
    }(b64chars);
    var fromCharCode = String.fromCharCode;
    // encoder stuff
    var cb_utob = function(c) {
        if (c.length < 2) {
            var cc = c.charCodeAt(0);
            return cc < 0x80 ? c
                : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
                                + fromCharCode(0x80 | (cc & 0x3f)))
                : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                   + fromCharCode(0x80 | ( cc         & 0x3f)));
        } else {
            var cc = 0x10000
                + (c.charCodeAt(0) - 0xD800) * 0x400
                + (c.charCodeAt(1) - 0xDC00);
            return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
                    + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
                    + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
                    + fromCharCode(0x80 | ( cc         & 0x3f)));
        }
    };
    var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var utob = function(u) {
        return u.replace(re_utob, cb_utob);
    };
    var cb_encode = function(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
            b64chars.charAt( ord >>> 18),
            b64chars.charAt((ord >>> 12) & 63),
            padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
            padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
        return chars.join('');
    };
    var btoa = global.btoa ? function(b) {
        return global.btoa(b);
    } : function(b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
    };
    var _encode = buffer
        ? function (u) { return (new buffer(u)).toString('base64') } 
    : function (u) { return btoa(utob(u)) }
    ;
    var encode = function(u, urisafe) {
        return !urisafe 
            ? _encode(u)
            : _encode(u).replace(/[+\/]/g, function(m0) {
                return m0 == '+' ? '-' : '_';
            }).replace(/=/g, '');
    };
    var encodeURI = function(u) { return encode(u, true) };
    // decoder stuff
    var re_btou = new RegExp([
        '[\xC0-\xDF][\x80-\xBF]',
        '[\xE0-\xEF][\x80-\xBF]{2}',
        '[\xF0-\xF7][\x80-\xBF]{3}'
    ].join('|'), 'g');
    var cb_btou = function(cccc) {
        switch(cccc.length) {
        case 4:
            var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
                |    ((0x3f & cccc.charCodeAt(1)) << 12)
                |    ((0x3f & cccc.charCodeAt(2)) <<  6)
                |     (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
            return (fromCharCode((offset  >>> 10) + 0xD800)
                    + fromCharCode((offset & 0x3FF) + 0xDC00));
        case 3:
            return fromCharCode(
                ((0x0f & cccc.charCodeAt(0)) << 12)
                    | ((0x3f & cccc.charCodeAt(1)) << 6)
                    |  (0x3f & cccc.charCodeAt(2))
            );
        default:
            return  fromCharCode(
                ((0x1f & cccc.charCodeAt(0)) << 6)
                    |  (0x3f & cccc.charCodeAt(1))
            );
        }
    };
    var btou = function(b) {
        return b.replace(re_btou, cb_btou);
    };
    var cb_decode = function(cccc) {
        var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
        chars = [
            fromCharCode( n >>> 16),
            fromCharCode((n >>>  8) & 0xff),
            fromCharCode( n         & 0xff)
        ];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
    };
    var atob = global.atob ? function(a) {
        return global.atob(a);
    } : function(a){
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
    };
    var _decode = buffer
        ? function(a) { return (new buffer(a, 'base64')).toString() }
    : function(a) { return btou(atob(a)) };
    var decode = function(a){
        return _decode(
            a.replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
                .replace(/[^A-Za-z0-9\+\/]/g, '')
        );
    };
    var noConflict = function() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
    };
    // export Base64
    global.Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict
    };
    // if ES5 is available, make Base64.extendString() available
    if (typeof Object.defineProperty === 'function') {
        var noEnum = function(v){
            return {value:v,enumerable:false,writable:true,configurable:true};
        };
        global.Base64.extendString = function () {
            Object.defineProperty(
                String.prototype, 'fromBase64', noEnum(function () {
                    return decode(this)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64', noEnum(function (urisafe) {
                    return encode(this, urisafe)
                }));
            Object.defineProperty(
                String.prototype, 'toBase64URI', noEnum(function () {
                    return encode(this, true)
                }));
        };
    }
    // that's it!
})(this);
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

function argumentNames(fn) {
	var names = fn.toString().match(/^[\s\(]*function[^(]*\(([^\)]*)\)/)[1].replace(/\s+/g, '').split(',');
	return names.length == 1 && !names[0] ? [] : names;
}

/**
 * 对象类实用函数。
 */
function Class(baseClass, prop) {
	// 只接受一个参数的情况 - Class(prop)
	if (typeof (baseClass) === "object") {
		prop = baseClass;
		baseClass = null;
	}

	// 本次调用所创建的类（构造函数）
	function F() {
		// 如果父类存在，则实例对象的baseprototype指向父类的原型
		// 这里提供了在实例对象中调用父类方法的途径
		if (baseClass) {
			this.baseprototype = baseClass.prototype;
		}
		this.ctor.apply(this, arguments);
	}

	// 如果此类需要从其它类扩展
	if (baseClass) {
		var middleClass = function() {};
		middleClass.prototype = baseClass.prototype;
		F.prototype = new middleClass();
		F.prototype.constructor = F;
	}

	// 覆盖父类的同名函数
	for (var name in prop) {
		if (prop.hasOwnProperty(name)) {
			// 如果此类继承自父类baseClass并且父类原型中存在同名函数name
			if (baseClass
				&& typeof (prop[name]) === "function"
				&& argumentNames(prop[name])[0] === "$super") {
				// 重定义子类的原型方法prop[name]
				// - 比如$super封装了父类方法的调用，但是调用时的上下文指针要指向当前子类的实例对象
				// - 将$super作为方法调用的第一个参数
				F.prototype[name] = (function(name, fn) {
					return function() {
						var that = this;
						$super = function() {
							return baseClass.prototype[name].apply(that, arguments);
						};
						return fn.apply(this, Array.prototype.concat.apply($super, arguments));
					};
				})(name, prop[name]);
			}
			else {
				F.prototype[name] = prop[name];
			}
		}
	}

	return F;
};
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * HashMap 封装。
 */
function HashMap() {
	// 定义长度
	var length = 0;
	// 创建一个对象
	var obj = new Object();

	/**
	 * 判断 Map 是否为空
	 */
	this.isEmpty = function() {
		 return length == 0;
	};
	
	/**
	 * 判断对象中是否包含给定 Key
	 */
	this.containsKey = function(key) {
		return (key in obj);
	};

	/**
	 * 判断对象中是否包含给定的 Value
	 */
	this.containsValue = function(value) {
		for (var key in obj) {
			if (obj[key] == value) {
				return true;
			}
		}
		return false;
	};

	/**
	 * 向 Map 中添加数据
	 */
	this.put = function(key, value) {
		if (!this.containsKey(key)) {
			length++;
		}
		obj[key] = value;
	};

	/**
	 * 根据给定的 Key 获得 Value
	 */
	this.get = function(key) {
		return this.containsKey(key) ? obj[key] : null;
	};

	/**
	 * 根据给定的 Key 删除一个值
	 */
	this.remove = function(key) {
		if (this.containsKey(key) && (delete obj[key])) {
			length--;
		}
	};

	/**
	 * 获得 Map 中的所有 Value
	 */
	this.values = function() {
		var _values = new Array();
		for (var key in obj) {
			_values.push(obj[key]);
		}
		return _values;
	};

	/**
	 * 获得 Map 中的所有 Key
	 */
	this.keySet = function() {
		var _keys = new Array();
		for (var key in obj) {
			_keys.push(key);
		}
		return _keys;
	};

	/**
	 * 获得 Map 的长度
	 */
	this.size = function() {
		return length;
	};

	/**
	 * 清空 Map
	 */
	this.clear = function() {
		length = 0;
		obj = new Object();
	};
}
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 实用函数库。
 *
 * @author Xu Jiangwei
 */
var Utils = {
	/** 简单加密操作。密钥长度为 8 位。
	 */
	simpleEncrypt: function(aPlaintext, aKey) {
		var plaintext = [];
		for (var i = 0; i < aPlaintext.length; ++i) {
			plaintext.push(aPlaintext.charCodeAt(i) - 256);
		}
		var key = [];
		for (var i = 0; i < aKey.length; ++i) {
			key.push(aKey.charCodeAt(i) - 256);
		}

		if (key.length != 8)
			return null;

		// 运算密钥
		var keyCode = 11 + key[0];
		keyCode -= key[1];
		keyCode += key[2];
		keyCode -= key[3];
		keyCode += key[4];
		keyCode -= key[5];
		keyCode += key[6];
		keyCode -= key[7];

		// 评价
		var cc = (keyCode % 8);
		var parity = (((keyCode % 2) == 0) ? 2 : 1);

		var length = plaintext.length;
		var out = new Array();

		for (var i = 0; i < length; ++i) {
			var c = (plaintext[i] ^ parity);
			var v = (c ^ cc);
			if (v < 0) {
				v += 256;
			}
			out[i] = v;
		}

		return out;
	},

	/** 简单解密操作。密钥长度为 8 位。
	 */
	simpleDecrypt: function(aCiphertext, aKey) {
		var ciphertext = [];
		for (var i = 0; i < aCiphertext.length; ++i) {
			ciphertext.push(aCiphertext.charCodeAt(i) - 256);
		}
		var key = [];
		for (var i = 0; i < aKey.length; ++i) {
			key.push(aKey.charCodeAt(i) - 256);
		}

		if (key.length != 8)
			return null;

		// 运算密钥
		var keyCode = 11 + key[0];
		keyCode -= key[1];
		keyCode += key[2];
		keyCode -= key[3];
		keyCode += key[4];
		keyCode -= key[5];
		keyCode += key[6];
		keyCode -= key[7];

		// 评价
		var cc = (keyCode % 8);
		var parity = (((keyCode % 2) == 0) ? 2 : 1);

		var length = ciphertext.length;
		var out = new Array();

		for (var i = 0; i < length; ++i) {
			var c = (ciphertext[i] ^ cc);
			var v = (c ^ parity);
			if (v < 0) {
				v += 256;
			}
			out[i] = v;
		}

		return out;
	}
};
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * HTTP 方法
 */
var HttpMethod = {
	// GET
	GET: "GET",

	// POST
	POST: "POST"
};

var HttpErrorCode = {
	// 网络错误
	NETWORK_FAILED: 1000,
	// 访问状态错误
	STATUS_ERROR: 1100
};

/**
 * AJAX 响应数据封装。
 * @author Jiangwei Xu
 */
var AjaxResponse = Class({
	ctor: function(status, data) {
		this.status = status;
		this.data = data;
	},

	getStatus: function() {
		return this.status;
	},

	getData: function() {
		return this.data;
	}
});

/**
 * AJAX 请求操作封装。
 * @author Jiangwei Xu
 */
var AjaxRequest = Class({
	ctor: function(xmlhttp, url) {
		this._xmlhttp = xmlhttp;
		this._url = url;
		this._method = "GET";
		this._headers = null;
		this._content = null;
	},

	method: function(value) {
		this._method = value;
		return this;
	},

	header: function(name, value) {
		if (null == this._headers)
			this._headers = new HashMap();

		this._headers.put(name, value);
		return this;
	},

	content: function(value) {
		this._content = value;
		return this;
	},

	send: function(responseCallback) {
		// 打开 AJAX 请求
		this._xmlhttp.open(this._method, this._url, true);

		var params;
		//如果content是JSON对象, 即把content转换成表单类型以POST传输
		if (null != this._content && typeof this._content == "object") {
			for (var item in this._content) {
				if (params == null) {
					params = item + '=' + encodeURIComponent(this._content[item]);
				}
				else {
					params += '&' + item + '=' + encodeURIComponent(this._content[item]);
				}
			}
			this._xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
		}
		else {
			params = this._content;
			this._xmlhttp.setRequestHeader("Content-Type", "application/json");
		}

		// 处理请求头数据
		if (null != this._headers) {
			var keySet = this._headers.keySet();
			for (var i = 0; i < keySet.length; ++i) {
				var key = keySet[i];
				var value = this._headers.get(key);
				// 设置请求头
				this._xmlhttp.setRequestHeader(key, value);
			}
		}

		if (undefined !== responseCallback) {
			var _xh = this._xmlhttp;
			_xh.onreadystatechange = function() {
				if (_xh.readyState == 4) {
					var reponse = new AjaxResponse(_xh.status, _xh.responseText);
					responseCallback.call(null, reponse);
				}
			};
		}

		// 发送请求
		if (null == params) {
			this._xmlhttp.send();
		}
		else {
			this._xmlhttp.send(params);
		}
	}
});


/**
 * AJAX 跨域访问。
 */
var AjaxCrossDomainRequest = Class({
	ctor: function(address, port) {
		this._address = address;
		this._port = port;
		this._uri = "";
		this._method = "GET";
		this._cookie = null;
		this._headers = null;
		this._content = null;
		this._error = null;
		this._errorContext = null;

		this._protocol = (window.location.protocol.toLowerCase().indexOf("https") >= 0) ? "https://" : "http://";

		// 请求数据是否完成
		this._completed = false;

		// 时间戳
		this._timestamp = new Date();
	},

	uri: function(value) {
		this._uri = value;
		return this;
	},

	method: function(value) {
		this._method = value;
		return this;
	},

	content: function(value) {
		this._content = value;
		return this;
	},

	cookie: function(value) {
		this._cookie = value;
		return this;
	},

	error: function(value, ctx) {
		this._error = value;
		this._errorContext = (ctx !== undefined) ? ctx : null;
		return this;
	},

	send: function(responseCallback) {
		AjaxController.execute(this, responseCallback);
		return this;
	},

	_execute: function(responseCallback) {
		var time = this._timestamp.getTime();
		var param = ["?u=", this._uri, "&m=", this._method, "&c=_cc_ajax_cb"
			, "&t=", time];

		// 添加 Content
		if (this._content != null) {
			var jsonstr = null;
			if (typeof this._content == "string") {
				jsonstr = this._content;
			}
			else {
				jsonstr = JSON.stringify(this._content);
			}
			// 添加 Body 数据
			param.push("&b=", escape(jsonstr));
		}

		// 添加 Cookie
		if (this._cookie != null) {
			param.push("&_cookie=", escape(this._cookie));
		}
		// URL
		var src = this._protocol + this._address + ":" + this._port + "/cccd.js" + param.join("");

		var self = this;

		if (undefined !== responseCallback) {
			_cc_ajax_map.put(time, {request:self, callback:responseCallback});
		}

		var scriptDom = document.getElementById("cccd");
		if (scriptDom != null) {
			document.body.removeChild(scriptDom);
			scriptDom = null;
		}
		if (null == scriptDom) {
			scriptDom = document.createElement("script");
			scriptDom.setAttribute("type", "text/javascript");
			scriptDom.setAttribute("id", "cccd");

			if (scriptDom.addEventListener) {
				scriptDom.addEventListener("error", function(e) { self._onError(e); }, false);
				scriptDom.addEventListener("load", function(e) { self._onLoad(e); }, false);
			}
			else if (scriptDom.attachEvent) {
				scriptDom.attachEvent("onerror", function(e) { self._onError(e); });
				scriptDom.attachEvent("onload", function(e) { self._onLoad(e); });
			}

			scriptDom.src = src;
			document.body.appendChild(scriptDom);
		}

		return this;
	},

	_onLoad: function(e) {
		AjaxController.notifyCompleted(this);
	},
	_onError: function(e) {
		if (null != this._error) {
			if (e !== undefined) {
				this._error.call(this._errorContext, this, HttpErrorCode.NETWORK_FAILED);
			}
			else {
				this._error.call(this._errorContext, this, HttpErrorCode.STATUS_ERROR);
			}
		}

		// 标记为完成
		this._completed = true;
		// 清理 Map
		_cc_ajax_map.remove(this._timestamp.getTime());

		AjaxController.notifyCompleted(this);
	}
});

// Key : timestamp, Value : {request, callback}
var _cc_ajax_map = new HashMap();
var _cc_ajax_cb = function(time, response, cookie) {
	if (undefined !== cookie) {
		// 新 Cookie
		Logger.i("Ajax", "default ajax callback, cookie: " + cookie);
	}
	else {
		// 没有新 Cookie
		//Logger.i("Ajax", "default ajax callback, no cookie");
	}

	var obj = _cc_ajax_map.get(time);
	if (null != obj) {
		var r = obj.request;
		var cb = obj.callback;

		cb.call(null, response, cookie);
		_cc_ajax_map.remove(time);

		// 标记为完成
		r._completed = true;

		AjaxController.notifyCompleted(r);
	}
};

/**
 * 跨域请求数据中心。
 */
var AjaxController = {
	timer: 0,
	lastRequest: null,
	requestQueue: [],
	callbackQueue: [],

	// 浏览器完成事件调用的“完成”通知
	notifyCompleted: function(request) {
		// TODO
	},

	execute: function(request, responseCallback) {
		this.requestQueue.push(request);
		this.callbackQueue.push(responseCallback);
	}
};
// 启动定时器
AjaxController.timer = setInterval(function() {
	var requestQueue = AjaxController.requestQueue;
	if (requestQueue.length > 0) {
		var callbackQueue = AjaxController.callbackQueue;

		// 根据上一次请求判断
		if (null != AjaxController.lastRequest) {
			// 判断是否完成
			if (AjaxController.lastRequest._completed) {
				// 出队
				var r = requestQueue.shift();
				var cb = callbackQueue.shift();

				AjaxController.lastRequest = r;

				// 执行
				r._execute(cb);
			}
		}
		else {
			// 出队
			var r = requestQueue.shift();
			var cb = callbackQueue.shift();

			AjaxController.lastRequest = r;

			// 执行
			r._execute(cb);
		}
	}
}, 500);

/**
 * AJAX
 */
var Ajax = {
	newRequest: function(url) {
		var xmlhttp = null;
		if (window.XMLHttpRequest) {
			// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp = new XMLHttpRequest();
		}
		else {
			// code for IE6, IE5
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}

		var request = new AjaxRequest(xmlhttp, url);
		return request;
	},

	newCrossDomain: function(address, port) {
		var request = new AjaxCrossDomainRequest(address, port);
		return request;
	}
};
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 网络地址描述类。
 * 
 * @author Jiangwei Xu
 */
var InetAddress = Class({
	ctor: function(address, port) {
		this.address = address;
		this.port = port;
	},

	getAddress: function() {
		return this.address;
	},

	getPort: function() {
		return this.port;
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

if (undefined === window.console) {
	window.console = {
		error: function() {
		},
		warn: function() {
		},
		info: function() {
		},
		log: function() {
		}
	};
}
else {
	if (undefined === window.console.error) {
		window.console.error = window.console.log;
	}
	if (undefined === window.console.warn) {
		window.console.warn = window.console.log;
	}
	if (undefined === window.console.info) {
		window.console.info = window.console.log;
	}
}

var Logger = {
	// 是否激活
	enabled: true,

	d: function(tag, text) {
		if (!Logger.enabled) {
			return;
		}

		window.console.log(Logger._printTime() + " [DEBUG] " + tag + " - " + text);
	},

	i: function(tag, text) {
		if (!Logger.enabled) {
			return;
		}

		window.console.info(Logger._printTime() + " [INFO]  " + tag + " - " + text);
	},

	w: function(tag, text) {
		if (!Logger.enabled) {
			return;
		}

		window.console.warn(Logger._printTime() + " [WARN]  " + tag + " - " + text);
	},

	e: function(tag, text) {
		if (!Logger.enabled) {
			return;
		}

		window.console.error(Logger._printTime() + " [ERROR] " + tag + " - " + text);
	},

	_printTime: function() {
		var date = new Date();
		var ret = [date.getHours(), ":", date.getMinutes(), ":", date.getSeconds(), ".", date.getMilliseconds()];
		date = null;
		return ret.join('');
	}
};
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 系统服务定义。
 * @author Jiangwei Xu
 */
var Service = Class({
	ctor: function() {
	},

	startup: function() {
		return false;
	},

	shutdown: function() {
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 语素类型。
 * @author Jiangwei Xu
 */
var StuffType = {
	/** 主语 */
	SUBJECT: 1,
	/** 谓语 */
	PREDICATE: 2,
	/** 宾语 */
	OBJECTIVE: 3,
	/** 定语 */
	ATTRIBUTIVE: 4,
	/** 状语 */
	ADVERBIAL: 5,
	/** 补语 */
	COMPLEMENT: 6
};


/**
 * 变量字面意义。
 * @author Jiangwei Xu
 */
var LiteralBase = {
	/** 字符串型。*/
	STRING: 1,
	/** 整数型。*/
	INT: 2,
	/** 长整数型。*/
	LONG: 3,
	/** 浮点类型。*/
	FLOAT: 4,
	/** 布尔型。*/
	BOOL: 5,
	/** JSON 类型。*/
	JSON: 6,
	/** XML 类型。*/
	XML: 7
};


/**
 */
var Stuff = Class({
	ctor: function(type, value, literalBase) {
		this.type = type;
		this.value = null;
		this.literalBase = null;

		if (value !== undefined) {
			this.value = value;

			if (literalBase === undefined) {
				var vt = (typeof value);

				if (vt == 'string') {
					this.literalBase = LiteralBase.STRING;
				}
				else if (vt == 'number') {
					var reg = /^-?\d+$/;
					if (reg.test(value.toString())) {
						this.literalBase = LiteralBase.LONG;
					}
					else {
						this.literalBase = LiteralBase.FLOAT;
					}
				}
				else if (vt == 'boolean') {
					this.literalBase = LiteralBase.BOOL;
				}
				else if (vt == 'object') {
					this.literalBase = LiteralBase.JSON;
				}
			}
		}

		if (literalBase !== undefined) {
			this.literalBase = literalBase;
		}
	},

	// 抽象方法，子类必须覆盖
	clone: function(target) {
		// Nothing
	},

	getType: function() {
		return this.type;
	},

	getValue: function() {
		return this.value;
	},

	getValueAsString: function() {
		if (typeof(this.value) == 'string') {
			return this.value;
		}
		else {
			return this.value.toString();
		}
	},

	getValueAsNumber: function() {
		return Number(this.value);
	},

	getValueAsBool: function() {
		return Boolean(this.value);
	},

	getLiteralBase: function() {
		return this.literalBase;
	},

	setValue: function(value) {
		this.value = value;
	},

	setLiteralBase: function(literalBase) {
		this.literalBase = literalBase;
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 主语语素。
 * @author Jiangwei Xu
 */
var SubjectStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.SUBJECT, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.SUBJECT) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 谓语语素。
 * @author Jiangwei Xu
 */
var PredicateStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.PREDICATE, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.PREDICATE) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 宾语语素。
 * @author Jiangwei Xu
 */
var ObjectiveStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.OBJECTIVE, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.OBJECTIVE) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 定语语素。
 * @author Jiangwei Xu
 */
var AttributiveStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.ATTRIBUTIVE, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.ATTRIBUTIVE) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 状语语素。
 * @author Jiangwei Xu
 */
var AdverbialStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.ADVERBIAL, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.ADVERBIAL) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 补语语素。
 * @author Jiangwei Xu
 */
var ComplementStuff = Class(Stuff, {
	ctor: function(value, literalBase) {
		Stuff.prototype.ctor.call(this, StuffType.COMPLEMENT, value, literalBase);
	},

	clone: function(target) {
		if (target.type == StuffType.COMPLEMENT) {
			target.value = this.value;
			target.literalBase = this.literalBase;
		}
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 原语。
 * @author Jiangwei Xu
 */
var Primitive = Class({
	ctor: function(param) {
		if (typeof param == 'string') {
			this.ownerTag = param;
			this.dialect = null;
		}
		else {
			this.dialect = param;
			this.ownerTag = null;
		}

		this.celletIdentifier = null;
		this.subjectList = null;
		this.predicateList = null;
		this.objectiveList = null;
		this.attributiveList = null;
		this.adverbialList = null;
		this.complementList = null;
	},

	getOwnerTag: function() {
		return this.ownerTag;
	},

	setCelletIdentifier: function(celletIdentifier) {
		this.celletIdentifier = celletIdentifier;
		if (null != this.dialect) {
			this.dialect.setCelletIdentifier(celletIdentifier);
		}
	},

	getCelletIdentifier: function() {
		return this.celletIdentifier;
	},

	isDialectal: function() {
		return (null != this.dialect);
	},
	getDialect: function() {
		return this.dialect;
	},

	/**
	 * 设置关联方言。
	 */
	capture: function(dialect) {
		this.dialect = dialect;
		this.dialect.setOwnerTag(this.ownerTag);
		this.dialect.setCelletIdentifier(this.celletIdentifier);
	},

	/**
	 * 提交语素。
	 */
	commit: function(stuff) {
		switch (stuff.type) {
		case StuffType.SUBJECT:
			if (null == this.subjectList)
				this.subjectList = [stuff];
			else
				this.subjectList.push(stuff);
			break;
		case StuffType.PREDICATE:
			if (null == this.predicateList)
				this.predicateList = [stuff];
			else
				this.predicateList.push(stuff);
			break;
		case StuffType.OBJECTIVE:
			if (null == this.objectiveList)
				this.objectiveList = [stuff];
			else
				this.objectiveList.push(stuff);
			break;
		case StuffType.ATTRIBUTIVE:
			if (null == this.attributiveList)
				this.attributiveList = [stuff];
			else
				this.attributiveList.push(stuff);
			break;
		case StuffType.ADVERBIAL:
			if (null == this.adverbialList)
				this.adverbialList = [stuff];
			else
				this.adverbialList.push(stuff);
			break;
		case StuffType.COMPLEMENT:
			if (null == this.complementList)
				this.complementList = [stuff];
			else
				this.complementList.push(stuff);
			break;
		default:
			break;
		}
	},

	subjects: function() {
		return this.subjectList;
	},
	predicates: function() {
		return this.predicateList;
	},
	objectives: function() {
		return this.objectiveList;
	},
	attributives: function() {
		return this.attributiveList;
	},
	adverbials: function() {
		return this.adverbialList;
	},
	complements: function() {
		return this.complementList;
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/** 原语方言。
 * 
 * @author Jiangwei Xu
 */
var Dialect = Class({
	ctor: function(name, tracker) {
		this.name = name;
		if (tracker !== undefined)
			this.tracker = tracker;
		else
			this.tracker = "none";
		this.tag = null;
		this.celletIdentifier = null;
	},

	getName: function() {
		return this.name;
	},

	getTracker: function() {
		return this.tracker;
	},

	setOwnerTag: function(tag) {
		this.tag = tag;
	},
	getOwnerTag: function() {
		return this.tag;
	},

	setCelletIdentifier: function(identifier) {
		this.celletIdentifier = identifier;
	},
	getCelletIdentifier: function() {
		return this.celletIdentifier;
	},

	/**
	 * 翻译原语为方言。
	 */
	translate: function() {
		// Nothing
		return null;
	},

	/**
	 * 从原语构建方言。
	 */
	build: function(primitive) {
		// Nothing
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/


/**
 * 方言元数据。
 *
 * @author Jiangwei Xu
 */
var DialectMetaData = Class({
	ctor: function(name, description) {
		this.name = name;
		this.description = description;
	}
});


/**
 * 方言工厂。
 * 
 * @author Jiangwei Xu
 */
var DialectFactory = Class({
	ctor: function() {
	},

	getMetaData: function() {
		return null;
	},

	create: function(tracker) {
		return null;
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 方言枚举器。
 * 
 * @author Jiangwei Xu
 */
var DialectEnumerator = Class({
	ctor: function() {
		this.factories = new HashMap();
	},

	createDialect: function(name, tracker) {
		var fact = this.factories.get(name);
		if (null != fact) {
			return fact.create(tracker);
		}
		return null;
	},

	addFactory: function(fact) {
		this.factories.put(fact.getMetaData().name, fact);
	},
	removeFactory: function(fact) {
		this.factories.remove(fact.getMetaData().name);
	},
	getFactory: function(name) {
		return this.factories.get(name);
	}
});


DialectEnumerator.instance = new DialectEnumerator();

DialectEnumerator.getInstance = function() {
	return DialectEnumerator.instance;
}
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/** 动作方言。
 * 
 * @author Jiangwei Xu
 */
var ActionDialect = Class(Dialect, {
	ctor: function(tracker, action) {
		Dialect.prototype.ctor.call(this, ActionDialect.DIALECT_NAME, tracker);
		if (action !== undefined)
			this.action = action;
		else
			this.action = null;
		this.params = new HashMap();
	},

	setAction: function(value) {
		this.action = value;
	},
	getAction: function() {
		return this.action;
	},

	translate: function() {
		if (null == this.action) {
			return null;
		}

		var primitive = new Primitive(this);
		var list = this.params.keySet();
		for (var i = 0; i < list.length; i++) {
			var name = list[i];
			var value = this.params.get(name);

			var nameStuff = new SubjectStuff(name);
			var valueStuff = new ObjectiveStuff(value);
			primitive.commit(nameStuff);
			primitive.commit(valueStuff);
		}

		var actionStuff = new PredicateStuff(this.action);
		primitive.commit(actionStuff);

		return primitive;
	},

	build: function(primitive) {
		this.action = primitive.predicates()[0].getValueAsString();

		var subjects = primitive.subjects();
		if (null != subjects) {
			var names = subjects;
			var values = primitive.objectives();
			for (var i = 0; i < names.length; i++) {
				this.params.put(names[i].getValueAsString(), values[i].getValue());
			}
		}
	},

	/**
	 * 添加动作参数键值对。
	 */
	appendParam: function(name, value) {
		this.params.put(name, value);
	},

	getParam: function(name) {
		return this.params.get(name);
	},

	existParam: function(name) {
		return this.params.containsKey(name);
	},

	act: function(delegate) {
		var self = this;
		var tid = setTimeout(function() {
			clearTimeout(tid);
			delegate.call(null, self);
		}, 0);
	}
});

// 方言名称
ActionDialect.DIALECT_NAME = "ActionDialect";
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/


/**
 * 动作方言工厂。
 * 
 * @author Jiangwei Xu
 */
var ActionDialectFactory = Class(DialectFactory, {
	ctor: function() {
		DialectFactory.prototype.ctor.call(this);
		this.metaData = new DialectMetaData(ActionDialect.DIALECT_NAME, "Action Dialect");
	},

	getMetaData: function() {
		return this.metaData;
	},

	create: function(tracker) {
		return new ActionDialect(tracker);
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/


/**
 * 原语序列化器。
 *
 * @author Jiangwei Xu
 */
var PrimitiveSerializer = {
	STUFFTYPE_SUBJECT: "sub",
	STUFFTYPE_PREDICATE: "pre",
	STUFFTYPE_OBJECTIVE: "obj",
	STUFFTYPE_ADVERBIAL: "adv",
	STUFFTYPE_ATTRIBUTIVE: "att",
	STUFFTYPE_COMPLEMENT: "com",

	LITERALBASE_STRING: "string",
	LITERALBASE_INT: "int",
	LITERALBASE_UINT: "uint",
	LITERALBASE_LONG: "long",
	LITERALBASE_ULONG: "ulong",
	LITERALBASE_FLOAT: "float",
	LITERALBASE_BOOL: "bool",
	LITERALBASE_JSON: "json",
	LITERALBASE_XML: "xml",

	KEY_VERSION: "version",
	KEY_STUFFS: "stuffs",
	KEY_STUFFTYPE: "type",
	KEY_STUFFVALUE: "value",
	KEY_LITERALBASE: "literal",
	KEY_DIALECT: "dialect",
	KEY_NAME: "name",
	KEY_TRACKER: "tracker",

	read: function(output, json) {
		var stuffs = json[this.KEY_STUFFS];
		for (var i = 0; i < stuffs.length; ++i) {
			var stuffJSON = stuffs[i];
			var type = stuffJSON[this.KEY_STUFFTYPE];
			if (type == this.STUFFTYPE_SUBJECT) {
				var subject = new SubjectStuff();
				this._readValue(subject, stuffJSON);
				output.commit(subject);
			}
			else if (type == this.STUFFTYPE_PREDICATE) {
				var predicate = new PredicateStuff();
				this._readValue(predicate, stuffJSON);
				output.commit(predicate);
			}
			else if (type == this.STUFFTYPE_OBJECTIVE) {
				var objective = new ObjectiveStuff();
				this._readValue(objective, stuffJSON);
				output.commit(objective);
			}
			else if (type == this.STUFFTYPE_ADVERBIAL) {
				var adverbial = new AdverbialStuff();
				this._readValue(adverbial, stuffJSON);
				output.commit(adverbial);
			}
			else if (type == this.STUFFTYPE_ATTRIBUTIVE) {
				var attributive = new AttributiveStuff();
				this._readValue(attributive, stuffJSON);
				output.commit(attributive);
			}
			else if (type == this.STUFFTYPE_COMPLEMENT) {
				var complement = new ComplementStuff();
				this._readValue(complement, stuffJSON);
				output.commit(complement);
			}
		}

		// 解析方言
		var dialect = json[this.KEY_DIALECT];
		if (dialect !== undefined) {
			var dialectName = dialect[this.KEY_NAME];
			var tracker = dialect[this.KEY_TRACKER];

			// 创建方言
			var dialect = DialectEnumerator.getInstance().createDialect(dialectName, tracker);
			if (null != dialect) {
				// 关联
				output.capture(dialect);

				// 构建数据
				dialect.build(output);
			}
			else {
				Logger.w("PrimitiveSerializer", "Can't create '" +  dialectName + "' dialect.");
			}
		}
	},

	write: function(output, primitive) {
		output[this.KEY_VERSION] = "1.0";

		var stuffs = [];

		var subjects = primitive.subjects();
		if (null != subjects) {
			for (var i = 0; i < subjects.length; ++i) {
				var s = {};
				s[this.KEY_STUFFTYPE] = this.STUFFTYPE_SUBJECT;
				// 写入值
				this._writeValue(s, subjects[i]);
				stuffs.push(s);
			}
		}
		var predicates = primitive.predicates();
		if (null != predicates) {
			for (var i = 0; i < predicates.length; ++i) {
				var p = {};
				p[this.KEY_STUFFTYPE] = this.STUFFTYPE_PREDICATE;
				// 写入值
				this._writeValue(p, predicates[i]);
				stuffs.push(p);
			}
		}
		var objectives = primitive.objectives();
		if (null != objectives) {
			for (var i = 0; i < objectives.length; ++i) {
				var o = {};
				o[this.KEY_STUFFTYPE] = this.STUFFTYPE_OBJECTIVE;
				// 写入值
				this._writeValue(o, objectives[i]);
				stuffs.push(o);
			}
		}
		var adverbials = primitive.adverbials();
		if (null != adverbials) {
			for (var i = 0; i < adverbials.length; ++i) {
				var a = {};
				a[this.KEY_STUFFTYPE] = this.STUFFTYPE_ADVERBIAL;
				// 写入值
				this._writeValue(a, adverbials[i]);
				stuffs.push(a);
			}
		}
		var attributives = primitive.attributives();
		if (null != attributives) {
			for (var i = 0; i < attributives.length; ++i) {
				var a = {};
				a[this.KEY_STUFFTYPE] = this.STUFFTYPE_ATTRIBUTIVE;
				// 写入值
				this._writeValue(a, attributives[i]);
				stuffs.push(a);
			}
		}
		var complements = primitive.complements();
		if (null != complements) {
			for (var i = 0; i < complements.length; ++i) {
				var c = {};
				c[this.KEY_STUFFTYPE] = this.STUFFTYPE_COMPLEMENT;
				// 写入值
				this._writeValue(c, complements[i]);
				stuffs.push(c);
			}
		}

		// 输出语素数组
		output[this.KEY_STUFFS] = stuffs;

		// 方言
		var dialect = primitive.getDialect();
		if (null != dialect) {
			var obj = {};
			obj[this.KEY_NAME] = dialect.getName();
			obj[this.KEY_TRACKER] = dialect.getTracker();
			// 添加方言数据
			output[this.KEY_DIALECT] = obj;
		}
	},

	_readValue: function(output, json) {
		output.setValue(json[this.KEY_STUFFVALUE]);

		var literal = json[this.KEY_LITERALBASE];
		if (literal == this.LITERALBASE_STRING) {
			output.setLiteralBase(LiteralBase.STRING);
		}
		else if (literal == this.LITERALBASE_INT
			|| literal == this.LITERALBASE_UINT) {
			output.setLiteralBase(LiteralBase.INT);
		}
		else if (literal == this.LITERALBASE_LONG
			|| literal == this.LITERALBASE_ULONG) {
			output.setLiteralBase(LiteralBase.LONG);
		}
		else if (literal == this.LITERALBASE_BOOL) {
			output.setLiteralBase(LiteralBase.BOOL);
		}
		else if (literal == this.LITERALBASE_FLOAT) {
			output.setLiteralBase(LiteralBase.FLOAT);
		}
		else if (literal == this.LITERALBASE_JSON) {
			output.setLiteralBase(LiteralBase.JSON);
		}
		else if (literal == this.LITERALBASE_XML) {
			output.setLiteralBase(LiteralBase.XML);
		}
	},

	_writeValue: function(output, stuff) {
		// 值
		output[this.KEY_STUFFVALUE] = stuff.value;

		// 字面义
		switch (stuff.literalBase) {
		case LiteralBase.STRING:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_STRING;
			break;
		case LiteralBase.INT:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_INT;
			break;
		case LiteralBase.LONG:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_LONG;
			break;
		case LiteralBase.FLOAT:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_FLOAT;
			break;
		case LiteralBase.BOOL:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_BOOL;
			break;
		case LiteralBase.JSON:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_JSON;
			break;
		case LiteralBase.XML:
			output[this.KEY_LITERALBASE] = this.LITERALBASE_XML;
			break;
		default:
			break;
		}
	}
};
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 会话监听器。
 *
 * @author Jiangwei Xu
 */
var TalkListener = Class({
	ctor: function() {
	},

	/** 与内核进行会话。
	 */
	dialogue: function(identifier, primitive) {
	},

	/** 与对端内核建立会话。
	 */
	contacted: function(identifier, tag) {
	},

	/** 与对端内核断开会话。
	 */
	quitted: function(identifier, tag) {
	},

	/** 发生错误。
	 */
	failed: function(tag, failure) {
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/


/**
 * 会话故障码。
 *
 * @author Jiangwei Xu
 */
var TalkFailureCode = {
	/** 未找到指定的 Cellet 。 */
	NOTFOUND_CELLET: 100,

	/** Call 一般性失败。 */
	CALL_FAILED: 200,

	/** 连接超时，丢失会话。 */
	TALK_LOST: 300,

	/** 未知故障。 */
	UNKNOWN: 900
};


/**
 * 服务故障描述类。
 * 
 * @author Jiangwei Xu
 */
var TalkServiceFailure = Class({
	ctor: function(code, clazz) {
		this.code = code;
		this.reason = "Error in " + clazz;

		// 描述错误
		this.description = "Unknown";
		switch (code) {
		case TalkFailureCode.NOTFOUND_CELLET:
			this.description = "Server can not find specified cellet";
			break;
		case TalkFailureCode.CALL_FAILED:
			this.description = "Network connecting timeout";
			break;
		case TalkFailureCode.TALK_LOST:
			this.description = "Lost talk connection";
			break;
		default:
			break;
		}

		this.sourceDescription = "";
		this.sourceCelletIdentifiers = null;
	},

	getCode: function() {
		return this.code;
	},

	getReason: function() {
		return this.reason;
	},

	getDescription: function() {
		return this.description;
	},

	getSourceDescription: function() {
		return this.sourceDescription;
	},

	setSourceDescription: function(desc) {
		this.sourceDescription = desc;
	},

	getSourceCelletIdentifiers: function() {
		return this.sourceCelletIdentifiers;
	},

	setSourceCelletIdentifiers: function(celletIdentifierList) {
		this.sourceCelletIdentifiers = celletIdentifierList;
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2014 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/


/**
 * Speaker 事件委派。
 *
 * @author Jiangwei Xu
 */
var SpeakerDelegate = Class({
	ctor: function() {
	},

	onDialogue: function(speaker, identifier, primitive) {
		// Nothing
	},

	onContacted: function(speaker, identifier) {
		// Nothing
	},

	onQuitted: function(speaker, identifier) {
		// Nothing
	},

	onFailed: function(speaker, failure) {
		// Nothing
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2016 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 会话状态。
 */
var TalkState = {
	/** 无对话。 */
	HANGUP:  1,

	/** 正在请求服务。 */
	CALLING: 2,

	/** 已经请求服务。 */
	CALLED:  3
};

/**
 * Talk 协议包类型标签。
 */
var SpeakerTPT = {
	/** 询问。 */
	TPT_INTERROGATE: "interrogate",

	/** 快速握手。 */
	TPT_QUICK: "quick",

	/** 进行原语对话。 */
	TPT_DIALOGUE: "dialogue",

	/** 心跳。 */
	TPT_HEARTBEAT: "hb"
};

/**
 * 会话器。
 *
 * @class Speaker
 * @author Jiangwei Xu
 */
var Speaker = Class({

	ctor: function(address, delegate, socketEnabled) {
		this.address = address;
		this.delegate = delegate;
		this.identifiers = [];

		// 是否使用 WebSocket
		this.wsEnabled = socketEnabled === true;
		// WebSocket
		this.socket = null;
		// WebSocket 的发送定时器
		this.sockTimer = 0;
		this.sockSendQueue = [];

		// 状态
		this.state = TalkState.HANGUP;
		// 是否授权可访问
		this.authenticated = false;

		// Ajax 请求句柄
		this.request = null;
		// Cookie
		this.cookie = null;

		// 是否采用安全连接
		this.secure = (window.location.protocol.toLowerCase().indexOf("https") >= 0);
		// 密钥
		this.secretKey = null;

		// 远程服务器 Tag
		this.remoteTag = null;

		// tick 时间戳
		this.tickTime = new Date();
		// 使用 Socket 的心跳间隔是 60 秒，使用 HTTP 的心跳间隔是 10 秒
		this.heartbeat = (this.wsEnabled && undefined !== window.WebSocket) ? 60 * 1000 : 10 * 1000;
		// 心跳时间戳
		this.hbSendTime = 0;
		this.hbReceiveTime = 0;

		// 记录响应时长
		this.ping = 0;
		this.pong = 0;
		this.pingPong = 0;
	},

	/**
	 *
	 * @memberof Speaker
	 * @instance
	 */
	call: function(identifiers) {
		if (this.state !== TalkState.HANGUP) {
			return false;
		}

		if (identifiers) {
			for (var i = 0; i < identifiers.length; ++i) {
				var identifier = identifiers[i];
				if (this.identifiers.indexOf(identifier) >= 0) {
					continue;
				}

				this.identifiers.push(identifier);
			}
		}

		if (this.identifiers.length === 0) {
			Logger.e("Speaker", "Can not find any cellets to call in param 'identifiers'.");
			return false;
		}

		this.state = TalkState.CALLING;
		this.hbSendTime = 0;
		this.hbReceiveTime = 0;

		if (this.wsEnabled) {
			if (null != this.socket) {
				this.destroySocketEvent();
				try {
					this.socket.close(1000, "Speaker#close");
				} catch (e) {
					// Nothing
				}
			}
			// WebSocket 的端口号是 HTTP 服务端口号 +1， WebSocket Secure 端口号是 HTTPS 服务端口号 +1
			this.socket = this._createSocket(this.address.getAddress(), this.address.getPort() + 1);
		}

		if (null == this.socket) {
			var self = this;
			this.request = Ajax.newCrossDomain(this.address.getAddress(), this.address.getPort())
				.uri("/talk/int")
				.method("GET")
				.error(self._fireFailed, self)
				.send(function(data, cookie) {
					self.cookie = cookie;
					if (undefined !== data.ver && (data.ver == "1.1" || data.ver == "2.0")) {
						self._respondQuick(data);
					}
					else {
						self._processInterrogation(data);
					}
				});
		}

		return true;
	},

	hangUp: function() {
		// TODO 发送 hang up 到服务器

		if (this.sockTimer > 0) {
			clearTimeout(this.sockTimer);
			this.sockTimer = 0;
		}

		if (null != this.socket) {
			try {
				this.socket.close(1000, "Speaker#close");
			} catch (e) {
				Logger.e("Speaker", "Close socket has exception.");
			}
			this.socket = null;
			this.sockSendQueue = [];
		}

		this.state = TalkState.HANGUP;
		this.remoteTag = null;
		this.hbSendTime = 0;
		this.hbReceiveTime = 0;

		Logger.d("Speaker", "Hang up call.");
	},

	speak: function(identifier, primitive) {
		if (this.state != TalkState.CALLED) {
			return false;
		}

		if (this.identifiers.indexOf(identifier) < 0) {
			// 没有找到对应请求的 Cellet
			return false;
		}

		var self = this;
		// 原语 JSON
		var primJSON = {};
		// 将原语写入 JSON 对象
		PrimitiveSerializer.write(primJSON, primitive);
		var content = {
			"tag": window.nucleus.tag.toString(),
			"identifier": identifier,
			"primitive": primJSON
		};

		if (null != this.socket) {
			var data = {
				"tpt": SpeakerTPT.TPT_DIALOGUE,
				"packet": content
			};

			// 将数据写入队列
			this.sockSendQueue.push(JSON.stringify(data));
			// 如果没有发送任务，则启动发送任务。
			if (this.sockTimer == 0) {
				this.sockTimer = setTimeout(function() {
					self._sockHandleSend();
				}, 20);
			}

			//this.socket.send(JSON.stringify(data));

			if (this.ping == 0) {
				this.ping = Date.now();
			}
		}
		else {
			self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
				.uri("/talk/dialogue")
				.method("POST")
				.cookie(self.cookie)
				.content(content)
				.error(self._fireFailed, self)
				.send(function(data) {
					/* 数据样本:
					{"primitives":
					   [
						 {
						   "primitive": {"stuffs":[{"value":"This is a test.","type":"sub","literal":"string"}], "version":"1.0"}
						   , "identifier": "DummeyCellet"
						 }
					   ]
					}
					*/
					var primitives = data.primitives;
					if (undefined !== primitives) {
						// 解析数据
						for (var i = 0; i < primitives.length; ++i) {
							var item = primitives[i];
							self._doDialogue(item.identifier, item.primitive);
						}
					}
					else if (parseInt(data.queue) > 0) {
						self.tick();
					}

					if (self.pong == 0) {
						self.pong = Date.now();
						if (self.ping > 0) {
							self.pingPong = self.pong - self.ping;
						}
					}
				});

			if (self.ping == 0) {
				self.ping = Date.now();
			}
		}

		return true;
	},

	tick: function() {
		if (this.state !== TalkState.CALLED) {
			return;
		}

		var self = this;

		var time = new Date();

		if (time.getTime() - self.tickTime.getTime() < self.heartbeat) {
			return;
		}

		// 重置 ping-pong
		if (this.ping > 0) {
			this.ping = 0;
			this.pong = 0;
		}

		self.tickTime = time;

		if (null !== self.socket) {
			var data = {
				tpt: SpeakerTPT.TPT_HEARTBEAT
			};

			// 记录心跳发送时间
			self.hbSendTime = time.getTime();

			Logger.i("Speaker", "Heartbeat to keep alive");
			self.socket.send(JSON.stringify(data));

			// 5秒后如果还未收到心跳回包, 则尝试再次发送, 若依旧失败, 则直接关闭连接
			var tickCheck = function (times) {
                setTimeout(function () {
                    if (self.hbReceiveTime <= time.getTime()) {
                    	if (times > 0) {
							self.destroySocketEvent();
							self.hangUp();
							self._onSocketError(self.socket);
							self._onSocketClose(self.socket);
						}
						else {
                            self.socket.send(JSON.stringify(data));
                            tickCheck(++times);
						}
                    }
                }, 5000);
            };
            tickCheck(0);
		}
		else {
			// 记录心跳发送时间
			self.hbSendTime = time.getTime();

			// 请求心跳
			self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
				.uri("/talk/hb")
				.method("GET")
				.cookie(self.cookie)
				.error(self._fireFailed, self)
				.send(function(data) {
					/* 数据样本:
					{"primitives":
					   [
						 {
						   "primitive": {"stuffs":[{"value":"This is a test.","type":"sub","literal":"string"}], "version":"1.0"}
						   , "identifier": "DummeyCellet"
						 }
					   ]
					}
					*/

					self.hbReceiveTime = Date.now();

					var primitives = data.primitives;
					if (undefined !== primitives) {
						// 解析数据
						for (var i = 0; i < primitives.length; ++i) {
							var item = primitives[i];
							self._doDialogue(item.identifier, item.primitive);
						}
					}
				});
		}
	},

	_createSocket: function(address, port) {
		if (undefined === window.WebSocket) {
			return null;
		}

		var self = this;
		var socket = null;
		if (self.secure) {
			socket = new WebSocket("wss://" + address + ":" + port + "/wss", "cell");
		}
		else {
			socket = new WebSocket("ws://" + address + ":" + port + "/ws", "cell");
		}
		socket.onopen = function(event) { self._onSocketOpen(socket, event); };
		socket.onclose = function(event) { self._onSocketClose(socket, event); };
		socket.onmessage = function(event) { self._onSocketMessage(socket, event); };
		socket.onerror = function(event) { self._onSocketError(socket, event); };
		return socket;
	},

	// 用于销毁当前 socket 事件 (避免旧socket影响新的socket)
	destroySocketEvent: function () {
        this.socket.onopen = null;
        this.socket.onclose = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
    },

	_onSocketOpen: function(socket, event) {
		Logger.d('Speaker', '_onSocketOpen');
	},
	_onSocketClose: function(socket, event) {
		Logger.d('Speaker', '_onSocketClose');

		if (this.state === TalkState.CALLED) {
			for (var i = 0; i < this.identifiers.length; ++i) {
				this._fireQuitted(this.identifiers[i]);
			}
		}
		else {
			this._fireFailed(this.socket, HttpErrorCode.STATUS_ERROR);
		}

		this.state = TalkState.HANGUP;
		this.remoteTag = null;
	},
	_onSocketMessage: function(socket, event) {
		//Logger.d('Speaker', '_onSocketMessage: ' + event.data);

		var data = JSON.parse(event.data);
		if (data.tpt === SpeakerTPT.TPT_DIALOGUE) {
			// 记录 pong
			if (this.pong == 0) {
				this.pong = Date.now();
				if (this.ping > 0) {
					this.pingPong = this.pong - this.ping;
				}
			}

			if (undefined !== data.packet.primitive) {
				this._doDialogue(data.packet.identifier, data.packet.primitive);
			}
			else if (undefined !== data.packet.primitives) {
				// 解析数据
				for (var i = 0, size = data.packet.primitives.length; i < size; ++i) {
					var item = data.packet.primitives[i];
					this._doDialogue(item.identifier, item.primitive);
				}
			}
		}
		else if (data.tpt === SpeakerTPT.TPT_QUICK) {
			this._doQuick(data.packet);
		}
		else if (data.tpt === SpeakerTPT.TPT_HEARTBEAT) {
			this.hbReceiveTime = Date.now();
		}
		else if (data.tpt === SpeakerTPT.TPT_INTERROGATE) {
			if (undefined !== data.ver && (data.ver == "1.1" || data.ver == "2.0")) {
				this._respondQuick(data.packet);
			}
			else {
				this._processInterrogation(data.packet);
			}
		}
		else if (data.tpt === "request") {
			this._doRequest(data.packet);
		}
		else if (data.tpt === "check") {
			this.remoteTag = data.packet.tag;
			this._requestCellets();
		}
		else {
			Logger.e('Speaker', 'Unknown message received');
		}
	},
	_onSocketError: function(socket, event) {
		Logger.d('Speaker', '_onSocketError');

		this._fireFailed(this.socket, HttpErrorCode.NETWORK_FAILED);
	},

	_sockHandleSend: function() {
		clearTimeout(this.sockTimer);
		this.sockTimer = 0;

		if (this.sockSendQueue.length === 0
			|| null === this.socket) {
			return;
		}

		// 取出第一个数据进行发送
		var data = this.sockSendQueue.shift();
		// 发送
		this.socket.send(data);

		if (this.sockSendQueue.length > 0) {
			var self = this;
			this.sockTimer = setTimeout(function() {
				self._sockHandleSend();
			}, 20);
		}
	},

	_processInterrogation: function(data) {
		var ciphertextBase64 = data.ciphertext;	// string
		var key = data.key;		// string
		var ciphertext = Base64.decode(ciphertextBase64);	// string - bytes

		// 记录密钥
		this.secretKey = key;

		// 请求 Check
		this._requestCheck(ciphertext, key);
	},

	_requestCheck: function(ciphertext, key) {
		// 解密
		var plaintext = Utils.simpleDecrypt(ciphertext, key);	// array - string
		// 将解密之后的数组转为字符串形式
		var text = [];
		for (var i = 0; i < plaintext.length; ++i) {
			text.push(String.fromCharCode(plaintext[i]));
		}
		text = text.join('');

		var tag = window.nucleus.tag;
		var content = { "plaintext": text, "tag": tag };

		if (null !== this.socket) {
			var data = {
				tpt: "check",
				packet: content
			};
			this.socket.send(JSON.stringify(data));
		}
		else {
			var self = this;
			self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
				.uri("/talk/check")
				.method("POST")
				.cookie(self.cookie)
				.content(content)
				.error(self._fireFailed, self)
				.send(function(data) {
					// Tag
					self.remoteTag = data.tag;
					self._requestCellets();
				});
		}
	},

	_respondQuick: function(data) {
		Logger.d('Speaker', "Use 'QUICK' handshake");

		var ciphertextBase64 = data.ciphertext;	// string
		var key = data.key;		// string
		var ciphertext = Base64.decode(ciphertextBase64);	// string - bytes

		// 记录密钥
		this.secretKey = key;

		// 解密
		var plaintext = Utils.simpleDecrypt(ciphertext, key);	// array - string
		// 将解密之后的数组转为字符串形式
		var text = [];
		for (var i = 0; i < plaintext.length; ++i) {
			text.push(String.fromCharCode(plaintext[i]));
		}
		text = text.join('');

		var tag = window.nucleus.tag.toString();

		// 生成 Cellet 标识数组
		var idArray = [];
		for (var i = 0; i < this.identifiers.length; ++i) {
			var identifier = this.identifiers[i];
			idArray.push(identifier.toString());
		}

		// 明文，源标签，CelletIdentifiers
		var content = { "plaintext": text, "tag": tag, "identifiers": idArray };

		if (null !== this.socket) {
			var data = {
				tpt: "quick",
				packet: content
			};
			this.socket.send(JSON.stringify(data));
		}
		else {
			var self = this;
			self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
				.uri("/talk/quick")
				.method("POST")
				.cookie(self.cookie)
				.content(content)
				.error(self._fireFailed, self)
				.send(function(data) {
					self._doQuick(data);
				});
		}
	},

	_requestCellets: function() {
		var tag = window.nucleus.tag.toString();
		for (var i = 0; i < this.identifiers.length; ++i) {
			var identifier = this.identifiers[i];
			var content = {
				"identifier": identifier.toString(),
				"tag": tag
			};

			if (null !== this.socket) {
				var data = {
					tpt: "request",
					packet: content
				};
				this.socket.send(JSON.stringify(data));
			}
			else {
				var self = this;
				self.request = Ajax.newCrossDomain(self.address.getAddress(), self.address.getPort())
					.uri("/talk/request")
					.method("POST")
					.cookie(self.cookie)
					.content(content)
					.error(self._fireFailed, self)
					.send(function(data) {
						self._doRequest(data);
					});
			}
		}
	},

	_doRequest: function(data) {
		if (undefined !== data.error) {
			// 回调失败
			var failure = new TalkServiceFailure(TalkFailureCode.NOTFOUND_CELLET, "Speaker");
			failure.setSourceDescription("Can not find cellet '" + data.identifier + "'");
			failure.setSourceCelletIdentifiers(this.identifiers);

			this.state = TalkState.HANGUP;		// 更新状态

			// 回调失败
			this.delegate.onFailed(this, failure);
		}
		else {
			if (this.state === TalkState.HANGUP) {
				// 已经有失败的请求，则不再记录成功的请求
				return;
			}

			Logger.i("Speaker", "Cellet '" + data.identifier + "' has called at " +
					this.address.getAddress() + ":" + (this.address.getPort() + ((null !== this.socket) ? (this.secure ? 7 : 1) : 0)));

			// 更新状态
			this.state = TalkState.CALLED;

			// 回调事件
			this._fireContacted(data.identifier);
		}
	},

	_doQuick: function(data) {
		if (this.state === TalkState.HANGUP) {
			// 已经有失败的请求，则不再记录成功的请求
			return;
		}

		// tag
		var tag = data.tag;
		// identifiers
		var identifiers = data.identifiers;

		// 判断是否错误
		if (undefined === data.error) {
			// 记录 tag
			this.remoteTag = tag.toString();

			// 更新状态
			this.state = TalkState.CALLED;

			for (var i = 0; i < identifiers.length; ++i) {
				var identifier = identifiers[i];

				Logger.i("Speaker", "Cellet '" + identifier + "' has called at " +
					this.address.getAddress() + ":" + (this.address.getPort() + ((null !== this.socket) ? (this.secure ? 7 : 1) : 0)));

				// 回调事件
				this._fireContacted(identifier);
			}
		}
		else {
			// 回调失败
			var failure = new TalkServiceFailure(TalkFailureCode.NOTFOUND_CELLET, "Speaker");
			failure.setSourceDescription("Can not find cellet '" + identifiers.toString() + "'");
			failure.setSourceCelletIdentifiers(this.identifiers);

			this.state = TalkState.HANGUP;		// 更新状态

			// 回调失败
			this.delegate.onFailed(this, failure);
		}
	},

	_doDialogue: function(identifier, primitiveJson) {
		// 创建原语
		var primitive = new Primitive(this.remoteTag);
		primitive.setCelletIdentifier(identifier);

		// 读取数据
		PrimitiveSerializer.read(primitive, primitiveJson);

		this._fireDialogue(identifier, primitive);
	},

	_fireDialogue: function(identifier, primitive) {
		this.delegate.onDialogue(this, identifier, primitive);
	},
	_fireContacted: function(identifier) {
		var self = this;
		var celletIdentifier = identifier.toString();
		var t = setTimeout(function() {
			clearTimeout(t);
			self.delegate.onContacted(self, celletIdentifier);
		}, 60);
	},
	_fireQuitted: function(identifier) {
		this.delegate.onQuitted(this, identifier);
	},
	_fireFailed: function(handler, code) {
		var failure = null;
		if (code == HttpErrorCode.NETWORK_FAILED) {
			if (this.state === TalkState.CALLING) {
				failure = new TalkServiceFailure(TalkFailureCode.CALL_FAILED, "Speaker");
				failure.setSourceDescription("Attempt to connect to host timed out");
			}
			else {
				failure = new TalkServiceFailure(TalkFailureCode.TALK_LOST, "Speaker");
				failure.setSourceDescription("Attempt to connect to host timed out");
			}

			// 更新状态
			this.state = TalkState.HANGUP;
		}
		else if (code == HttpErrorCode.STATUS_ERROR) {
			if (this.state === TalkState.CALLING) {
				failure = new TalkServiceFailure(TalkFailureCode.CALL_FAILED, "Speaker");
				failure.setSourceDescription("Http status error");
			}
			else {
				failure = new TalkServiceFailure(TalkFailureCode.TALK_LOST, "Speaker");
				failure.setSourceDescription("Http status error");
			}

			// 更新状态
			this.state = TalkState.HANGUP;
		}
		else {
			failure = new TalkServiceFailure(TalkFailureCode.UNKNOWN, "Speaker");
			failure.setSourceDescription("Unknown");

			// 更新状态
			this.state = TalkState.HANGUP;
		}

		// 设置 cellet identifier
		failure.setSourceCelletIdentifiers(this.identifiers);

		this.delegate.onFailed(this, failure);
	}
});
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2016 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/** 委派的代理
 */
var _DelegateProxy = Class(SpeakerDelegate, {
	ctor: function(service) {
		this.service = service;
	},

	onDialogue: function(speaker, celletIdentifier, primitive) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].dialogue(celletIdentifier, primitive);
		}
	},

	onContacted: function(speaker, celletIdentifier) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].contacted(celletIdentifier, speaker.remoteTag);
		}
	},

	onQuitted: function(speaker, celletIdentifier) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].quitted(celletIdentifier, speaker.remoteTag);
		}
	},

	onFailed: function(speaker, failure) {
		var listeners = this.service.listeners;
		for (var i = 0; i < listeners.length; ++i) {
			listeners[i].failed(speaker.remoteTag, failure);
		}
	}
});

/**
 * 会话服务。
 *
 * @author Jiangwei Xu
 */
var TalkService = Class(Service, {
	ctor: function() {
		TalkService.instance = this;

		this.daemonTimer = 0;
		this.recallTimer = 0;
		this.listeners = new Array();
		this.speakers = new Array();
		this.speakerMap = new HashMap();
		this.delegateProxy = new _DelegateProxy(this);

		// 默认 10 秒一次 tick
		this.tickTime = 10000;
	},

	startup: function() {
		// 添加方言工厂
		var adf = new ActionDialectFactory();
		DialectEnumerator.getInstance().addFactory(adf);

		// 启动定时任务
		Logger.i("TalkService", "Tick period is " + this.tickTime + " ms");
		this._tickFunction();

		return true;
	},

	shutdown: function() {
		if (this.daemonTimer > 0) {
			clearTimeout(this.daemonTimer);
			this.daemonTimer = 0;
		}

		if (this.recallTimer > 0) {
			clearTimeout(this.recallTimer);
			this.recallTimer = 0;
		}
	},

	addListener: function(listener) {
		var index = this.listeners.indexOf(listener);
		if (index >= 0)
			return;

		this.listeners.push(listener);
	},

	removeListener: function(listener) {
		var index = this.listeners.indexOf(listener);
		if (index >= 0) {
			this.listeners.splice(index, 1);
		}
	},

	hasListener: function(listener) {
		return (this.listeners.indexOf(listener) >= 0);
	},

	isWebSocketSupported: function() {
		return (undefined !== window.WebSocket);
	},

	/** 重置心跳周期。
	 */
	resetHeartbeat: function(identifier, heartbeat) {
		if (heartbeat < 2000) {
			Logger.w("TalkService", "Reset '"+ identifier +"' heartbeat Failed.");
			return false;
		}
//		if (this.isWebSocketSupported() && heartbeat < 10000) {
//			Logger.w("TalkService", "Reset '"+ identifier +"' heartbeat Failed.");
//			return false;
//		}

		// 如果心跳小于 5 秒，则缩短 tick 间隔
		if (heartbeat <= 5000) {
			this.tickTime = 5000;
		}
		else {
			this.tickTime = 10000;
		}

		clearTimeout(this.daemonTimer);
		this.daemonTimer = 0;

		// 重置 Speaker 心跳
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			speaker.heartbeat = heartbeat;
		}
		else {
			Logger.e("TalkService", "Reset '"+ identifier +"' heartbeat Failed. Retrying after 5 seconds ...");
			var self = this;
			setTimeout(function() {
				var speaker = self.speakerMap.get(identifier);
				if (null != speaker) {
					speaker.heartbeat = heartbeat;
				}
			}, 5000);
		}

		Logger.i("TalkService", "Reset '" + identifier + "' heartbeat period is " + heartbeat + " ms");

		// 启动执行
		this._tickFunction();

		return true;
	},

	call: function(identifiers, address, socketEnabled) {
		for (var i = 0; i < identifiers.length; ++i) {
			var identifier = identifiers[i];
			if (this.speakerMap.containsKey(identifier)) {
				return false;
			}
		}

		// 创建新的 Speaker
		var speaker = new Speaker(address, this.delegateProxy, socketEnabled);
		this.speakers.push(speaker);

		for (var i = 0; i < identifiers.length; ++i) {
			var identifier = identifiers[i];
			this.speakerMap.put(identifier, speaker);
		}

		if (!socketEnabled) {
			this.resetHeartbeat(identifiers[0], 5000);
		}

		return speaker.call(identifiers);
	},

	tryRecall: function() {
		if (this.speakers.length == 0) {
			return false;
		}

		// 判断socket连接是否真正的关闭了, 如果未真正关闭, 无须重连
		var relist = [];
        for (var i = 0; i < this.speakers.length; ++i) {
            var speaker = this.speakers[i];
            if (speaker.state != TalkState.HANGUP) {
                continue;
            }

			relist.push(speaker);
        }

		if (relist.length == 0) {
			return false;
		}

		if (this.recallTimer > 0) {
			clearTimeout(this.recallTimer);
			this.recallTimer = 0;
		}

		var self = this;
		this.recallTimer = setTimeout(function() {
			clearTimeout(self.recallTimer);
			self.recallTimer = 0;

			if (relist.length == self.speakers.length) {
				window.nucleus._resetTag();
			}

			for (var i = 0; i < relist.length; ++i) {
				var speaker = relist[i];
				if (speaker.state != TalkState.CALLED) {
					// call without ids
					speaker.call(null);
				}
			}
		}, 5000);

		return true;
	},

	recall: function() {
		if (this.speakers.length == 0) {
			return false;
		}

		if (this.recallTimer > 0) {
			clearTimeout(this.recallTimer);
			this.recallTimer = 0;
		}

		for (var i = 0; i < this.speakers.length; ++i) {
			var speaker = this.speakers[i];
			if (speaker.state != TalkState.CALLED) {
				// hang up old speaker
				speaker.destroySocketEvent();
				speaker.hangUp();
			}
		}

		var self = this;
		this.recallTimer = setTimeout(function() {
			clearTimeout(self.recallTimer);
			self.recallTimer = 0;

			window.nucleus._resetTag();

			for (var i = 0; i < self.speakers.length; ++i) {
				var speaker = self.speakers[i];
				if (speaker.state != TalkState.CALLED) {
					// call without ids
					speaker.call(null);
				}
			}
		}, 5000);

		return true;
	},

	hangUp: function(identifier, force) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			for (var i = 0, size = speaker.identifiers.length; i < size; ++i) {
				var id = speaker.identifiers[i];
				this.speakerMap.remove(id);
			}

			if (force) {
                speaker.destroySocketEvent();
			}
			// 执行 hang up
			speaker.hangUp();

			var index = -1;
			if ((index = this.speakers.indexOf(speaker)) >= 0) {
				this.speakers.splice(index, 1);
			}
		}
	},

	talk: function(identifier, mix) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			if (undefined !== mix.translate) {
				// 方言转原语
				var primitive = mix.translate();
				if (null != primitive) {
					return speaker.speak(identifier, primitive);
				}
				else {
					Logger.e("TalkService", "Failed translates dialect to primitive.");
					return false;
				}
			}
			else {
				// 直接操作原语
				return speaker.speak(identifier, mix);
			}
		}
		else {
			Logger.w("TalkService", "Can not find '" + identifier + "' cellet in speaker.");
		}

		return false;
	},

	getTalkState: function(identifier) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			return speaker.state;
		}

		return TalkState.HANGUP;
	},

	isCalled: function(identifier, timeout) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			if (speaker.state == TalkState.CALLED) {
				if (undefined !== timeout && timeout > 0) {
					if (speaker.hbSendTime > 0 && speaker.hbReceiveTime > 0) {
						var d = speaker.hbReceiveTime - speaker.hbSendTime;
						return (d > 0 && d <= timeout);
					}
				}

				return true;
			}
		}

		return false;
	},

	getPingPongTime: function(identifier) {
		var speaker = this.speakerMap.get(identifier);
		if (null != speaker) {
			return speaker.pingPong;
		}
		return -1;
	},

	_tickFunction: function() {
		var self = this;

		if (self.daemonTimer > 0) {
			clearTimeout(self.daemonTimer);
		}

		self.daemonTimer = setTimeout(function() {
			clearTimeout(self.daemonTimer);
			self.daemonTimer = 0;

			// 执行任务
			self._exeDaemonTask();

			// 循环执行
			self._tickFunction();
		}, self.tickTime);
	},

	_exeDaemonTask: function() {
		// 驱动 Speaker 进行心跳
		if (this.speakers.length > 0) {
			for (var i = 0; i < this.speakers.length; ++i) {
				this.speakers[i].tick();
			}
		}
	}
});

// 实例
TalkService.instance = null;

// 返回单例
TalkService.getInstance = function() {
	return TalkService.instance;
}
/*
-----------------------------------------------------------------------------
This source file is part of Cell Cloud.

Copyright (c) 2009-2016 Cell Cloud Team (www.cellcloud.net)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
-----------------------------------------------------------------------------
*/

/**
 * 核心类。
 */
var Nucleus = Class(Service, {
	// 版本信息
	version: { major: 1, minor: 6, revision: 3, name: "Xi" },

	ctor: function() {
		this.tag = UUID.v4().toString();

		this.talkService = {
			isCalled: function() { return false; }
		};

		this.ts = this.talkService;
	},

	_resetTag: function() {
		this.tag = UUID.v4().toString();
	},

	startup: function() {
		Logger.i("Nucleus", "Cell Cloud "+ this.version.major
				+ "." + this.version.minor + "." + this.version.revision
				+ " (Build JavaScript/Web - " + this.version.name + ")");

		Logger.i("Nucleus", "Cell Initializing");

		this.talkService = new TalkService();
		this.ts = this.talkService;

		this.talkService.startup();
		window.service = this.talkService;

		return true;
	},

	shutdown: function() {
		if (null != this.talkService) {
			this.talkService.shutdown();
			this.talkService = null;
			this.ts = null;
		}
	},

	activateWSPlugin: function(path, callback) {
		var swfjs = document.createElement("script");

		swfjs.onload = function() {
			var wsjs = document.createElement("script");
			wsjs.onload = function() {
				if (callback) {
					setTimeout(callback, 30);
				}
			};
			wsjs.setAttribute("src", path + "/websocket.js");
			document.body.appendChild(wsjs);
		};

		swfjs.setAttribute("src", path + "/swfobject.js");
		document.body.appendChild(swfjs);

		WEB_SOCKET_SWF_LOCATION = path + "/WebSocketMain.swf";
	}
});

// 创建 Nucleus 单例
(function(){
	window.nucleus = new Nucleus();
})();
