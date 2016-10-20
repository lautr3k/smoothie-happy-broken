/**
* Smoothie-Happy - A SmoothieBoard network communication API.
* @author   Sébastien Mischler (skarab) <sebastien@onlfait.ch>
* @see      {@link https://github.com/lautr3k/Smoothie-Happy}
* @build    66ad150f7cac9122f22899b928ee756c
* @date     Thu, 20 Oct 2016 11:34:25 +0000
* @version  0.2.1-dev
* @license  MIT
* @namespace
*/
var sh = sh || {};

(function () {
    'use strict';

    /**
    * @property {String} - API version.
    * @default
    * @readonly
    */
    sh.version = '0.2.1-dev';

    /**
    * @property {String} - API build hash.
    * @default
    * @readonly
    */
    sh.build = '66ad150f7cac9122f22899b928ee756c';

    /**
    * @property {String} - API id.
    * @default
    * @readonly
    */
    sh.id = 'smoothie-happy';

    /**
    * @property {String} - API name.
    * @default
    * @readonly
    */
    sh.name = 'Smoothie-Happy';

    /**
    * @property {String} - API description.
    * @default
    * @readonly
    */
    sh.description = 'A SmoothieBoard network communication API';

    /**
    * @property {String} - API repository url.
    * @default
    * @readonly
    */
    sh.gitURL = 'git://github.com/lautr3k/Smoothie-Happy.git';

    /**
    * Network module.
    *
    * @namespace
    */
    sh.network = {};

    /**
    * XMLHttpRequest response abstraction class.
    *
    * @class
    *
    * @param {XMLHttpRequest} xhr An `XMLHttpRequest` instance.
    */
    sh.network.Response = function(xhr) {
        // instance factory
        if (! (this instanceof sh.network.Response)) {
            return new sh.network.Response(xhr);
        }

        // text/xml response available ?
        var responseText = null;
        var responseXML  = null;

        if (xhr.responseType == '' || xhr.responseType == 'document') {
            responseText = xhr.responseText;
            responseXML  = xhr.responseXML;
        }

        /** @property {Integer} - Response status code. */
        this.code = xhr.status;

        /** @property {String} - Respons status text. */
        this.message = xhr.statusText;

        /** @property {String} - Response type. */
        this.type = xhr.responseType;

        /** @property {String} - Response url. */
        this.url = xhr.responseURL;

        /** @property {String} - Response XML. */
        this.xml = responseXML;

        /** @property {String} - Response text. */
        this.text = responseText;

        /** @property {Mixed} - Raw response. */
        this.raw = xhr.response;
    };

    /**
    * Custom request event.
    *
    * @class
    *
    * @param {String}             name     Event name, possible values is `[upload.]load`, `[upload.]timeout`, `[upload.]abort` or `[upload.]error`.
    * @param {sh.network.Request} request  Original `sh.network.Request` instance.
    */
    sh.network.RequestEvent = function(name, request) {
        // instance factory
        if (! (this instanceof sh.network.RequestEvent)) {
            return new sh.network.RequestEvent(name, request);
        }

        /** @property {String} - Possible values is `[upload.]load`, `[upload.]timeout`, `[upload.]abort` or `[upload.]error`. */
        this.name = name;

        /** @property {sh.network.Request} - Request instance. */
        this.request = request;

        /** @property {sh.network.Response} - Response instance. */
        this.response = sh.network.Response(request._xhr);
    };

    /**
    * Custom progress event.
    *
    * @class
    * @extends sh.network.RequestEvent
    *
    * @param {String}             name    Event name, possible values is `progress` or `upload.progress`.
    * @param {sh.network.Request} request Original `sh.network.Request`.
    * @param {ProgressEvent}      source  Original `ProgressEvent`.
    */
    sh.network.ProgressEvent = function(name, request, source) {
        // instance factory
        if (! (this instanceof sh.network.ProgressEvent)) {
            return new sh.network.ProgressEvent(name, request, source);
        }

        // call parent constructor
        sh.network.RequestEvent.call(this, name, request);

        /** @property {String} - Possible values is `progress` or `upload.progress`. */
        this.name = name;

        /** @property {ProgressEvent} - `ProgressEvent` instance. */
        this.source = source;

        /** @property {Boolean} - If computable length. */
        this.computable = source.lengthComputable;

        /** @property {Integer} - Total bytes. */
        this.total = this.computable ? source.total : null;

        /** @property {Integer} - Loaded bytes. */
        this.loaded = this.computable ? source.loaded : null;

        /** @property {Integer} - Loaded bytes as percent. */
        this.percent = this.computable ? (this.loaded / this.total) * 100 : null;
    };

    // extends sh.network.RequestEvent
    sh.network.ProgressEvent.prototype = Object.create(sh.network.RequestEvent.prototype);
    sh.network.ProgressEvent.prototype.constructor = sh.network.ProgressEvent;

    /**
    * `XMLHttpRequest` wrapper with `Promise` logic.
    *
    * @class
    *
    * @param {Object}  settings                   Request settings.
    * @param {String}  settings.url               URL with protocol.
    * @param {String}  [settings.method  = 'GET'] 'GET', 'POST', 'DELETE', ...
    * @param {Mixed}   [settings.data    = null]  Data to send with the request.
    * @param {Object}  [settings.headers = null]  Headers to send with the request.
    * @param {Integer} [settings.timeout = 5000]  Timeout for this request in milliseconds.
    * @param {Object}  [settings.xhr     = null]  An `XMLHttpRequest` instance or an collection of `XMLHttpRequest` properties/methods to overwrite.
    *
    * @see Please read {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise|this} and {@link https://pouchdb.com/2015/05/18/we-have-a-problem-with-promises.html|that} to learn more about promises.
    *
    * @example
    * ### Single request
    * ```
    * new sh.network.Request({
    *     url: 'index.html'
    * })
    * .onProgress(function(event) {
    *     // notify progression
    *     console.info(event.request._url, '>> progress >>',  event.percent, '%');
    * })
    * .then(function(event) {
    *     // index.html is loaded
    *     console.info(event.request._url, '>> loaded >>', event.response);
    * 
    *     // return result for final then
    *     return { event: event, error: false };
    * })
    * .catch(function(event) {
    *     // error loading index.html
    *     console.warn(event.request._url, '>> error >>', event.response);
    * 
    *     // return error for final then
    *     return { event: event, error: true };
    * })
    * .then(function(result) {
    *     // finaly ...
    *     var event    = result.event;
    *     var logType  = result.error ? 'error' : 'info';
    *     var logLabel = result.error ? 'error' : 'loaded';
    * 
    *     console[logType](event.request._url, '>>', logLabel, '>>', event.response);
    * });
    * ```
    * 
    * @example
    * ### Chaining requests
    * ```
    * new sh.network.Request({
    *     url: 'index.html'
    * })
    * .onProgress(function(event) {
    *     // notify progression
    *     console.info(event.request._url, '>> progress >>',  event.percent, '%');
    * })
    * .then(function(event) {
    *     // index.html is loaded
    *     console.info(event.request._url, '>> loaded >>', event.response);
    * 
    *     // return another request
    *     return new sh.network.Request({
    *         url: 'not_found.html'
    *     })
    *     .onProgress(function(event) {
    *         // notify progression
    *         console.info(event.request._url, '>> progress >>',  event.percent, '%');
    *     });
    * })
    * .then(function(event) {
    *     // not_found.html is loaded
    *     console.info(event.request._url, '>> loaded >>', event.response);
    * 
    *     // return result for final then
    *     return { event: event, error: false };
    * })
    * .catch(function(event) {
    *     // error loading index.html or not_found.html
    *     console.warn(event.request._url, '>> error >>', event.response);
    * 
    *     // return error for final then
    *     return { event: event, error: true };
    * })
    * .then(function(result) {
    *     // finaly ...
    *     var event    = result.event;
    *     var logType  = result.error ? 'error' : 'info';
    *     var logLabel = result.error ? 'error' : 'loaded';
    * 
    *     console[logType](event.request._url, '>>', logLabel, '>>', event.response);
    * });
    * ```
    */
    sh.network.Request = function(settings) {
        // instance factory
        if (! (this instanceof sh.network.Request)) {
            return new sh.network.Request(settings);
        }

        // default settings
        var settings = settings || {};

        /**
        * @property {String} - Request url.
        * @default ''
        * @protected
        */
        this._url = (settings.url || '').trim();

        /**
        * @property {String} - Request method.
        * @default 'GET'
        * @protected
        */
        this._method = (settings.method  || 'GET').trim().toUpperCase();

        /**
        * @property {Mixed} - Request data.
        * @default null
        * @protected
        */
        this._data = settings.data || null;

        // append data to url if not a POST method
        if (this._method !== 'POST' && this._data) {
            // stringify data object
            if (typeof this._data === 'object') {
                this._data = Object.keys(this._data).map(function(key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(this._data[key]);
                }).join('&');
            }

            // trim data string
            this._data = this._data.trim();

            // remove the first char if it is an '?'
            if (this._data.indexOf('?') === 0) {
                this._data = this._data.substr(1);
            }

            // append '?' or '&' to the uri if not already set
            this._url += (this._url.indexOf('?') === -1) ? '?' : '&';

            // append data to uri
            this._url += this._data;

            // reset data
            this._data = null;
        }

        /**
        * @property {Object} - Request headers.
        * @default {}
        * @protected
        */
        this._headers = settings.headers || {};

        /**
        * @property {Integer} - Request timeout in milliseconds.
        * @default 5000
        * @protected
        */
        this._timeout = settings.timeout === undefined ? 5000 : settings.timeout;

        /**
        * @property {XMLHttpRequest} - XMLHttpRequest instance.
        * @protected
        */
        this._xhr = settings.xhr || null;

        // create XMLHttpRequest instance
        var xhrOptions = {};

        if (! (this._xhr instanceof XMLHttpRequest)) {
            // maybe properties/methods to overwrite
            if (this._xhr && typeof this._xhr === 'object') {
                xhrOptions = this._xhr;
            }

            // create http request object
            this._xhr = new XMLHttpRequest();
        }

        /**
        * @property {Promise} - Promise instance.
        * @protected
        */
        this._promise = this._execute(xhrOptions);
    };

    /**
    * Execute the request and return a Promise.
    *
    * @method
    *
    * @param {Object} xhrOptions An object of `XMLHttpRequest` settings.
    *
    * @protected
    *
    * @return {Promise}
    */
    sh.network.Request.prototype._execute = function(xhrOptions) {
        // self alias
        var self = this;

        // create and return the Promise
        return new Promise(function(resolve, reject) {
            // open the request (async)
            self._xhr.open(self._method, self._url, true);

            // overwrite properties/methods
            for (var option in xhrOptions) {
                if (option === 'upload') {
                    for (var event in xhrOptions[option]) {
                        if (self._xhr.upload[event] !== undefined) {
                            self._xhr.upload[event] = xhrOptions[option][event];
                        }
                    }
                }
                else if (self._xhr[option] !== undefined) {
                    self._xhr[option] = xhrOptions[option];
                }
            }

            // force timeout
            self._xhr.timeout = self._timeout;

            // on load
            var LOAD_EVENT = 'load';

            self._xhr.onload = function () {
                if (self._xhr.status >= 200 && self._xhr.status < 300) {
                    resolve(sh.network.RequestEvent(LOAD_EVENT, self));
                }
                else {
                    reject(sh.network.RequestEvent(LOAD_EVENT, self));
                }
            };

            // on error
            self._xhr.onerror = function () {
                reject(sh.network.RequestEvent('error', self));
            };

            // on timeout
            self._xhr.ontimeout = function () {
                reject(sh.network.RequestEvent('timeout', self));
            };

            // on abort
            self._xhr.onabort = function () {
                reject(sh.network.RequestEvent('abort', self));
            };

            // on upload.load
            self._xhr.upload.onload = function () {
                LOAD_EVENT = 'upload.load';
            };

            // on upload.error
            self._xhr.upload.onerror = function () {
                reject(sh.network.RequestEvent('upload.error', self));
            };

            // on upload.timeout
            self._xhr.upload.ontimeout = function () {
                reject(sh.network.RequestEvent('upload.timeout', self));
            };

            // on upload.abort
            self._xhr.upload.onabort = function () {
                reject(sh.network.RequestEvent('upload.abort', self));
            };

            // set request headers
            for (var header in self._headers) {
                self._xhr.setRequestHeader(header, self._headers[header]);
            }

            // send the request
            self._xhr.send(self._method === 'POST' ? self._data : null);
        });
    };

    /**
    * Register progress event handler.
    *
    * @method
    *
    * @param {Function} progressHandler An function receiving an {@link sh.network.ProgressEvent} as first parameter.
    * @param {Object}   [context]       The callback context
    *
    * @return {this}
    */
    sh.network.Request.prototype.onProgress = function(progressHandler, context) {
        // self alias
        var self = this;

        // register progress event
        this._xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                progressHandler.call(context || this, sh.network.ProgressEvent('progress', self, event));
            }
        };

        // return the promise
        return this;
    };

    /**
    * Register upload progress event handler.
    *
    * @method
    *
    * @param {Function} progressHandler An function receiving an {@link sh.network.ProgressEvent} as first parameter.
    * @param {Object}   [context]       The callback context
    *
    * @return {this}
    */
    sh.network.Request.prototype.onUploadProgress = function(progressHandler, context) {
        // self alias
        var self = this;

        // register upload progress event
        this._xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                progressHandler.call(context || this, sh.network.ProgressEvent('upload.progress', self, event));
            }
        };

        // return the promise
        return this;
    };

    /**
    * Appends fulfillment and rejection handlers to the promise.
    *
    * @method
    *
    * @param {Function} onFulfilled Fulfillment callback.
    * @param {Function} onRejected  Rejection callback.
    *
    * @return {Promise}
    */
    sh.network.Request.prototype.then = function(onFulfilled, onRejected) {
        return this._promise.then(onFulfilled, onRejected);
    };

    /**
    * Appends a rejection handler callback to the promise.
    *
    * @method
    *
    * @param {Function} onRejected Rejection callback.
    *
    * @return {Promise}
    */
    sh.network.Request.prototype.catch = function(onRejected) {
        return this._promise.catch(onRejected);
    };

    /**
    * Make and return an GET `sh.network.Request`.
    *
    * @function
    *
    * @param {Object}  settings                  Request settings.
    * @param {String}  settings.url              URL with protocol.
    * @param {Mixed}   [settings.data    = null] Data to send with the request.
    * @param {Object}  [settings.headers = null] Headers to send with the request.
    * @param {Integer} [settings.timeout = 5000] Timeout for this request in milliseconds.
    * @param {Object}  [settings.xhr     = null] An `XMLHttpRequest` instance or an collection of `XMLHttpRequest` properties/methods to overwrite.
    *
    * @return {sh.network.Request}
    *
    * @see Please see {@link sh.network.Request} for uses examples.
    */
    sh.network.get = function(settings) {
        // defaults settings
        settings = settings || {};

        // force GET method
        settings.method = 'GET';

        // create and return the request
        return sh.network.Request(settings);
    };

    /**
    * Make and return an POST `sh.network.Request`.
    *
    * @function
    *
    * @param {Object}  settings                  Request settings.
    * @param {String}  settings.url              URL with protocol.
    * @param {Mixed}   [settings.data    = null] Data to send with the request.
    * @param {Object}  [settings.headers = null] Headers to send with the request.
    * @param {Integer} [settings.timeout = 5000] Timeout for this request in milliseconds.
    * @param {Object}  [settings.xhr     = null] An `XMLHttpRequest` instance or an collection of `XMLHttpRequest` properties/methods to overwrite.
    *
    * @return {sh.network.Request}
    *
    * @see Please see {@link sh.network.Request} for uses examples.
    */
    sh.network.post = function(settings) {
        // defaults settings
        settings = settings || {};

        // force POST method
        settings.method = 'POST';

        // create and return the request
        return sh.network.Request(settings);
    };

    /**
    * Commands module.
    *
    * @namespace
    */
    sh.commands = {};

    /**
    * Parse command response.
    *
    * Return the parsed response data as object or an Error instance.
    *
    * @function
    * @param  {String} command Command name.
    * @param  {String} raw     Raw command response string.
    * @return {Object|Error}
    */
    sh.commands.parse = function(command, raw) {
        // split command name and aguments
        var args = command.split(' ');
        var name = args.shift();

        // if undefined parser
        if (! sh.commands.parsers[name]) {
            // return an Error message
            return new Error('Sorry! The ' + name + ' command parser is not (yet) implemented.');
        }

        // parse the command response
        var result = sh.commands.parsers[name](raw, args);

        // Oups!
        if (result.error) {
            return new Error(result.data);
        }

        // return result data
        return result.data;
    };

    // -------------------------------------------------------------------------

    /**
    * Commands parsers collection.
    *
    * @namespace
    */
    sh.commands.parsers = {};

    /**
    * Make and return an error response data object.
    *
    * @function
    * @protected
    * @param  {String} raison
    * @return {Object}
    */
    sh.commands.parsers._error = function(raison) {
        return { error: true, data: raison };
    };

    /**
    * Make and return an success response data object.
    *
    * @function
    * @protected
    * @param  {Mixed} data
    * @return {Object}
    */
    sh.commands.parsers._success = function(data) {
        return { error: false, data: data };
    };

    // -------------------------------------------------------------------------

    /**
    * Parse ok command response.
    *
    * @function
    * @param  {String}   raw  Raw command response string.
    * @param  {String[]} args Command arguments.
    * @return {Object}
    * @example
    * ### on success
    * ```
    * return { error: false, data: "ok" }
    * ```
    * ### on error
    * ```
    * return { error: true, data: "ko" }
    * ```
    */
    sh.commands.parsers.ok = function(raw, args) {
        return raw.trim() === 'ok' ? this._success('ok') : this._error('ko');
    };

    // -------------------------------------------------------------------------

    /**
    * Parse version command response.
    *
    * @function
    * @param  {String}   raw  Raw command response string.
    * @param  {String[]} args Command arguments.
    * @return {Object}
    * @example
    * ### on success
    * ```
    * return {
    *     error: false,
    *     data : {
    *         branch: "edge",
    *         hash  : "9ab4538",
    *         date  : "Oct 10 2016 04:09:42",
    *         mcu   : "LPC1769",
    *         clock : "120MHz"
    *     }
    * }
    * ```
    * ### on error
    * ```
    * return { error: true, data: "Unknown version string" }
    * ```
    */
    sh.commands.parsers.version = function(raw, args) {
        // version pattern
        var pattern = /Build version: (.*), Build date: (.*), MCU: (.*), System Clock: (.*)/;

        // test the pattern
        var info = raw.trim().match(pattern);

        if (info) {
            // split branch-hash on dash
            var branch = info[1].split('-');

            // resolve
            return this._success({
                branch: branch[0].trim(),
                hash  : branch[1].trim(),
                date  : info[2].trim(),
                mcu   : info[3].trim(),
                clock : info[4].trim()
            });
        }

        // reject
        return this._error('Unknown version string');
    };

    /**
    * Board event.
    *
    * @class
    * @param  {sh.Board}                board        Board instance.
    * @param  {String}                  name         Event name.
    * @param  {Mixed|Error}             [data=null]  Event data (see data member description for more details).
    * @param  {sh.network.RequestEvent} [event=null] Original `sh.network.RequestEvent` instance.
    * @throws {Error}
    */
    sh.BoardEvent = function(board, name, data, event) {
        // instance factory
        if (! (this instanceof sh.BoardEvent)) {
            return new sh.BoardEvent(board, name, data, event);
        }

        /** @property {sh.Board} - Board instance. */
        this.board = board;

        /** @property {String} - Event name. */
        this.name = name;

        /**
        * - If NO error occured: can be anything depending on the command.
        * - If AN error occured: must be an `Error` instance.
        *
        * @property {Mixed|Error} - Event data
        * @default  null
        */
        this.data = data || null;

        /**
        * @property {sh.network.RequestEvent|null} - Original event.
        * @default  null
        */
        this.originalEvent = event || null;
    };

    /**
    * Board class.
    *
    * @class
    * @param {String|Object}      address|settings         Board address or settings.
    * @param {Object}             [settings]               Board settings.
    * @param {String}             [settings.address]       Board address (ip or hostname).
    * @param {Integer}            [settings.timeout]       Default response timeout in milliseconds for all commands.
    * @param {Integer|null|false} [settings.retryInterval] Retry interval in milliseconds for all commands.
    *
    * 
    */
    sh.Board = function(address, settings) {
        // instance factory
        if (! (this instanceof sh.Board)) {
            return new sh.Board(address, settings);
        }

        // defaults settings
        settings = settings || {};

        // settings provided on first argument
        if (typeof address === 'object') {
            settings = address;
            address  = settings.address;
        }

        // Trim whitespaces
        address = address.trim();

        /**
        * @property {String} - Board address (ip or hostname).
        * @readonly
        */
        this.address = address;

        /**
        * @property {Integer} - Default response timeout in milliseconds for all commands.
        * @default 5000
        */
        this.timeout = settings.timeout || 5000;

        /**
        * @property {Object|null} info        Board info parsed from version command.
        * @property {String}      info.branch Firmware branch.
        * @property {String}      info.hash   Firmware hash.
        * @property {String}      info.date   Firmware date.
        * @property {String}      info.mcu    Board MCU.
        * @property {String}      info.clock  Board clock freqency.
        * @default
        * @readonly
        */
        this.info = null;

        /**
        * @property {Boolean} - Is board online.
        * @default
        * @readonly
        */
        this.online = false;

        /**
        * @property {Integer} - Last time the board was seen online.
        * @default
        * @readonly
        */
        this.lastOnlineTime = null;

        /**
        * @property {Object} - Subscriptions.
        * @protected
        */
        this._subscriptions = {};

        /**
        * @property {Integer} - Number of retry occured.
        * @default
        * @readonly
        */
        this.retryCount = 0;

        /**
        * @property {Integer} - Number of retry before rejection.
        * @default
        * @readonly
        */
        this.retryLimit = 5;

        /**
        * @property {Integer} - Retry interval in milliseconds for all commands.
        * @default 5000
        */
        this.retryInterval = settings.retryInterval || 5000;
    };

    // -------------------------------------------------------------------------

    /**
    * On command request.
    * ```
    * => sh.BoardEvent {
    *     board        : {sh.Board},
    *     name         : "request",
    *     data         : {Object}, <- request settings
    *     originalEvent: null
    * }
    * ```
    * @callback sh.Board~onRequest
    * @param {sh.BoardEvent} event Board event.
    */
    /**
    * On command response.
    *
    * @callback sh.Board~onResponse
    * @param {sh.BoardEvent} event Board event.
    */

    /**
    * On command data.
    *
    * @callback sh.Board~onData
    * @param {sh.BoardEvent} event Board event.
    */

    /**
    * On retry to send command.
    *
    * @callback sh.Board~onRetry
    * @param {sh.BoardEvent} event Board event.
    */

    /**
    * On command error.
    *
    * @callback sh.Board~onError
    * @param {sh.BoardEvent} event Board event.
    */

    // -------------------------------------------------------------------------

    /**
    * Subscription to an event.
    *
    * @method
    * @param  {String}      event          Event name.
    * @param  {Function}    callback       Function to call on event is fired.
    * @param  {Object|null} [context=null] Callback context to apply on call.
    * @return {this}
    *
    * @callbacks
    * | Name     | Type                                   | Description                 |
    * | -------- | -------------------------------------- | --------------------------- |
    * | request  | {@link sh.Board~onRequest|onRequest}   | Called on command request.  |
    * | response | {@link sh.Board~onResponse|onResponse} | Called on command response. |
    * | data     | {@link sh.Board~onData|onData}         | Called on command data.     |
    * | retry    | {@link sh.Board~onRetry|onRetry}       | Called on command retry.    |
    * | error    | {@link sh.Board~onError|onError}       | Called on command error.    |
    */
    sh.Board.prototype.subscribe = function(event, callback, context) {
        // first subscription
        if (! this._subscriptions[event]) {
            // create callbacks collection
            this._subscriptions[event] = [];
        }

        // if not already registered
        if (this._subscriptions[event].indexOf(callback) === -1) {
            // register callback to collection
            this._subscriptions[event].push([callback, context || null]);
        }

        // -> this (chainable)
        return this;
    };

    /**
    * Publish an event with the scope of this class.
    *
    * @method
    * @param {String}                  name         Event name.
    * @param {Mixed|Error}             [data=null]  Event data (see {@link sh.network.BoardEvent}.data member for more details).
    * @param {sh.network.RequestEvent} [event=null] Original `sh.network.RequestEvent` instance.
    *
    * @return {sh.BoardEvent}
    */
    sh.Board.prototype.publish = function(name, data, event) {
        // create new board event
        event = new sh.BoardEvent(this, name, data, event);

        // call user callback with the scope of this instance
        var callbacks = this._subscriptions[name] || [];

        for (var callback, context, i = 0; i < callbacks.length; i++) {
            callbacks[i][0].call(callbacks[i][1] || this, event);
        }

        // return the board event
        return event;
    };

    // -------------------------------------------------------------------------

    /**
    * Publish the event and return an resolved Promise.
    *
    * @method
    * @protected
    * @param  {String}              name        Event name.
    * @param  {sh.network.Response} event       Resolved event.
    * @param  {Mixed|Error}         [data=null] Event data (see {@link sh.network.BoardEvent}.data member for more details).
    * @return {Promise}
    */
    sh.Board.prototype._resolveEvent = function(name, event, data) {
        return Promise.resolve(this.publish(name, data, event));
    };

    /**
    * Publish an `error` event and return an rejected Promise.
    *
    * - If an string is provided as raison, it will be converted to an `Error` instance.
    *
    * @method
    * @protected
    * @param  {sh.network.Response} event    Rejected event.
    * @param  {String|Error}        [raison] Reject raison.
    * @return {Promise}
    */
    sh.Board.prototype._rejectEvent = function(event, raison) {
        // force error instance
        if (typeof raison === 'string') {
            raison = new Error(raison);
        }

        return Promise.reject(this.publish('error', raison, event));
    };

    // -------------------------------------------------------------------------

    /**
    * Send a command to the board.
    *
    * @method
    * @param  {String|Object}      command|settings               Command to send or command settings object.
    * @param  {Object}             [settings]                     Command settings (see {@link sh.network.Request} for more details).
    * @param  {String}             [settings.command]             Command to send.
    * @param  {Boolean}            [settings.parseResponse=false] Parse the response string (see {@link sh.commands.parsers} for a list of knowns parsers).
    * @param  {Integer|null|false} [settings.retryInterval=null]  Retry interval in milliseconds.
    * @return {sh.network.Request}
    *
    * @example
    * ### Create the board instance
    * ```
    * var board = new sh.Board('192.168.1.102');
    * ```
    * @example
    * ### Subscribe to events
    * ```
    * board.subscribe('request', function(event) {
    *     console.info('on:request:', event);
    *     // => sh.BoardEvent {
    *     //     board        : {sh.Board},
    *     //     name         : "request",
    *     //     data         : {Object}, <- request settings
    *     //     originalEvent: null
    *     // }
    * });
    * 
    * board.subscribe('response', function(event) {
    *     console.info('on:response:', event);
    *     // => sh.BoardEvent {
    *     //     board        : {sh.Board},
    *     //     name         : "response",
    *     //     data         : {Object|String},  <- parsed response data
    *     //     originalEvent: {sh.network.RequestEvent}
    *     // }
    * });
    * 
    * board.subscribe('data', function(event) {
    *     console.info('on:data:', event.data);
    *     // => Object {
    *     //     request : {Object},        <- request settings
    *     //     response: {Object|String}  <- parsed response data
    *     // }
    * });
    * 
    * board.subscribe('retry', function(event) {
    *     console.warn('on:retry:', event);
    *     // => sh.BoardEvent {
    *     //     board        : {sh.Board},
    *     //     name         : "error",
    *     //     data         : {Object}, <- request settings
    *     //     originalEvent: {sh.network.RequestEvent}
    *     // }
    * });
    * 
    * board.subscribe('error', function(event) {
    *     console.error('on:error:', event);
    *     // => sh.BoardEvent {
    *     //     board        : {sh.Board},
    *     //     name         : "error",
    *     //     data         : {Error}, <- Error instance
    *     //     originalEvent: {sh.network.RequestEvent}
    *     // }
    * });
    * ```
    * @example
    * ### Send version command (raw response)
    * ```
    * board.send('version').then(function(event) {
    *     console.info('version:event:', event);
    *     // => sh.BoardEvent {
    *     //     board        : {sh.Board},
    *     //     name         : "response",
    *     //     data         : "Build version: edge-9ab4538, Build date: Oct 10 2016 04:09:42, MCU: LPC1769, System Clock: 120MHz↵",
    *     //     originalEvent: {sh.network.RequestEvent}
    *     // }
    * 
    *     console.info('version:event:raw:', event.originalEvent.response.raw);
    *     // => "Build version: edge-9ab4538, Build date: Oct 10 2016 04:09:42, MCU: LPC1769, System Clock: 120MHz↵"
    * 
    *     console.info('version:event:data:' , event.data); // Shortcut for event.originalEvent.response.raw
    *     // => "Build version: edge-9ab4538, Build date: Oct 10 2016 04:09:42, MCU: LPC1769, System Clock: 120MHz↵"
    * })
    * .catch(function(event) {
    *     console.info('version:event:', event);
    *     // => sh.BoardEvent {
    *     //     board        : {sh.Board},
    *     //     name         : "error",
    *     //     data         : {Error},
    *     //     originalEvent: {sh.network.RequestEvent}
    *     // }
    * 
    *     console.error('version:', event.name);               // => error
    *     console.error('version:', event.originalEvent.name); // => upload.timeout
    *     console.error('version:', event.data);               // => Error: upload.timeout: version at ...
    * });
    * ```
    * @example
    * ### Send version command (parsed response)
    * ```
    * board.send('version', { parseResponse: true }).then(function(event) {
    *     console.info('version:event:raw:', event.originalEvent.response.raw);
    *     // => "Build version: edge-9ab4538, Build date: Oct 10 2016 04:09:42, MCU: LPC1769, System Clock: 120MHz↵"
    * 
    *     console.info('version:event:data:', event.data); // Parsed response data
    *     // => Object {
    *     //     branch: "edge",
    *     //     hash  : "9ab4538",
    *     //     date  : "Oct 10 2016 04:09:42",
    *     //     mcu   : "LPC1769",
    *     //     clock : "120MHz"
    *     // }
    * });
    * ```
    */
    sh.Board.prototype.send = function(command, settings) {
        // self alias
        var self = this;

        // defaults settings
        settings = settings || {};

        // settings provided on first argument
        if (typeof command === 'object') {
            settings = command;
            command  = settings.command;
        }

        // clean command
        settings.command = command.trim() + '\n';

        // default response timeout
        if (settings.timeout === undefined) {
            settings.timeout = self.timeout;
        }

        // default retry interval
        if (settings.retryInterval === undefined) {
            settings.retryInterval = self.retryInterval;
        }

        // request settings
        settings.data = settings.command;
        settings.url  = 'http://' + self.address + '/command';

        // first request time
        if (! settings.time) {
            settings.time = Date.now();
        }

        // publish event
        self.publish('request', settings);

        // return POST request (promise)
        return sh.network.post(settings).then(function(event) {
            // set board online flag
            self.online = true;

            // reset retry counter
            self.retryCount = 0;

            // set board last online time
            self.lastOnlineTime = Date.now();

            // response text
            var data = event.response.raw;

            // unsupported command...
            if (data.indexOf('error:Unsupported command') === 0) {
                return Promise.reject({
                    rejected: true,
                    event   : event,
                    raison  : data.substr(6)
                });
            }

            // parse the response ?
            var parsedData = null;

            if (settings.parseResponse) {
                // parse response string
                data = sh.commands.parse(command, data);

                // rejected ?
                if (data instanceof Error) {
                    return Promise.reject({
                        rejected: true,
                        event   : event,
                        raison  : data
                    });
                }

                // publish event
                parsedData = {
                    request : settings,
                    response: data
                };
            }

            // resolve event
            var promise = self._resolveEvent('response', event, data);

            if (parsedData) {
                self.publish('data', parsedData, event);
            }

            return promise;
        })
        .catch(function(event) {
            // fatal error in response
            if (event.rejected) {
                return self._rejectEvent(event.event, event.raison);
            }

            // unset online flag
            self.online = false;

            // increment retry counter
            self.retryCount++;

            // reject raison
            // like: upload.timeout: version\n
            var raison = new Error(event.name + ': ' + settings.command);

            // if retry limit not reached
            if (self.retryCount <= self.retryLimit) {
                // publish events
                self.publish('error', raison, event);
                self.publish('retry', settings, event);

                // create and return a new Promise
                return new Promise(function(resolve, reject) {
                    // delayed retry
                    setTimeout(function() {
                        self.send(settings).then(resolve).catch(reject);
                    }, settings.retryInterval);
                });
            }

            // reject event
            return self._rejectEvent(event, raison);
        });
    };

    /**
    * Send a command to the board (force parsed response).
    *
    * - Shortcut for `board.send('version', { parseResponse: true });`.
    *
    * @method
    * @param  {String|Object}      command|settings              Command to send or command settings object.
    * @param  {Object}             [settings]                    Command settings (see {@link sh.Board#send} for more details).
    * @param  {Boolean}            [settings.parseResponse=true] Parse the response string (see {@link sh.commands.parsers} for a list of knowns parsers).
    * @return {sh.network.Request}
    *
    * @example
    * ### Send version command (force parsed response)
    * ```
    * // Shortcut for `board.send('version', { parseResponse: true });`.
    * board.command('version').then(function(event) {
    *     console.info('version:event:raw:', event.originalEvent.response.raw);
    *     // => "Build version: edge-9ab4538, Build date: Oct 10 2016 04:09:42, MCU: LPC1769, System Clock: 120MHz↵"
    * 
    *     console.info('version:event:data:', event.data); // Parsed response data
    *     // => Object {
    *     //     branch: "edge",
    *     //     hash  : "9ab4538",
    *     //     date  : "Oct 10 2016 04:09:42",
    *     //     mcu   : "LPC1769",
    *     //     clock : "120MHz"
    *     // }
    * });
    * ```
    */
    sh.Board.prototype.command = function(command, settings) {
        // default settings
        settings = settings || {};

        // force parseResponse to true if not defined
        if (settings.parseResponse === undefined) {
            settings.parseResponse = true;
        }

        // send the command
        return board.send(command, settings);
    };

})();
