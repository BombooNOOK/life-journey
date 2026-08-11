"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          this.listeners[eventName].splice(index, 1);
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/definitions.js
  var Directory, Encoding;
  var init_definitions = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
      (function(Directory2) {
        Directory2["Documents"] = "DOCUMENTS";
        Directory2["Data"] = "DATA";
        Directory2["Library"] = "LIBRARY";
        Directory2["Cache"] = "CACHE";
        Directory2["External"] = "EXTERNAL";
        Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
        Directory2["ExternalCache"] = "EXTERNAL_CACHE";
        Directory2["LibraryNoCloud"] = "LIBRARY_NO_CLOUD";
        Directory2["Temporary"] = "TEMPORARY";
      })(Directory || (Directory = {}));
      (function(Encoding2) {
        Encoding2["UTF8"] = "utf8";
        Encoding2["ASCII"] = "ascii";
        Encoding2["UTF16"] = "utf16";
      })(Encoding || (Encoding = {}));
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    FilesystemWeb: () => FilesystemWeb
  });
  function resolve(path) {
    const posix = path.split("/").filter((item) => item !== ".");
    const newPosix = [];
    posix.forEach((item) => {
      if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
        newPosix.pop();
      } else {
        newPosix.push(item);
      }
    });
    return newPosix.join("/");
  }
  function isPathParent(parent, children) {
    parent = resolve(parent);
    children = resolve(children);
    const pathsA = parent.split("/");
    const pathsB = children.split("/");
    return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
  }
  var FilesystemWeb;
  var init_web = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      FilesystemWeb = class _FilesystemWeb extends WebPlugin {
        constructor() {
          super(...arguments);
          this.DB_VERSION = 1;
          this.DB_NAME = "Disc";
          this._writeCmds = ["add", "put", "delete"];
          this.downloadFile = async (options) => {
            var _a, _b;
            const requestInit = buildRequestInit(options, options.webFetchExtra);
            const response = await fetch(options.url, requestInit);
            let blob;
            if (!options.progress)
              blob = await response.blob();
            else if (!(response === null || response === void 0 ? void 0 : response.body))
              blob = new Blob();
            else {
              const reader = response.body.getReader();
              let bytes = 0;
              const chunks = [];
              const contentType = response.headers.get("content-type");
              const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
              while (true) {
                const { done, value } = await reader.read();
                if (done)
                  break;
                chunks.push(value);
                bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
                const status = {
                  url: options.url,
                  bytes,
                  contentLength
                };
                this.notifyListeners("progress", status);
              }
              const allChunks = new Uint8Array(bytes);
              let position = 0;
              for (const chunk of chunks) {
                if (typeof chunk === "undefined")
                  continue;
                allChunks.set(chunk, position);
                position += chunk.length;
              }
              blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
            }
            const result = await this.writeFile({
              path: options.path,
              directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
              recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
              data: blob
            });
            return { path: result.uri, blob };
          };
        }
        readFileInChunks(_options, _callback) {
          throw this.unavailable("Method not implemented.");
        }
        async initDb() {
          if (this._db !== void 0) {
            return this._db;
          }
          if (!("indexedDB" in window)) {
            throw this.unavailable("This browser doesn't support IndexedDB");
          }
          return new Promise((resolve2, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onupgradeneeded = _FilesystemWeb.doUpgrade;
            request.onsuccess = () => {
              this._db = request.result;
              resolve2(request.result);
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
              console.warn("db blocked");
            };
          });
        }
        static doUpgrade(event) {
          const eventTarget = event.target;
          const db2 = eventTarget.result;
          switch (event.oldVersion) {
            case 0:
            case 1:
            default: {
              if (db2.objectStoreNames.contains("FileStorage")) {
                db2.deleteObjectStore("FileStorage");
              }
              const store = db2.createObjectStore("FileStorage", { keyPath: "path" });
              store.createIndex("by_folder", "folder");
            }
          }
        }
        async dbRequest(cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const req = store[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        async dbIndexRequest(indexName, cmd, args) {
          const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
          return this.initDb().then((conn) => {
            return new Promise((resolve2, reject) => {
              const tx = conn.transaction(["FileStorage"], readFlag);
              const store = tx.objectStore("FileStorage");
              const index = store.index(indexName);
              const req = index[cmd](...args);
              req.onsuccess = () => resolve2(req.result);
              req.onerror = () => reject(req.error);
            });
          });
        }
        getPath(directory, uriPath) {
          const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
          let fsPath = "";
          if (directory !== void 0)
            fsPath += "/" + directory;
          if (uriPath !== "")
            fsPath += "/" + cleanedUriPath;
          return fsPath;
        }
        async clear() {
          const conn = await this.initDb();
          const tx = conn.transaction(["FileStorage"], "readwrite");
          const store = tx.objectStore("FileStorage");
          store.clear();
        }
        /**
         * Read a file from disk
         * @param options options for the file read
         * @return a promise that resolves with the read file data result
         */
        async readFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          return { data: entry.content ? entry.content : "" };
        }
        /**
         * Write a file to disk in the specified location on device
         * @param options options for the file write
         * @return a promise that resolves with the file write result
         */
        async writeFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const doRecursive = options.recursive;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: doRecursive
              });
            }
          }
          if (!encoding && !(data instanceof Blob)) {
            data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
            if (!this.isBase64String(data))
              throw Error("The supplied data is not valid base64 content.");
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data instanceof Blob ? data.size : data.length,
            ctime: now,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
          return {
            uri: pathObj.path
          };
        }
        /**
         * Append to a file on disk in the specified location on device
         * @param options options for the file append
         * @return a promise that resolves with the file write result
         */
        async appendFile(options) {
          const path = this.getPath(options.directory, options.path);
          let data = options.data;
          const encoding = options.encoding;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const now = Date.now();
          let ctime = now;
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (occupiedEntry && occupiedEntry.type === "directory")
            throw Error("The supplied path is a directory.");
          const parentEntry = await this.dbRequest("get", [parentPath]);
          if (parentEntry === void 0) {
            const subDirIndex = parentPath.indexOf("/", 1);
            if (subDirIndex !== -1) {
              const parentArgPath = parentPath.substr(subDirIndex);
              await this.mkdir({
                path: parentArgPath,
                directory: options.directory,
                recursive: true
              });
            }
          }
          if (!encoding && !this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
          if (occupiedEntry !== void 0) {
            if (occupiedEntry.content instanceof Blob) {
              throw Error("The occupied entry contains a Blob object which cannot be appended to.");
            }
            if (occupiedEntry.content !== void 0 && !encoding) {
              data = btoa(atob(occupiedEntry.content) + atob(data));
            } else {
              data = occupiedEntry.content + data;
            }
            ctime = occupiedEntry.ctime;
          }
          const pathObj = {
            path,
            folder: parentPath,
            type: "file",
            size: data.length,
            ctime,
            mtime: now,
            content: data
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Delete a file from disk
         * @param options options for the file delete
         * @return a promise that resolves with the deleted file data result
         */
        async deleteFile(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (entry === void 0)
            throw Error("File does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          if (entries.length !== 0)
            throw Error("Folder is not empty.");
          await this.dbRequest("delete", [path]);
        }
        /**
         * Create a directory.
         * @param options options for the mkdir
         * @return a promise that resolves with the mkdir result
         */
        async mkdir(options) {
          const path = this.getPath(options.directory, options.path);
          const doRecursive = options.recursive;
          const parentPath = path.substr(0, path.lastIndexOf("/"));
          const depth = (path.match(/\//g) || []).length;
          const parentEntry = await this.dbRequest("get", [parentPath]);
          const occupiedEntry = await this.dbRequest("get", [path]);
          if (depth === 1)
            throw Error("Cannot create Root directory");
          if (occupiedEntry !== void 0)
            throw Error("Current directory does already exist.");
          if (!doRecursive && depth !== 2 && parentEntry === void 0)
            throw Error("Parent directory must exist");
          if (doRecursive && depth !== 2 && parentEntry === void 0) {
            const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
          const now = Date.now();
          const pathObj = {
            path,
            folder: parentPath,
            type: "directory",
            size: 0,
            ctime: now,
            mtime: now
          };
          await this.dbRequest("put", [pathObj]);
        }
        /**
         * Remove a directory
         * @param options the options for the directory remove
         */
        async rmdir(options) {
          const { path, directory, recursive } = options;
          const fullPath = this.getPath(directory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          if (entry === void 0)
            throw Error("Folder does not exist.");
          if (entry.type !== "directory")
            throw Error("Requested path is not a directory");
          const readDirResult = await this.readdir({ path, directory });
          if (readDirResult.files.length !== 0 && !recursive)
            throw Error("Folder is not empty");
          for (const entry2 of readDirResult.files) {
            const entryPath = `${path}/${entry2.name}`;
            const entryObj = await this.stat({ path: entryPath, directory });
            if (entryObj.type === "file") {
              await this.deleteFile({ path: entryPath, directory });
            } else {
              await this.rmdir({ path: entryPath, directory, recursive });
            }
          }
          await this.dbRequest("delete", [fullPath]);
        }
        /**
         * Return a list of files from the directory (not recursive)
         * @param options the options for the readdir operation
         * @return a promise that resolves with the readdir directory listing result
         */
        async readdir(options) {
          const path = this.getPath(options.directory, options.path);
          const entry = await this.dbRequest("get", [path]);
          if (options.path !== "" && entry === void 0)
            throw Error("Folder does not exist.");
          const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
          const files = await Promise.all(entries.map(async (e) => {
            let subEntry = await this.dbRequest("get", [e]);
            if (subEntry === void 0) {
              subEntry = await this.dbRequest("get", [e + "/"]);
            }
            return {
              name: e.substring(path.length + 1),
              type: subEntry.type,
              size: subEntry.size,
              ctime: subEntry.ctime,
              mtime: subEntry.mtime,
              uri: subEntry.path
            };
          }));
          return { files };
        }
        /**
         * Return full File URI for a path and directory
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async getUri(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          return {
            uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
          };
        }
        /**
         * Return data about a file
         * @param options the options for the stat operation
         * @return a promise that resolves with the file stat result
         */
        async stat(options) {
          const path = this.getPath(options.directory, options.path);
          let entry = await this.dbRequest("get", [path]);
          if (entry === void 0) {
            entry = await this.dbRequest("get", [path + "/"]);
          }
          if (entry === void 0)
            throw Error("Entry does not exist.");
          return {
            name: entry.path.substring(path.length + 1),
            type: entry.type,
            size: entry.size,
            ctime: entry.ctime,
            mtime: entry.mtime,
            uri: entry.path
          };
        }
        /**
         * Rename a file or directory
         * @param options the options for the rename operation
         * @return a promise that resolves with the rename result
         */
        async rename(options) {
          await this._copy(options, true);
          return;
        }
        /**
         * Copy a file or directory
         * @param options the options for the copy operation
         * @return a promise that resolves with the copy result
         */
        async copy(options) {
          return this._copy(options, false);
        }
        async requestPermissions() {
          return { publicStorage: "granted" };
        }
        async checkPermissions() {
          return { publicStorage: "granted" };
        }
        /**
         * Function that can perform a copy or a rename
         * @param options the options for the rename operation
         * @param doRename whether to perform a rename or copy operation
         * @return a promise that resolves with the result
         */
        async _copy(options, doRename = false) {
          let { toDirectory } = options;
          const { to, from, directory: fromDirectory } = options;
          if (!to || !from) {
            throw Error("Both to and from must be provided");
          }
          if (!toDirectory) {
            toDirectory = fromDirectory;
          }
          const fromPath = this.getPath(fromDirectory, from);
          const toPath = this.getPath(toDirectory, to);
          if (fromPath === toPath) {
            return {
              uri: toPath
            };
          }
          if (isPathParent(fromPath, toPath)) {
            throw Error("To path cannot contain the from path");
          }
          let toObj;
          try {
            toObj = await this.stat({
              path: to,
              directory: toDirectory
            });
          } catch (e) {
            const toPathComponents = to.split("/");
            toPathComponents.pop();
            const toPath2 = toPathComponents.join("/");
            if (toPathComponents.length > 0) {
              const toParentDirectory = await this.stat({
                path: toPath2,
                directory: toDirectory
              });
              if (toParentDirectory.type !== "directory") {
                throw new Error("Parent directory of the to path is a file");
              }
            }
          }
          if (toObj && toObj.type === "directory") {
            throw new Error("Cannot overwrite a directory with a file");
          }
          const fromObj = await this.stat({
            path: from,
            directory: fromDirectory
          });
          const updateTime = async (path, ctime2, mtime) => {
            const fullPath = this.getPath(toDirectory, path);
            const entry = await this.dbRequest("get", [fullPath]);
            entry.ctime = ctime2;
            entry.mtime = mtime;
            await this.dbRequest("put", [entry]);
          };
          const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
          switch (fromObj.type) {
            // The "from" object is a file
            case "file": {
              const file = await this.readFile({
                path: from,
                directory: fromDirectory
              });
              if (doRename) {
                await this.deleteFile({
                  path: from,
                  directory: fromDirectory
                });
              }
              let encoding;
              if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
                encoding = Encoding.UTF8;
              }
              const writeResult = await this.writeFile({
                path: to,
                directory: toDirectory,
                data: file.data,
                encoding
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
              return writeResult;
            }
            case "directory": {
              if (toObj) {
                throw Error("Cannot move a directory over an existing object");
              }
              try {
                await this.mkdir({
                  path: to,
                  directory: toDirectory,
                  recursive: false
                });
                if (doRename) {
                  await updateTime(to, ctime, fromObj.mtime);
                }
              } catch (e) {
              }
              const contents = (await this.readdir({
                path: from,
                directory: fromDirectory
              })).files;
              for (const filename of contents) {
                await this._copy({
                  from: `${from}/${filename.name}`,
                  to: `${to}/${filename.name}`,
                  directory: fromDirectory,
                  toDirectory
                }, doRename);
              }
              if (doRename) {
                await this.rmdir({
                  path: from,
                  directory: fromDirectory
                });
              }
            }
          }
          return {
            uri: toPath
          };
        }
        isBase64String(str) {
          try {
            return btoa(atob(str)) == str;
          } catch (err) {
            return false;
          }
        }
      };
      FilesystemWeb._debug = true;
    }
  });

  // node_modules/@capacitor-community/sqlite/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    CapacitorSQLiteWeb: () => CapacitorSQLiteWeb
  });
  var CapacitorSQLiteWeb;
  var init_web2 = __esm({
    "node_modules/@capacitor-community/sqlite/dist/esm/web.js"() {
      init_dist();
      CapacitorSQLiteWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.jeepSqliteElement = null;
          this.isWebStoreOpen = false;
        }
        async initWebStore() {
          await customElements.whenDefined("jeep-sqlite");
          this.jeepSqliteElement = document.querySelector("jeep-sqlite");
          this.ensureJeepSqliteIsAvailable();
          this.jeepSqliteElement.addEventListener("jeepSqliteImportProgress", (event) => {
            this.notifyListeners("sqliteImportProgressEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqliteExportProgress", (event) => {
            this.notifyListeners("sqliteExportProgressEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqliteHTTPRequestEnded", (event) => {
            this.notifyListeners("sqliteHTTPRequestEndedEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqlitePickDatabaseEnded", (event) => {
            this.notifyListeners("sqlitePickDatabaseEndedEvent", event.detail);
          });
          this.jeepSqliteElement.addEventListener("jeepSqliteSaveDatabaseToDisk", (event) => {
            this.notifyListeners("sqliteSaveDatabaseToDiskEvent", event.detail);
          });
          if (!this.isWebStoreOpen) {
            this.isWebStoreOpen = await this.jeepSqliteElement.isStoreOpen();
          }
          return;
        }
        async saveToStore(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.saveToStore(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getFromLocalDiskToStore(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.getFromLocalDiskToStore(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async saveToLocalDisk(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.saveToLocalDisk(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async echo(options) {
          this.ensureJeepSqliteIsAvailable();
          const echoResult = await this.jeepSqliteElement.echo(options);
          return echoResult;
        }
        async createConnection(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.createConnection(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async open(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.open(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async closeConnection(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.closeConnection(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getVersion(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const versionResult = await this.jeepSqliteElement.getVersion(options);
            return versionResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async checkConnectionsConsistency(options) {
          this.ensureJeepSqliteIsAvailable();
          try {
            const consistencyResult = await this.jeepSqliteElement.checkConnectionsConsistency(options);
            return consistencyResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async close(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.close(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async beginTransaction(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const changes = await this.jeepSqliteElement.beginTransaction(options);
            return changes;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async commitTransaction(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const changes = await this.jeepSqliteElement.commitTransaction(options);
            return changes;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async rollbackTransaction(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const changes = await this.jeepSqliteElement.rollbackTransaction(options);
            return changes;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isTransactionActive(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const result = await this.jeepSqliteElement.isTransactionActive(options);
            return result;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getTableList(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const tableListResult = await this.jeepSqliteElement.getTableList(options);
            return tableListResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async execute(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const executeResult = await this.jeepSqliteElement.execute(options);
            return executeResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async executeSet(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const executeResult = await this.jeepSqliteElement.executeSet(options);
            return executeResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async run(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const runResult = await this.jeepSqliteElement.run(options);
            return runResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async query(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const queryResult = await this.jeepSqliteElement.query(options);
            return queryResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isDBExists(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const dbExistsResult = await this.jeepSqliteElement.isDBExists(options);
            return dbExistsResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isDBOpen(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const isDBOpenResult = await this.jeepSqliteElement.isDBOpen(options);
            return isDBOpenResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isDatabase(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const isDatabaseResult = await this.jeepSqliteElement.isDatabase(options);
            return isDatabaseResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isTableExists(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const tableExistsResult = await this.jeepSqliteElement.isTableExists(options);
            return tableExistsResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async deleteDatabase(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.deleteDatabase(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async isJsonValid(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const isJsonValidResult = await this.jeepSqliteElement.isJsonValid(options);
            return isJsonValidResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async importFromJson(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const importFromJsonResult = await this.jeepSqliteElement.importFromJson(options);
            return importFromJsonResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async exportToJson(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const exportToJsonResult = await this.jeepSqliteElement.exportToJson(options);
            return exportToJsonResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async createSyncTable(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const createSyncTableResult = await this.jeepSqliteElement.createSyncTable(options);
            return createSyncTableResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async setSyncDate(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.setSyncDate(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getSyncDate(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const getSyncDateResult = await this.jeepSqliteElement.getSyncDate(options);
            return getSyncDateResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async deleteExportedRows(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.deleteExportedRows(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async addUpgradeStatement(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.addUpgradeStatement(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async copyFromAssets(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.copyFromAssets(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getFromHTTPRequest(options) {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            await this.jeepSqliteElement.getFromHTTPRequest(options);
            return;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        async getDatabaseList() {
          this.ensureJeepSqliteIsAvailable();
          this.ensureWebstoreIsOpen();
          try {
            const databaseListResult = await this.jeepSqliteElement.getDatabaseList();
            return databaseListResult;
          } catch (err) {
            throw new Error(`${err}`);
          }
        }
        /**
         * Checks if the `jeep-sqlite` element is present in the DOM.
         * If it's not in the DOM, this method throws an Error.
         *
         * Attention: This will always fail, if the `intWebStore()` method wasn't called before.
         */
        ensureJeepSqliteIsAvailable() {
          if (this.jeepSqliteElement === null) {
            throw new Error(`The jeep-sqlite element is not present in the DOM! Please check the @capacitor-community/sqlite documentation for instructions regarding the web platform.`);
          }
        }
        ensureWebstoreIsOpen() {
          if (!this.isWebStoreOpen) {
            throw new Error('WebStore is not open yet. You have to call "initWebStore()" first.');
          }
        }
        ////////////////////////////////////
        ////// UNIMPLEMENTED METHODS
        ////////////////////////////////////
        async getUrl() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getMigratableDbList(options) {
          console.log("getMigratableDbList", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async addSQLiteSuffix(options) {
          console.log("addSQLiteSuffix", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteOldDatabases(options) {
          console.log("deleteOldDatabases", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async moveDatabasesAndAddSuffix(options) {
          console.log("moveDatabasesAndAddSuffix", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isSecretStored() {
          throw this.unimplemented("Not implemented on web.");
        }
        async setEncryptionSecret(options) {
          console.log("setEncryptionSecret", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async changeEncryptionSecret(options) {
          console.log("changeEncryptionSecret", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async clearEncryptionSecret() {
          console.log("clearEncryptionSecret");
          throw this.unimplemented("Not implemented on web.");
        }
        async checkEncryptionSecret(options) {
          console.log("checkEncryptionPassPhrase", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async getNCDatabasePath(options) {
          console.log("getNCDatabasePath", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async createNCConnection(options) {
          console.log("createNCConnection", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async closeNCConnection(options) {
          console.log("closeNCConnection", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isNCDatabase(options) {
          console.log("isNCDatabase", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isDatabaseEncrypted(options) {
          console.log("isDatabaseEncrypted", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async isInConfigEncryption() {
          throw this.unimplemented("Not implemented on web.");
        }
        async isInConfigBiometricAuth() {
          throw this.unimplemented("Not implemented on web.");
        }
        async loadExtension(options) {
          console.log("loadExtension", options);
          throw this.unimplemented("Not implemented on web.");
        }
        async enableLoadExtension(options) {
          console.log("enableLoadExtension", options);
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // plugins/ljd-local-security/dist/esm/web.js
  var web_exports3 = {};
  __export(web_exports3, {
    LjdLocalSecurityWeb: () => LjdLocalSecurityWeb
  });
  var LjdLocalSecurityWeb;
  var init_web3 = __esm({
    "plugins/ljd-local-security/dist/esm/web.js"() {
      "use strict";
      init_dist();
      LjdLocalSecurityWeb = class extends WebPlugin {
        async generateSecret() {
          throw this.unimplemented("Not implemented on web.");
        }
        async setSecret() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getSecret() {
          throw this.unimplemented("Not implemented on web.");
        }
        async existsSecret() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deleteSecret() {
          throw this.unimplemented("Not implemented on web.");
        }
        async inspectPath() {
          throw this.unimplemented("Not implemented on web.");
        }
        async setCompleteProtection() {
          throw this.unimplemented("Not implemented on web.");
        }
        async resolveCandidatePaths() {
          throw this.unimplemented("Not implemented on web.");
        }
        async ensureProbeFile() {
          throw this.unimplemented("Not implemented on web.");
        }
        async deletePath() {
          throw this.unimplemented("Not implemented on web.");
        }
        async inspectGenericPasswordAccessibility() {
          throw this.unimplemented("Not implemented on web.");
        }
        async setExcludedFromBackup() {
          throw this.unimplemented("Not implemented on web.");
        }
        async resolveApplicationSupportLjdDir() {
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  init_dist();

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor/synapse/dist/synapse.mjs
  function s(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return new Proxy({}, {
            get(w, o) {
              return (c, p, r) => {
                const i = t.Capacitor.Plugins[n];
                if (i === void 0) {
                  r(new Error(`Capacitor plugin ${n} not found`));
                  return;
                }
                if (typeof i[o] != "function") {
                  r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                  return;
                }
                (async () => {
                  try {
                    const a = await i[o](c);
                    p(a);
                  } catch (a) {
                    r(a);
                  }
                })();
              };
            }
          });
        }
      }
    );
  }
  function u(t) {
    t.CapacitorUtils.Synapse = new Proxy(
      {},
      {
        get(e, n) {
          return t.cordova.plugins[n];
        }
      }
    );
  }
  function f(t = false) {
    typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
  }

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  init_definitions();
  var Filesystem = registerPlugin("Filesystem", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.FilesystemWeb())
  });
  f();

  // src/lib/local-first/journal/database.ts
  init_dist();

  // node_modules/@capacitor-community/sqlite/dist/esm/index.js
  init_dist();

  // node_modules/@capacitor-community/sqlite/dist/esm/definitions.js
  var SQLiteConnection = class {
    constructor(sqlite) {
      this.sqlite = sqlite;
      this._connectionDict = /* @__PURE__ */ new Map();
    }
    async initWebStore() {
      try {
        await this.sqlite.initWebStore();
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async saveToStore(database) {
      try {
        await this.sqlite.saveToStore({ database });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async saveToLocalDisk(database) {
      try {
        await this.sqlite.saveToLocalDisk({ database });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getFromLocalDiskToStore(overwrite) {
      const mOverwrite = overwrite != null ? overwrite : true;
      try {
        await this.sqlite.getFromLocalDiskToStore({ overwrite: mOverwrite });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async echo(value) {
      try {
        const res = await this.sqlite.echo({ value });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isSecretStored() {
      try {
        const res = await this.sqlite.isSecretStored();
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async setEncryptionSecret(passphrase) {
      try {
        await this.sqlite.setEncryptionSecret({ passphrase });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async changeEncryptionSecret(passphrase, oldpassphrase) {
      try {
        await this.sqlite.changeEncryptionSecret({
          passphrase,
          oldpassphrase
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async clearEncryptionSecret() {
      try {
        await this.sqlite.clearEncryptionSecret();
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async checkEncryptionSecret(passphrase) {
      try {
        const res = await this.sqlite.checkEncryptionSecret({
          passphrase
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async addUpgradeStatement(database, upgrade) {
      try {
        if (database.endsWith(".db"))
          database = database.slice(0, -3);
        await this.sqlite.addUpgradeStatement({
          database,
          upgrade
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async createConnection(database, encrypted, mode, version, readonly) {
      try {
        if (database.endsWith(".db"))
          database = database.slice(0, -3);
        await this.sqlite.createConnection({
          database,
          encrypted,
          mode,
          version,
          readonly
        });
        const conn = new SQLiteDBConnection(database, readonly, this.sqlite);
        const connName = readonly ? `RO_${database}` : `RW_${database}`;
        this._connectionDict.set(connName, conn);
        return Promise.resolve(conn);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async closeConnection(database, readonly) {
      try {
        if (database.endsWith(".db"))
          database = database.slice(0, -3);
        await this.sqlite.closeConnection({ database, readonly });
        const connName = readonly ? `RO_${database}` : `RW_${database}`;
        this._connectionDict.delete(connName);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isConnection(database, readonly) {
      const res = {};
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      const connName = readonly ? `RO_${database}` : `RW_${database}`;
      res.result = this._connectionDict.has(connName);
      return Promise.resolve(res);
    }
    async retrieveConnection(database, readonly) {
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      const connName = readonly ? `RO_${database}` : `RW_${database}`;
      if (this._connectionDict.has(connName)) {
        const conn = this._connectionDict.get(connName);
        if (typeof conn != "undefined")
          return Promise.resolve(conn);
        else {
          return Promise.reject(`Connection ${database} is undefined`);
        }
      } else {
        return Promise.reject(`Connection ${database} does not exist`);
      }
    }
    async getNCDatabasePath(path, database) {
      try {
        const databasePath = await this.sqlite.getNCDatabasePath({
          path,
          database
        });
        return Promise.resolve(databasePath);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async createNCConnection(databasePath, version) {
      try {
        await this.sqlite.createNCConnection({
          databasePath,
          version
        });
        const conn = new SQLiteDBConnection(databasePath, true, this.sqlite);
        const connName = `RO_${databasePath})`;
        this._connectionDict.set(connName, conn);
        return Promise.resolve(conn);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async closeNCConnection(databasePath) {
      try {
        await this.sqlite.closeNCConnection({ databasePath });
        const connName = `RO_${databasePath})`;
        this._connectionDict.delete(connName);
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isNCConnection(databasePath) {
      const res = {};
      const connName = `RO_${databasePath})`;
      res.result = this._connectionDict.has(connName);
      return Promise.resolve(res);
    }
    async retrieveNCConnection(databasePath) {
      if (this._connectionDict.has(databasePath)) {
        const connName = `RO_${databasePath})`;
        const conn = this._connectionDict.get(connName);
        if (typeof conn != "undefined")
          return Promise.resolve(conn);
        else {
          return Promise.reject(`Connection ${databasePath} is undefined`);
        }
      } else {
        return Promise.reject(`Connection ${databasePath} does not exist`);
      }
    }
    async isNCDatabase(databasePath) {
      try {
        const res = await this.sqlite.isNCDatabase({ databasePath });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async retrieveAllConnections() {
      return this._connectionDict;
    }
    async closeAllConnections() {
      const delDict = /* @__PURE__ */ new Map();
      try {
        for (const key of this._connectionDict.keys()) {
          const database = key.substring(3);
          const readonly = key.substring(0, 3) === "RO_" ? true : false;
          await this.sqlite.closeConnection({ database, readonly });
          delDict.set(key, null);
        }
        for (const key of delDict.keys()) {
          this._connectionDict.delete(key);
        }
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async checkConnectionsConsistency() {
      try {
        const keys = [...this._connectionDict.keys()];
        const openModes = [];
        const dbNames = [];
        for (const key of keys) {
          openModes.push(key.substring(0, 2));
          dbNames.push(key.substring(3));
        }
        const res = await this.sqlite.checkConnectionsConsistency({
          dbNames,
          openModes
        });
        if (!res.result)
          this._connectionDict = /* @__PURE__ */ new Map();
        return Promise.resolve(res);
      } catch (err) {
        this._connectionDict = /* @__PURE__ */ new Map();
        return Promise.reject(err);
      }
    }
    async importFromJson(jsonstring) {
      try {
        const ret = await this.sqlite.importFromJson({ jsonstring });
        return Promise.resolve(ret);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isJsonValid(jsonstring) {
      try {
        const ret = await this.sqlite.isJsonValid({ jsonstring });
        return Promise.resolve(ret);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async copyFromAssets(overwrite) {
      const mOverwrite = overwrite != null ? overwrite : true;
      try {
        await this.sqlite.copyFromAssets({ overwrite: mOverwrite });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getFromHTTPRequest(url, overwrite) {
      const mOverwrite = overwrite != null ? overwrite : true;
      try {
        await this.sqlite.getFromHTTPRequest({ url, overwrite: mOverwrite });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isDatabaseEncrypted(database) {
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      try {
        const res = await this.sqlite.isDatabaseEncrypted({ database });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isInConfigEncryption() {
      try {
        const res = await this.sqlite.isInConfigEncryption();
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isInConfigBiometricAuth() {
      try {
        const res = await this.sqlite.isInConfigBiometricAuth();
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isDatabase(database) {
      if (database.endsWith(".db"))
        database = database.slice(0, -3);
      try {
        const res = await this.sqlite.isDatabase({ database });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getDatabaseList() {
      try {
        const res = await this.sqlite.getDatabaseList();
        const values = res.values;
        values.sort();
        const ret = { values };
        return Promise.resolve(ret);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getMigratableDbList(folderPath) {
      const path = folderPath ? folderPath : "default";
      try {
        const res = await this.sqlite.getMigratableDbList({
          folderPath: path
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async addSQLiteSuffix(folderPath, dbNameList) {
      const path = folderPath ? folderPath : "default";
      const dbList = dbNameList ? dbNameList : [];
      try {
        const res = await this.sqlite.addSQLiteSuffix({
          folderPath: path,
          dbNameList: dbList
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async deleteOldDatabases(folderPath, dbNameList) {
      const path = folderPath ? folderPath : "default";
      const dbList = dbNameList ? dbNameList : [];
      try {
        const res = await this.sqlite.deleteOldDatabases({
          folderPath: path,
          dbNameList: dbList
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async moveDatabasesAndAddSuffix(folderPath, dbNameList) {
      const path = folderPath ? folderPath : "default";
      const dbList = dbNameList ? dbNameList : [];
      return this.sqlite.moveDatabasesAndAddSuffix({
        folderPath: path,
        dbNameList: dbList
      });
    }
  };
  var SQLiteDBConnection = class {
    constructor(dbName, readonly, sqlite) {
      this.dbName = dbName;
      this.readonly = readonly;
      this.sqlite = sqlite;
    }
    getConnectionDBName() {
      return this.dbName;
    }
    getConnectionReadOnly() {
      return this.readonly;
    }
    async open() {
      try {
        await this.sqlite.open({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async close() {
      try {
        await this.sqlite.close({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async beginTransaction() {
      try {
        const changes = await this.sqlite.beginTransaction({
          database: this.dbName
        });
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async commitTransaction() {
      try {
        const changes = await this.sqlite.commitTransaction({
          database: this.dbName
        });
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async rollbackTransaction() {
      try {
        const changes = await this.sqlite.rollbackTransaction({
          database: this.dbName
        });
        return Promise.resolve(changes);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isTransactionActive() {
      try {
        const result = await this.sqlite.isTransactionActive({
          database: this.dbName
        });
        return Promise.resolve(result);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async loadExtension(path) {
      try {
        await this.sqlite.loadExtension({
          database: this.dbName,
          path,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async enableLoadExtension(toggle) {
      try {
        await this.sqlite.enableLoadExtension({
          database: this.dbName,
          toggle,
          readonly: this.readonly
        });
        return Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getUrl() {
      try {
        const res = await this.sqlite.getUrl({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getVersion() {
      try {
        const version = await this.sqlite.getVersion({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(version);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getTableList() {
      try {
        const res = await this.sqlite.getTableList({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async execute(statements, transaction = true, isSQL92 = true) {
      try {
        if (!this.readonly) {
          const res = await this.sqlite.execute({
            database: this.dbName,
            statements,
            transaction,
            readonly: false,
            isSQL92
          });
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async query(statement, values, isSQL92 = true) {
      let res;
      try {
        if (values && values.length > 0) {
          res = await this.sqlite.query({
            database: this.dbName,
            statement,
            values,
            readonly: this.readonly,
            isSQL92: true
          });
        } else {
          res = await this.sqlite.query({
            database: this.dbName,
            statement,
            values: [],
            readonly: this.readonly,
            isSQL92
          });
        }
        res = await this.reorderRows(res);
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async run(statement, values, transaction = true, returnMode = "no", isSQL92 = true) {
      let res;
      try {
        if (!this.readonly) {
          if (values && values.length > 0) {
            res = await this.sqlite.run({
              database: this.dbName,
              statement,
              values,
              transaction,
              readonly: false,
              returnMode,
              isSQL92: true
            });
          } else {
            res = await this.sqlite.run({
              database: this.dbName,
              statement,
              values: [],
              transaction,
              readonly: false,
              returnMode,
              isSQL92
            });
          }
          res.changes = await this.reorderRows(res.changes);
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async executeSet(set, transaction = true, returnMode = "no", isSQL92 = true) {
      let res;
      try {
        if (!this.readonly) {
          res = await this.sqlite.executeSet({
            database: this.dbName,
            set,
            transaction,
            readonly: false,
            returnMode,
            isSQL92
          });
          res.changes = await this.reorderRows(res.changes);
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isExists() {
      try {
        const res = await this.sqlite.isDBExists({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isTable(table) {
      try {
        const res = await this.sqlite.isTableExists({
          database: this.dbName,
          table,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async isDBOpen() {
      try {
        const res = await this.sqlite.isDBOpen({
          database: this.dbName,
          readonly: this.readonly
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async delete() {
      try {
        if (!this.readonly) {
          await this.sqlite.deleteDatabase({
            database: this.dbName,
            readonly: false
          });
          return Promise.resolve();
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async createSyncTable() {
      try {
        if (!this.readonly) {
          const res = await this.sqlite.createSyncTable({
            database: this.dbName,
            readonly: false
          });
          return Promise.resolve(res);
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async setSyncDate(syncdate) {
      try {
        if (!this.readonly) {
          await this.sqlite.setSyncDate({
            database: this.dbName,
            syncdate,
            readonly: false
          });
          return Promise.resolve();
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async getSyncDate() {
      try {
        const res = await this.sqlite.getSyncDate({
          database: this.dbName,
          readonly: this.readonly
        });
        let retDate = "";
        if (res.syncDate > 0)
          retDate = new Date(res.syncDate * 1e3).toISOString();
        return Promise.resolve(retDate);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async exportToJson(mode, encrypted = false) {
      try {
        const res = await this.sqlite.exportToJson({
          database: this.dbName,
          jsonexportmode: mode,
          readonly: this.readonly,
          encrypted
        });
        return Promise.resolve(res);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async deleteExportedRows() {
      try {
        if (!this.readonly) {
          await this.sqlite.deleteExportedRows({
            database: this.dbName,
            readonly: false
          });
          return Promise.resolve();
        } else {
          return Promise.reject("not allowed in read-only mode");
        }
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async executeTransaction(txn, isSQL92 = true) {
      let changes = 0;
      let isActive = false;
      if (!this.readonly) {
        await this.sqlite.beginTransaction({
          database: this.dbName
        });
        isActive = await this.sqlite.isTransactionActive({
          database: this.dbName
        });
        if (!isActive) {
          return Promise.reject("After Begin Transaction, no transaction active");
        }
        try {
          for (const task of txn) {
            if (typeof task !== "object" || !("statement" in task)) {
              throw new Error("Error a task.statement must be provided");
            }
            if ("values" in task && task.values && task.values.length > 0) {
              const retMode = task.statement.toUpperCase().includes("RETURNING") ? "all" : "no";
              const ret = await this.sqlite.run({
                database: this.dbName,
                statement: task.statement,
                values: task.values,
                transaction: false,
                readonly: false,
                returnMode: retMode,
                isSQL92
              });
              if (ret.changes.changes < 0) {
                throw new Error("Error in transaction method run ");
              }
              changes += ret.changes.changes;
            } else {
              const ret = await this.sqlite.execute({
                database: this.dbName,
                statements: task.statement,
                transaction: false,
                readonly: false
              });
              if (ret.changes.changes < 0) {
                throw new Error("Error in transaction method execute ");
              }
              changes += ret.changes.changes;
            }
          }
          const retC = await this.sqlite.commitTransaction({
            database: this.dbName
          });
          changes += retC.changes.changes;
          const retChanges = { changes: { changes } };
          return Promise.resolve(retChanges);
        } catch (err) {
          const msg = err.message ? err.message : err;
          await this.sqlite.rollbackTransaction({
            database: this.dbName
          });
          return Promise.reject(msg);
        }
      } else {
        return Promise.reject("not allowed in read-only mode");
      }
    }
    async reorderRows(res) {
      const retRes = res;
      if (res?.values && typeof res.values[0] === "object") {
        if (Object.keys(res.values[0]).includes("ios_columns")) {
          const columnList = res.values[0]["ios_columns"];
          const iosRes = [];
          for (let i = 1; i < res.values.length; i++) {
            const rowJson = res.values[i];
            const resRowJson = {};
            for (const item of columnList) {
              resRowJson[item] = rowJson[item];
            }
            iosRes.push(resRowJson);
          }
          retRes["values"] = iosRes;
        }
      }
      return Promise.resolve(retRes);
    }
  };

  // node_modules/@capacitor-community/sqlite/dist/esm/index.js
  var CapacitorSQLite = registerPlugin("CapacitorSQLite", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.CapacitorSQLiteWeb()),
    electron: () => window.CapacitorCustomPlatform.plugins.CapacitorSQLite
  });

  // src/lib/local-first/journal/types.ts
  var LOCAL_JOURNAL_DB_NAME = "ljd_local_journal";
  var LOCAL_JOURNAL_SCHEMA_USER_VERSION = 1;

  // src/lib/local-first/journal/database.ts
  var connection = null;
  var db = null;
  function assertLocalJournalNative() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Local Journal foundation is native-only.");
    }
  }
  function getConnection() {
    if (!connection) connection = new SQLiteConnection(CapacitorSQLite);
    return connection;
  }
  var SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS local_journal_entries (
  stable_id TEXT PRIMARY KEY NOT NULL,
  date_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  schema_version INTEGER NOT NULL,
  source TEXT NOT NULL,
  local_status TEXT NOT NULL,
  imported_at TEXT,
  legacy_server_id TEXT,
  server_updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_journal_date
  ON local_journal_entries (date_key);

CREATE INDEX IF NOT EXISTS idx_local_journal_updated
  ON local_journal_entries (updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_local_journal_legacy_server
  ON local_journal_entries (legacy_server_id)
  WHERE legacy_server_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS local_journal_tags (
  journal_stable_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (journal_stable_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_local_journal_tags_tag
  ON local_journal_tags (tag);

CREATE TABLE IF NOT EXISTS local_media (
  stable_id TEXT PRIMARY KEY NOT NULL,
  journal_stable_id TEXT NOT NULL,
  type TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  checksum TEXT,
  mime_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_local_media_journal
  ON local_media (journal_stable_id);
`;
  async function readUserVersion(database) {
    const versionResult = await database.query("PRAGMA user_version;");
    const raw = versionResult.values?.[0];
    const current = typeof raw?.user_version === "number" ? raw.user_version : typeof raw?.user_version === "string" ? Number(raw.user_version) : Number(Object.values(raw ?? {})[0] ?? 0);
    return Number.isFinite(current) ? current : 0;
  }
  async function applyFoundationSchema(database) {
    await database.execute(SCHEMA_SQL);
    await database.execute(`PRAGMA user_version = ${LOCAL_JOURNAL_SCHEMA_USER_VERSION};`);
  }
  async function withLocalJournalTransaction(fn) {
    const database = await openLocalJournalDatabase();
    await database.execute("BEGIN;");
    try {
      const result = await fn(database);
      await database.execute("COMMIT;");
      return result;
    } catch (err) {
      try {
        await database.execute("ROLLBACK;");
      } catch {
      }
      throw err;
    }
  }
  async function openLocalJournalDatabase() {
    assertLocalJournalNative();
    if (db) return db;
    const sqlite = getConnection();
    const consistency = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(LOCAL_JOURNAL_DB_NAME, false)).result;
    if (consistency.result && isConn) {
      db = await sqlite.retrieveConnection(LOCAL_JOURNAL_DB_NAME, false);
    } else {
      db = await sqlite.createConnection(
        LOCAL_JOURNAL_DB_NAME,
        false,
        "no-encryption",
        LOCAL_JOURNAL_SCHEMA_USER_VERSION,
        false
      );
    }
    await db.open();
    const current = await readUserVersion(db);
    if (current < LOCAL_JOURNAL_SCHEMA_USER_VERSION) {
      await applyFoundationSchema(db);
    }
    return db;
  }

  // src/lib/local-first/journal/mediaStore.ts
  init_dist();
  function assertNative() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Local Journal media store is native-only.");
    }
  }
  async function resolveJournalMediaUri(relativePath) {
    assertNative();
    const result = await Filesystem.getUri({
      path: relativePath,
      directory: Directory.Library
    });
    return Capacitor.convertFileSrc(result.uri);
  }
  async function deleteJournalMediaRelative(relativePath) {
    assertNative();
    try {
      await Filesystem.deleteFile({
        path: relativePath,
        directory: Directory.Library
      });
    } catch {
    }
  }

  // src/lib/local-first/journal/repository.ts
  function parseTagsJson(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(String);
    } catch {
      return [];
    }
  }
  async function loadMediaForJournal(journalStableId) {
    const db2 = await openLocalJournalDatabase();
    const result = await db2.query(
      `SELECT stable_id, journal_stable_id, type, relative_path, created_at, checksum, mime_type
     FROM local_media WHERE journal_stable_id = ?;`,
      [journalStableId]
    );
    return (result.values ?? []).map((r) => ({
      stableId: String(r.stable_id),
      journalStableId: String(r.journal_stable_id),
      type: String(r.type),
      relativePath: String(r.relative_path),
      createdAt: String(r.created_at),
      checksum: r.checksum == null ? null : String(r.checksum),
      mimeType: r.mime_type == null ? null : String(r.mime_type)
    }));
  }
  function mapEntryRow(r, mediaRefs) {
    return {
      stableId: String(r.stable_id),
      dateKey: String(r.date_key),
      title: String(r.title),
      content: String(r.content),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
      tags: parseTagsJson(String(r.tags_json ?? "[]")),
      mediaRefs,
      schemaVersion: Number(r.schema_version),
      source: String(r.source),
      localStatus: String(r.local_status),
      importedAt: r.imported_at == null ? null : String(r.imported_at),
      legacyServerId: r.legacy_server_id == null ? null : String(r.legacy_server_id),
      serverUpdatedAt: r.server_updated_at == null ? null : String(r.server_updated_at)
    };
  }
  var JournalRepository = {
    async save(entry) {
      await withLocalJournalTransaction(async (db2) => {
        await db2.run(
          `INSERT OR REPLACE INTO local_journal_entries (
          stable_id, date_key, title, content, created_at, updated_at,
          tags_json, schema_version, source, local_status, imported_at, legacy_server_id,
          server_updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
          [
            entry.stableId,
            entry.dateKey,
            entry.title,
            entry.content,
            entry.createdAt,
            entry.updatedAt,
            JSON.stringify(entry.tags),
            entry.schemaVersion,
            entry.source,
            entry.localStatus,
            entry.importedAt,
            entry.legacyServerId,
            entry.serverUpdatedAt
          ]
        );
        await db2.run(`DELETE FROM local_journal_tags WHERE journal_stable_id = ?;`, [
          entry.stableId
        ]);
        for (const tag of entry.tags) {
          await db2.run(
            `INSERT OR REPLACE INTO local_journal_tags (journal_stable_id, tag) VALUES (?, ?);`,
            [entry.stableId, tag]
          );
        }
        await db2.run(`DELETE FROM local_media WHERE journal_stable_id = ?;`, [entry.stableId]);
        for (const media of entry.mediaRefs) {
          await db2.run(
            `INSERT OR REPLACE INTO local_media (
            stable_id, journal_stable_id, type, relative_path, created_at, checksum, mime_type
          ) VALUES (?,?,?,?,?,?,?);`,
            [
              media.stableId,
              media.journalStableId,
              media.type,
              media.relativePath,
              media.createdAt,
              media.checksum,
              media.mimeType
            ]
          );
        }
      });
    },
    async getById(stableId) {
      const db2 = await openLocalJournalDatabase();
      const result = await db2.query(
        `SELECT * FROM local_journal_entries WHERE stable_id = ? AND local_status = 'active' LIMIT 1;`,
        [stableId]
      );
      const row = result.values?.[0];
      if (!row) return null;
      return mapEntryRow(row, await loadMediaForJournal(stableId));
    },
    async getByLegacyServerId(legacyServerId) {
      const db2 = await openLocalJournalDatabase();
      const result = await db2.query(
        `SELECT * FROM local_journal_entries
       WHERE legacy_server_id = ? AND local_status = 'active' LIMIT 1;`,
        [legacyServerId]
      );
      const row = result.values?.[0];
      if (!row) return null;
      return mapEntryRow(row, await loadMediaForJournal(String(row.stable_id)));
    },
    /** @deprecated Prefer getByLegacyServerId */
    async findByLegacyServerId(legacyServerId) {
      return this.getByLegacyServerId(legacyServerId);
    },
    async list() {
      const db2 = await openLocalJournalDatabase();
      const result = await db2.query(
        `SELECT * FROM local_journal_entries
       WHERE local_status = 'active'
       ORDER BY date_key DESC, created_at DESC;`
      );
      const out = [];
      for (const row of result.values ?? []) {
        const r = row;
        out.push(mapEntryRow(r, await loadMediaForJournal(String(r.stable_id))));
      }
      return out;
    },
    async count() {
      const db2 = await openLocalJournalDatabase();
      const result = await db2.query(
        `SELECT COUNT(*) AS c FROM local_journal_entries WHERE local_status = 'active';`
      );
      const row = result.values?.[0];
      return Number(row?.c ?? 0);
    },
    /**
     * Diagnostics / test cleanup only — deletes all local journal rows + returns media paths.
     * Does not touch Neon / Blob.
     */
    async deleteAll() {
      const listed = await this.list();
      const relativePaths = [];
      await withLocalJournalTransaction(async (db2) => {
        for (const entry of listed) {
          for (const m of entry.mediaRefs) relativePaths.push(m.relativePath);
          await db2.run(`DELETE FROM local_media WHERE journal_stable_id = ?;`, [entry.stableId]);
          await db2.run(`DELETE FROM local_journal_tags WHERE journal_stable_id = ?;`, [
            entry.stableId
          ]);
          await db2.run(`DELETE FROM local_journal_entries WHERE stable_id = ?;`, [entry.stableId]);
        }
      });
      return relativePaths;
    },
    /** @deprecated Prefer deleteAll */
    async deletePocData() {
      return this.deleteAll();
    }
  };

  // src/lib/local-first/security/runLocalDataProtectionPoc.ts
  init_dist();

  // plugins/ljd-local-security/dist/esm/index.js
  init_dist();
  var LjdLocalSecurity = registerPlugin("LjdLocalSecurity", {
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.LjdLocalSecurityWeb())
  });

  // src/lib/local-first/security/secureKeyStore.ts
  init_dist();
  var POC_ACCOUNT = "ljd.security.poc.db-key";
  function assertNative2() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("SecureKeyStore PoC is native-only.");
    }
  }
  async function generateRandomSecret(byteLength = 32) {
    assertNative2();
    const result = await LjdLocalSecurity.generateSecret({ byteLength });
    return {
      secret: result.secret,
      byteLength: result.byteLength,
      randomSource: result.randomSource
    };
  }
  async function setSecret(account, secret) {
    assertNative2();
    const result = await LjdLocalSecurity.setSecret({ account, secret });
    return {
      stored: result.stored,
      exists: true,
      accessibility: result.accessibility,
      byteLength: result.byteLength
    };
  }
  async function getSecret(account) {
    assertNative2();
    const result = await LjdLocalSecurity.getSecret({ account });
    return {
      found: result.found,
      secret: result.found ? result.secret ?? null : null,
      accessibility: result.accessibility ?? null,
      byteLength: result.byteLength ?? null
    };
  }
  async function existsSecret(account) {
    assertNative2();
    const result = await LjdLocalSecurity.existsSecret({ account });
    return {
      stored: result.exists,
      exists: result.exists,
      accessibility: result.accessibility ?? null,
      byteLength: null
    };
  }
  async function deleteSecret(account) {
    assertNative2();
    const result = await LjdLocalSecurity.deleteSecret({ account });
    return result.deleted;
  }
  var SecureKeyStore = {
    POC_ACCOUNT,
    generateRandomSecret,
    set: setSecret,
    get: getSecret,
    exists: existsSecret,
    delete: deleteSecret
  };

  // src/lib/local-first/security/runLocalDataProtectionPoc.ts
  var SECURITY_POC_DB = "ljd_security_poc";
  var SECURITY_POC_MEDIA_ROOT = "ljd/media/security-poc";
  var SECURITY_POC_DUMMY_CONTENT = "This is encrypted LJD dummy data";
  function assertNative3() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Security PoC is native-only.");
    }
  }
  function errMsg(e) {
    if (e instanceof Error) return e.message;
    return String(e);
  }
  function randomPassphrase(bytes = 24) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    let out = "";
    for (const b of arr) out += b.toString(16).padStart(2, "0");
    return out;
  }
  function redact(steps) {
    return steps.map((s2) => ({
      ...s2,
      detail: s2.detail.replace(/(secret|passphrase)\s*[=:]\s*\S+/gi, "$1=<redacted>")
    }));
  }
  async function closeIfOpen(sqlite, name) {
    try {
      await sqlite.checkConnectionsConsistency();
    } catch {
    }
    try {
      const isConn = (await sqlite.isConnection(name, false)).result;
      if (isConn) await sqlite.closeConnection(name, false);
    } catch {
      try {
        await CapacitorSQLite.closeConnection({ database: name, readonly: false });
      } catch {
      }
    }
  }
  async function deleteDbIfExists(sqlite, name) {
    await closeIfOpen(sqlite, name);
    try {
      const exists = (await sqlite.isDatabase(name)).result;
      if (exists) await CapacitorSQLite.deleteDatabase({ database: name });
    } catch {
    }
  }
  async function openPlain(sqlite, name) {
    await closeIfOpen(sqlite, name);
    const db2 = await sqlite.createConnection(name, false, "no-encryption", 1, false);
    await db2.open();
    return db2;
  }
  async function queryCount(db2) {
    const res = await db2.query("SELECT COUNT(*) AS c FROM poc_rows;");
    const row = res.values?.[0];
    const c = row?.c ?? Object.values(row ?? {})[0];
    return typeof c === "number" ? c : Number(c ?? 0);
  }
  async function queryContent(db2) {
    const res = await db2.query("SELECT body FROM poc_rows ORDER BY id LIMIT 1;");
    const row = res.values?.[0];
    const body = row?.body ?? Object.values(row ?? {})[0];
    return typeof body === "string" ? body : body != null ? String(body) : null;
  }
  function fmtAttrs(a) {
    const parent = a.parent ? ` parent[excl=${String(a.parent.isExcludedFromBackup)} prot=${a.parent.fileProtection}]` : "";
    return `excl=${String(a.isExcludedFromBackup)} prot=${a.fileProtection} exists=${String(a.exists)}${parent}`;
  }
  async function runLocalDataProtectionPoc(options) {
    assertNative3();
    const steps = [];
    const push = (id, title, status, detail) => {
      steps.push({ id, title, status, detail });
    };
    push(
      "audit",
      "built-in secure store audit",
      "info",
      "KeychainWrapper.storeGenericPasswordFor does NOT set kSecAttrAccessible; no external accessibility API. Verdict B \u2014 not LJD formal SecureKeyStore."
    );
    try {
      const gen = await SecureKeyStore.generateRandomSecret(32);
      push(
        "K1",
        "generate random secret",
        "pass",
        `byteLength=${gen.byteLength} randomSource=${gen.randomSource} (value not logged)`
      );
      const set = await SecureKeyStore.set(SecureKeyStore.POC_ACCOUNT, gen.secret);
      push(
        "K2",
        "Keychain set WhenUnlocked",
        set.stored && set.accessibility === "kSecAttrAccessibleWhenUnlocked" ? "pass" : "fail",
        `stored=${String(set.stored)} accessibility=${set.accessibility ?? "null"} byteLength=${String(set.byteLength)}`
      );
      const got = await SecureKeyStore.get(SecureKeyStore.POC_ACCOUNT);
      push(
        "K3",
        "Keychain get",
        got.found && got.secret === gen.secret && got.accessibility === "kSecAttrAccessibleWhenUnlocked" ? "pass" : "fail",
        `found=${String(got.found)} match=${String(got.secret === gen.secret)} accessibility=${got.accessibility ?? "null"}`
      );
      push(
        "K4",
        "kill/relaunch get",
        "info",
        "Re-run PoC after app kill; K3/exists should remain true until K5. Simulator: use Home + swipe-up kill."
      );
      if (!options?.keystoreOnly) {
        const del = await SecureKeyStore.delete(SecureKeyStore.POC_ACCOUNT);
        const after = await SecureKeyStore.get(SecureKeyStore.POC_ACCOUNT);
        push(
          "K5",
          "Keychain delete",
          del && !after.found ? "pass" : "fail",
          `deleted=${String(del)} foundAfter=${String(after.found)}`
        );
        push(
          "K6",
          "get after delete",
          !after.found ? "pass" : "fail",
          `found=${String(after.found)}`
        );
        const restored = await SecureKeyStore.generateRandomSecret(32);
        await SecureKeyStore.set(SecureKeyStore.POC_ACCOUNT, restored.secret);
        push(
          "K-persist",
          "reseed Keychain for relaunch check",
          "info",
          `stored yes accessibility=kSecAttrAccessibleWhenUnlocked byteLength=${restored.byteLength}`
        );
      }
    } catch (e) {
      push("K-error", "SecureKeyStore suite", "fail", errMsg(e));
    }
    if (options?.keystoreOnly) {
      return {
        ranAt: (/* @__PURE__ */ new Date()).toISOString(),
        platform: Capacitor.getPlatform(),
        steps: redact(steps),
        summary: {
          sqlcipherOk: false,
          secureKeyStoreOk: steps.filter((s2) => s2.id.startsWith("K") && s2.status === "fail").length === 0,
          builtInStoreVerdict: "B",
          builtInStoreNote: "Plugin KeychainWrapper omits kSecAttrAccessible; cannot guarantee WhenUnlocked externally."
        }
      };
    }
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const passphrase1 = randomPassphrase();
    const passphrase2 = randomPassphrase();
    let dbUrl = "";
    try {
      try {
        await CapacitorSQLite.clearEncryptionSecret();
      } catch {
      }
      await closeIfOpen(sqlite, SECURITY_POC_DB);
      const pathsForCleanup = await LjdLocalSecurity.resolveCandidatePaths();
      const pocDbPath = `${pathsForCleanup.candidateA_libraryCapacitorDatabase}/${SECURITY_POC_DB}SQLite.db`;
      await LjdLocalSecurity.deletePath({ path: pocDbPath });
      await deleteDbIfExists(sqlite, SECURITY_POC_DB);
      {
        const db2 = await openPlain(sqlite, SECURITY_POC_DB);
        await db2.execute(`
        CREATE TABLE IF NOT EXISTS poc_rows (
          id INTEGER PRIMARY KEY NOT NULL,
          body TEXT NOT NULL
        );
        DELETE FROM poc_rows;
        INSERT INTO poc_rows (id, body) VALUES (1, '${SECURITY_POC_DUMMY_CONTENT}');
      `);
        const count = await queryCount(db2);
        const body = await queryContent(db2);
        await sqlite.closeConnection(SECURITY_POC_DB, false);
        push(
          "A",
          "plaintext dummy DB",
          count === 1 && body === SECURITY_POC_DUMMY_CONTENT ? "pass" : "fail",
          `rows=${count} contentMatch=${String(body === SECURITY_POC_DUMMY_CONTENT)}`
        );
      }
      await CapacitorSQLite.setEncryptionSecret({ passphrase: passphrase1 });
      const stored = await CapacitorSQLite.isSecretStored();
      push(
        "A-secret",
        "plugin setEncryptionSecret",
        stored.result ? "pass" : "fail",
        `isSecretStored=${String(stored.result)} (plugin Keychain; accessibility not LJD-guaranteed)`
      );
      {
        const beforeCount = 1;
        let migrationKeptPlain = false;
        try {
          const db2 = await sqlite.createConnection(
            SECURITY_POC_DB,
            true,
            "encryption",
            1,
            false
          );
          await db2.open();
          const afterCount = await queryCount(db2);
          const body = await queryContent(db2);
          const enc = await CapacitorSQLite.isDatabaseEncrypted({ database: SECURITY_POC_DB });
          const urlRes = await db2.getUrl();
          dbUrl = urlRes.url ?? "";
          await sqlite.closeConnection(SECURITY_POC_DB, false);
          push(
            "B+mig",
            "plaintext\u2192encrypted (mode=encryption)",
            afterCount === beforeCount && body === SECURITY_POC_DUMMY_CONTENT && enc.result === true ? "pass" : "fail",
            `rowsBefore=${beforeCount} rowsAfter=${afterCount} contentMatch=${String(
              body === SECURITY_POC_DUMMY_CONTENT
            )} encrypted=${String(enc.result)}`
          );
          push(
            "C",
            "isDatabaseEncrypted",
            enc.result === true ? "pass" : "fail",
            `encrypted=${String(enc.result)}`
          );
        } catch (e) {
          try {
            const plain = await openPlain(sqlite, SECURITY_POC_DB);
            const body = await queryContent(plain);
            migrationKeptPlain = body === SECURITY_POC_DUMMY_CONTENT;
            await sqlite.closeConnection(SECURITY_POC_DB, false);
          } catch {
            migrationKeptPlain = false;
          }
          push(
            "B+mig",
            "plaintext\u2192encrypted (mode=encryption)",
            "fail",
            `${errMsg(e)}; plaintextRetained=${String(migrationKeptPlain)}`
          );
          throw e;
        }
      }
      {
        const db2 = await sqlite.createConnection(SECURITY_POC_DB, true, "secret", 1, false);
        await db2.open();
        const body = await queryContent(db2);
        await sqlite.closeConnection(SECURITY_POC_DB, false);
        push(
          "E",
          "reopen with correct secret",
          body === SECURITY_POC_DUMMY_CONTENT ? "pass" : "fail",
          `contentMatch=${String(body === SECURITY_POC_DUMMY_CONTENT)}`
        );
      }
      push(
        "D",
        "app kill / relaunch",
        "info",
        "After kill, reopen with mode=secret should succeed while plugin secret remains. Verified in Simulator session when connection re-opened in this suite (E)."
      );
      {
        await closeIfOpen(sqlite, SECURITY_POC_DB);
        let failed = false;
        try {
          const db2 = await sqlite.createConnection(
            SECURITY_POC_DB,
            true,
            "wrongsecret",
            1,
            false
          );
          await db2.open();
          await sqlite.closeConnection(SECURITY_POC_DB, false);
        } catch {
          failed = true;
          await closeIfOpen(sqlite, SECURITY_POC_DB);
        }
        push(
          "F",
          "wrong secret open fails",
          failed ? "pass" : "fail",
          `openFailedAsExpected=${String(failed)}`
        );
      }
      {
        await CapacitorSQLite.changeEncryptionSecret({
          passphrase: passphrase2,
          oldpassphrase: passphrase1
        });
        push("G", "changeEncryptionSecret", "pass", "plugin changeEncryptionSecret returned");
        const oldCheck = await CapacitorSQLite.checkEncryptionSecret({
          passphrase: passphrase1
        });
        const newCheck = await CapacitorSQLite.checkEncryptionSecret({
          passphrase: passphrase2
        });
        await closeIfOpen(sqlite, SECURITY_POC_DB);
        let wrongFails = false;
        try {
          const bad = await sqlite.createConnection(
            SECURITY_POC_DB,
            true,
            "wrongsecret",
            1,
            false
          );
          await bad.open();
          await sqlite.closeConnection(SECURITY_POC_DB, false);
        } catch {
          wrongFails = true;
          await closeIfOpen(sqlite, SECURITY_POC_DB);
        }
        await closeIfOpen(sqlite, SECURITY_POC_DB);
        const db2 = await sqlite.createConnection(SECURITY_POC_DB, true, "secret", 1, false);
        await db2.open();
        const body = await queryContent(db2);
        const urlRes = await db2.getUrl();
        dbUrl = urlRes.url ?? dbUrl;
        await sqlite.closeConnection(SECURITY_POC_DB, false);
        push(
          "H",
          "after change: new secret opens / old rejected",
          wrongFails && oldCheck.result === false && newCheck.result === true && body === SECURITY_POC_DUMMY_CONTENT ? "pass" : "fail",
          `oldCheck=${String(oldCheck.result)} newCheck=${String(newCheck.result)} wrongFails=${String(wrongFails)} contentMatch=${String(body === SECURITY_POC_DUMMY_CONTENT)}`
        );
      }
    } catch (e) {
      push("SQL-error", "SQLCipher suite", "fail", errMsg(e));
    }
    try {
      const paths = await LjdLocalSecurity.resolveCandidatePaths();
      push(
        "loc-paths",
        "candidate path resolve",
        "info",
        `A=${paths.candidateA_libraryCapacitorDatabase} B=${paths.candidateB_documents} C=${paths.candidateC_applicationSupportLjd}`
      );
      const candidateAFile = `${paths.candidateA_libraryCapacitorDatabase}/${SECURITY_POC_DB}SQLite.db`;
      const dbPathToInspect = dbUrl || candidateAFile;
      const dbAttrs = await LjdLocalSecurity.inspectPath({ path: dbPathToInspect });
      push(
        "backup-db-A",
        "Candidate A DB file (Library/CapacitorDatabase)",
        dbAttrs.exists ? "info" : "fail",
        fmtAttrs(dbAttrs)
      );
      if (dbAttrs.parent) {
        push(
          "backup-db-A-parent",
          "Candidate A DB parent",
          "info",
          `excl=${String(dbAttrs.parent.isExcludedFromBackup)} prot=${dbAttrs.parent.fileProtection}`
        );
      }
      const docsProbe = `${paths.candidateB_documents}/ljd_security_poc_docs_probe.db`;
      const docsAttrs = await LjdLocalSecurity.ensureProbeFile({ path: docsProbe });
      push(
        "backup-db-B",
        "Candidate B Documents probe DB file",
        "info",
        `${fmtAttrs(docsAttrs)} (probe; plugin global location remains Library for live SQLite)`
      );
      const cProbe = `${paths.candidateC_applicationSupportLjd}/security-poc-probe.db`;
      const cAttrs = await LjdLocalSecurity.ensureProbeFile({ path: cProbe });
      push(
        "backup-db-C",
        "Candidate C Application Support design probe",
        "info",
        fmtAttrs(cAttrs)
      );
      await Filesystem.mkdir({
        path: SECURITY_POC_MEDIA_ROOT,
        directory: Directory.Library,
        recursive: true
      }).catch(() => void 0);
      const tinyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const mediaRel = `${SECURITY_POC_MEDIA_ROOT}/dummy.png`;
      await Filesystem.writeFile({
        path: mediaRel,
        data: tinyPngBase64,
        directory: Directory.Library
      });
      const uri = await Filesystem.getUri({ path: mediaRel, directory: Directory.Library });
      const mediaAttrs = await LjdLocalSecurity.inspectPath({ path: uri.uri });
      const readBack = await Filesystem.readFile({
        path: mediaRel,
        directory: Directory.Library
      });
      push(
        "media",
        "dummy media write/read + attrs",
        typeof readBack.data === "string" && readBack.data.length > 0 ? "pass" : "fail",
        `${fmtAttrs(mediaAttrs)} readBytesApprox=${typeof readBack.data === "string" ? readBack.data.length : 0}`
      );
      if (dbAttrs.exists) {
        const afterDb = await LjdLocalSecurity.setCompleteProtection({ path: dbPathToInspect });
        const dbComplete = afterDb.fileProtection === "NSFileProtectionComplete";
        push(
          "fp-complete-db",
          "set Complete on dummy DB",
          dbComplete ? "pass" : "info",
          `${fmtAttrs(afterDb)} setResourceValues(.complete) invoked; Simulator may still report UntilFirstUserAuthentication`
        );
      }
      const afterMedia = await LjdLocalSecurity.setCompleteProtection({ path: uri.uri });
      const mediaComplete = afterMedia.fileProtection === "NSFileProtectionComplete";
      push(
        "fp-complete-media",
        "set Complete on dummy media",
        mediaComplete ? "pass" : "info",
        `${fmtAttrs(afterMedia)} setResourceValues(.complete) invoked; Simulator may still report UntilFirstUserAuthentication`
      );
      try {
        const db2 = await sqlite.createConnection(SECURITY_POC_DB, true, "secret", 1, false);
        await db2.open();
        const body = await queryContent(db2);
        await db2.run("INSERT INTO poc_rows (id, body) VALUES (?, ?);", [
          2,
          "unlock-write-ok"
        ]);
        await sqlite.closeConnection(SECURITY_POC_DB, false);
        const readMedia = await Filesystem.readFile({
          path: mediaRel,
          directory: Directory.Library
        });
        push(
          "fp-unlocked-rw",
          "unlocked read/write after Complete",
          body === SECURITY_POC_DUMMY_CONTENT && typeof readMedia.data === "string" && readMedia.data.length > 0 ? "pass" : "fail",
          "Simulator cannot prove lock-state denial; attribute set + unlocked R/W verified only."
        );
      } catch (e) {
        const readMedia = await Filesystem.readFile({
          path: mediaRel,
          directory: Directory.Library
        });
        push(
          "fp-unlocked-rw",
          "unlocked read/write after Complete",
          typeof readMedia.data === "string" && readMedia.data.length > 0 ? "info" : "fail",
          `DB reopen skipped (${errMsg(e)}); media read ok=${String(typeof readMedia.data === "string")}`
        );
      }
    } catch (e) {
      push("ATTR-error", "backup/file protection suite", "fail", errMsg(e));
    }
    try {
      await CapacitorSQLite.clearEncryptionSecret();
      push("cleanup-secret", "clearEncryptionSecret", "info", "plugin secret cleared after PoC");
    } catch (e) {
      push("cleanup-secret", "clearEncryptionSecret", "info", errMsg(e));
    }
    const sqlFail = steps.some(
      (s2) => (["A", "B+mig", "C", "E", "F", "G", "H"].includes(s2.id) || s2.id === "SQL-error") && s2.status === "fail"
    );
    const keyFail = steps.some(
      (s2) => ["K1", "K2", "K3", "K5", "K6"].includes(s2.id) && s2.status === "fail"
    );
    return {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: Capacitor.getPlatform(),
      steps: redact(steps),
      summary: {
        sqlcipherOk: !sqlFail,
        secureKeyStoreOk: !keyFail,
        builtInStoreVerdict: "B",
        builtInStoreNote: "Installed KeychainServices.swift omits kSecAttrAccessible; accessibility not externally selectable."
      }
    };
  }
  async function checkSecureKeyStorePersistence() {
    assertNative3();
    const meta = await SecureKeyStore.exists(SecureKeyStore.POC_ACCOUNT);
    return { exists: meta.exists, accessibility: meta.accessibility };
  }

  // src/lib/local-first/security/runKeyIntegrationPoc.ts
  init_dist();
  var KEY_INTEGRATION_POC_DB = "ljd_key_integration_poc";
  var SQLITE_PLUGIN_KEYCHAIN = {
    service: "unlockSecret",
    accountWithPrefix: "ljd_CapacitorSQLitePlugin",
    accountLegacyNoPrefix: "CapacitorSQLitePlugin",
    iosKeychainPrefix: "ljd"
  };
  function assertNative4() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Key integration PoC is native-only.");
    }
  }
  function errMsg2(e) {
    return e instanceof Error ? e.message : String(e);
  }
  function randomPassphrase2(bytes = 24) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    let out = "";
    for (const b of arr) out += b.toString(16).padStart(2, "0");
    return out;
  }
  async function closeIfOpen2(sqlite, name) {
    try {
      await sqlite.checkConnectionsConsistency();
    } catch {
    }
    try {
      const isConn = (await sqlite.isConnection(name, false)).result;
      if (isConn) await sqlite.closeConnection(name, false);
    } catch {
      try {
        await CapacitorSQLite.closeConnection({ database: name, readonly: false });
      } catch {
      }
    }
  }
  async function runKeyIntegrationPoc() {
    assertNative4();
    const steps = [];
    const push = (id, title, status, detail) => {
      steps.push({ id, title, status, detail });
    };
    push(
      "path-source",
      "SQLCipher secret path (installed source)",
      "info",
      [
        `service=${SQLITE_PLUGIN_KEYCHAIN.service}`,
        `account=${SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix}`,
        "Database.open \u2190 UtilsSecret.getPassphrase(account) when encrypted && mode\u2208{secret,encryption,decryption}",
        "createConnection: no passphrase field in TS/API",
        "write path: setEncryptionSecret({passphrase}) \u2192 KeychainWrapper service unlockSecret"
      ].join(" | ")
    );
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    let accessibilityVerdict = "C";
    let builtInOpensDb = false;
    let planBOpensDb = false;
    try {
      try {
        await CapacitorSQLite.clearEncryptionSecret();
      } catch {
      }
      await closeIfOpen2(sqlite, KEY_INTEGRATION_POC_DB);
      const paths = await LjdLocalSecurity.resolveCandidatePaths();
      await LjdLocalSecurity.deletePath({
        path: `${paths.candidateA_libraryCapacitorDatabase}/${KEY_INTEGRATION_POC_DB}SQLite.db`
      });
      const passphraseA = randomPassphrase2();
      await CapacitorSQLite.setEncryptionSecret({ passphrase: passphraseA });
      void passphraseA;
      const attrs = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
        service: SQLITE_PLUGIN_KEYCHAIN.service,
        account: SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix
      });
      accessibilityVerdict = attrs.verdictHint;
      push(
        "built-in-accessibility",
        "plugin Keychain accessibility (no secret read)",
        attrs.found ? "pass" : "fail",
        `found=${String(attrs.found)} accessibility=${attrs.accessibility ?? "null"} rawPresent=${String(attrs.accessibilityRawPresent)} verdictHint=${attrs.verdictHint} returnedSecretData=${String(attrs.returnedSecretData ?? false)} note=${attrs.note ?? ""}`
      );
      const legacy = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
        service: SQLITE_PLUGIN_KEYCHAIN.service,
        account: SQLITE_PLUGIN_KEYCHAIN.accountLegacyNoPrefix
      });
      push(
        "built-in-legacy-account",
        "legacy account without prefix",
        "info",
        `found=${String(legacy.found)} accessibility=${legacy.accessibility ?? "null"}`
      );
      {
        const db2 = await sqlite.createConnection(
          KEY_INTEGRATION_POC_DB,
          true,
          "secret",
          1,
          false
        );
        await db2.open();
        await db2.execute(`
        CREATE TABLE IF NOT EXISTS k_rows (id INTEGER PRIMARY KEY NOT NULL, body TEXT NOT NULL);
        DELETE FROM k_rows;
        INSERT INTO k_rows (id, body) VALUES (1, 'key-integration dummy');
      `);
        const q = await db2.query("SELECT body FROM k_rows LIMIT 1;");
        const body = String(
          q.values?.[0]?.body ?? ""
        );
        await sqlite.closeConnection(KEY_INTEGRATION_POC_DB, false);
        builtInOpensDb = body === "key-integration dummy";
        push(
          "planA-open",
          "SQLCipher open using plugin built-in Keychain secret",
          builtInOpensDb ? "pass" : "fail",
          `openedViaPluginKeychain=${String(builtInOpensDb)} (secret never reported)`
        );
      }
      try {
        await CapacitorSQLite.clearEncryptionSecret();
      } catch {
      }
      await closeIfOpen2(sqlite, KEY_INTEGRATION_POC_DB);
      await LjdLocalSecurity.deletePath({
        path: `${paths.candidateA_libraryCapacitorDatabase}/${KEY_INTEGRATION_POC_DB}SQLite.db`
      });
      const gen = await SecureKeyStore.generateRandomSecret(32);
      await SecureKeyStore.set(SecureKeyStore.POC_ACCOUNT, gen.secret);
      await CapacitorSQLite.setEncryptionSecret({ passphrase: gen.secret });
      gen.secret = void 0;
      const afterB = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
        service: SQLITE_PLUGIN_KEYCHAIN.service,
        account: SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix
      });
      push(
        "planB-plugin-item",
        "after LJD\u2192setEncryptionSecret plugin item attrs",
        afterB.found ? "pass" : "fail",
        `found=${String(afterB.found)} accessibility=${afterB.accessibility ?? "null"} verdictHint=${afterB.verdictHint}`
      );
      {
        const db2 = await sqlite.createConnection(
          KEY_INTEGRATION_POC_DB,
          true,
          "secret",
          1,
          false
        );
        await db2.open();
        await db2.execute(`
        CREATE TABLE IF NOT EXISTS k_rows (id INTEGER PRIMARY KEY NOT NULL, body TEXT NOT NULL);
        DELETE FROM k_rows;
        INSERT INTO k_rows (id, body) VALUES (1, 'plan-b dummy');
      `);
        const q = await db2.query("SELECT body FROM k_rows LIMIT 1;");
        const body = String(
          q.values?.[0]?.body ?? ""
        );
        await sqlite.closeConnection(KEY_INTEGRATION_POC_DB, false);
        planBOpensDb = body === "plan-b dummy";
        push(
          "planB-open",
          "SQLCipher open after LJD\u2192plugin handoff",
          planBOpensDb ? "pass" : "fail",
          `opened=${String(planBOpensDb)} note=plugin opens via its own Keychain copy; LJD item is not read by community plugin`
        );
      }
      push(
        "planB-analysis",
        "Plan B feasibility without fork",
        "info",
        "JS handoff required (setEncryptionSecret). createConnection cannot take passphrase. Dual Keychain if LJD also stores copy. Plugin always reads unlockSecret item \u2014 not LJD service."
      );
      push(
        "planC",
        "fork/patch necessity",
        "info",
        accessibilityVerdict === "A" && builtInOpensDb ? "not_needed for DB-open path if Plan A adopted; fork only if requiring LJD Keychain as sole storage without JS handoff" : "evaluate minimal native hook only if WhenUnlocked not confirmed or product requires sole LJD Keychain without bridge handoff"
      );
    } catch (e) {
      push("error", "key integration suite", "fail", errMsg2(e));
    }
    try {
      await CapacitorSQLite.clearEncryptionSecret();
    } catch {
    }
    try {
      await SecureKeyStore.delete(SecureKeyStore.POC_ACCOUNT);
    } catch {
    }
    try {
      const paths = await LjdLocalSecurity.resolveCandidatePaths();
      await closeIfOpen2(sqlite, KEY_INTEGRATION_POC_DB);
      await LjdLocalSecurity.deletePath({
        path: `${paths.candidateA_libraryCapacitorDatabase}/${KEY_INTEGRATION_POC_DB}SQLite.db`
      });
    } catch {
    }
    push("cleanup", "clear plugin + LJD PoC secrets / delete dummy DB", "info", "done");
    const planA = accessibilityVerdict === "A" && builtInOpensDb ? "recommended" : accessibilityVerdict === "A" ? "viable" : "reject";
    const planB = planBOpensDb ? "viable_with_js_handoff" : "reject_no_api";
    const planC = planA === "recommended" || planA === "viable" ? "not_needed" : "needed";
    const builtInAdopt = accessibilityVerdict === "A" && builtInOpensDb ? "A" : "B";
    const report = {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: Capacitor.getPlatform(),
      pathFacts: {
        keychainService: SQLITE_PLUGIN_KEYCHAIN.service,
        keychainAccount: SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix,
        jsDirectPassphraseToCreateConnection: false,
        openUsesUtilsSecretGetPassphrase: true
      },
      plans: {
        planA_builtIn: planA,
        planB_ljdToPlugin: planB,
        planC_fork: planC
      },
      accessibilityVerdict,
      summary: {
        actualSqlCipherSecretStore: `Keychain generic password service=${SQLITE_PLUGIN_KEYCHAIN.service} account=${SQLITE_PLUGIN_KEYCHAIN.accountWithPrefix} (plugin built-in)`,
        builtInAdoptForDbKey: builtInAdopt,
        ljdSecureKeyStoreNeededForDbOpen: builtInAdopt !== "A",
        forkNeeded: planC === "needed",
        recommendedArchitecture: builtInAdopt === "A" ? "Plan A: SQLCipher via plugin setEncryptionSecret/built-in Keychain (WhenUnlocked measured). Keep LJD SecureKeyStore for non-plugin secrets / future Android, not as SQLCipher open path. Avoid JS dual-store unless required." : "Plan C or constrained Plan B: built-in accessibility not A; do not treat plugin store as formal. Prefer minimal native supply path over dual Keychain+JS handoff.",
        documentsDbLocationCandidate: "A",
        readyForDeviceBackupRestore: builtInAdopt === "A" ? "A" : "B"
      },
      steps
    };
    return report;
  }
  async function persistKeyIntegrationReport(report) {
    try {
      await Filesystem.mkdir({
        path: "ljd/security-poc",
        directory: Directory.Library,
        recursive: true
      });
    } catch {
    }
    await Filesystem.writeFile({
      path: "ljd/security-poc/key-integration-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(report, null, 2)
    });
  }

  // src/lib/local-first/security/runStorageLocationPoc.ts
  init_dist();
  var STORAGE_POC_DB = "ljd_storage_location_poc";
  var STORAGE_POC_DUMMY = "storage-location poc dummy row";
  function assertNative5() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Storage location PoC is native-only.");
    }
  }
  function errMsg3(e) {
    return e instanceof Error ? e.message : String(e);
  }
  function fmtExcl(a) {
    if (!a) return "n/a";
    return `excl=${String(a.isExcludedFromBackup)} prot=${a.fileProtection} exists=${String(a.exists)}`;
  }
  function randomPassphrase3(bytes = 24) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    let out = "";
    for (const b of arr) out += b.toString(16).padStart(2, "0");
    return out;
  }
  async function closeIfOpen3(sqlite, name) {
    try {
      await sqlite.checkConnectionsConsistency();
    } catch {
    }
    try {
      if ((await sqlite.isConnection(name, false)).result) {
        await sqlite.closeConnection(name, false);
      }
    } catch {
      try {
        await CapacitorSQLite.closeConnection({ database: name, readonly: false });
      } catch {
      }
    }
  }
  async function runStorageLocationPoc(options) {
    assertNative5();
    const steps = [];
    const push = (id, title, status, detail) => steps.push({ id, title, status, detail });
    const asMeta = await LjdLocalSecurity.resolveApplicationSupportLjdDir();
    push(
      "as-resolve",
      "Application Support via FileManager",
      "info",
      `bundleId=${asMeta.bundleIdentifier} ljdDir=${asMeta.ljdApplicationSupportDir} pluginRelative=${asMeta.pluginRelativeLocation}`
    );
    let relaunchInclude = "pending_relaunch_measure";
    try {
      const prev = await Filesystem.readFile({
        path: "ljd/security-poc/storage-location-exclude-state.json",
        directory: Directory.Library,
        encoding: Encoding.UTF8
      });
      const text = typeof prev.data === "string" ? prev.data : "";
      const parsed = JSON.parse(text);
      if (typeof parsed.parentExcludedAfterForceFalse === "boolean") {
        const parentNow = await LjdLocalSecurity.inspectPath({
          path: asMeta.ljdApplicationSupportDir
        });
        const stillIncluded = parentNow.isExcludedFromBackup === false;
        relaunchInclude = stillIncluded;
        push(
          "relaunch-exclude",
          "isExcludedFromBackup=false after kill/relaunch",
          stillIncluded ? "pass" : "fail",
          `priorForcedFalse=true nowExcl=${String(parentNow.isExcludedFromBackup)} stillIncluded=${String(stillIncluded)}`
        );
      }
    } catch {
      push(
        "relaunch-exclude",
        "isExcludedFromBackup after relaunch",
        "info",
        "no prior force-false state (first install/run)"
      );
    }
    if (options?.relaunchCheckOnly) {
      return finalize(steps, asMeta, {
        appSupportPlaceOk: false,
        pluginSetsParentExcluded: null,
        canForceIncludeBackup: null,
        includeSurvivesReopen: null,
        includeSurvivesRelaunch: relaunchInclude,
        completeProtectionHolds: null,
        documentsCompareKept: true
      });
    }
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    let pluginSetsParentExcluded = null;
    let canForceIncludeBackup = null;
    let includeSurvivesReopen = null;
    let completeProtectionHolds = null;
    let appSupportPlaceOk = false;
    let dbUrl = "";
    try {
      try {
        await CapacitorSQLite.clearEncryptionSecret();
      } catch {
      }
      await closeIfOpen3(sqlite, STORAGE_POC_DB);
      const parentAfterPlugin = await LjdLocalSecurity.inspectPath({
        path: asMeta.ljdApplicationSupportDir
      });
      const asRoot = await LjdLocalSecurity.inspectPath({
        path: asMeta.applicationSupportRoot
      });
      pluginSetsParentExcluded = parentAfterPlugin.isExcludedFromBackup === true;
      push(
        "plugin-exclude-behavior",
        "plugin createDatabaseLocation backup exclusion",
        "info",
        `LJD AS dir ${fmtExcl(parentAfterPlugin)} | AS root ${fmtExcl(asRoot)} | source: UtilsFile.createDatabaseLocation sets isExcluded=true on first create`
      );
      const passphrase = randomPassphrase3();
      await CapacitorSQLite.setEncryptionSecret({ passphrase });
      void passphrase;
      const deleteCandidates = [
        `${asMeta.ljdApplicationSupportDir}/${STORAGE_POC_DB}SQLite.db`,
        `${asMeta.ljdDatabasesDir}/${STORAGE_POC_DB}SQLite.db`
      ];
      for (const p of deleteCandidates) {
        await LjdLocalSecurity.deletePath({ path: p });
      }
      {
        const db2 = await sqlite.createConnection(
          STORAGE_POC_DB,
          true,
          "secret",
          1,
          false
        );
        await db2.open();
        await db2.execute(`
        CREATE TABLE IF NOT EXISTS s_rows (id INTEGER PRIMARY KEY NOT NULL, body TEXT NOT NULL);
        DELETE FROM s_rows;
        INSERT INTO s_rows (id, body) VALUES (1, '${STORAGE_POC_DUMMY}');
      `);
        const url = await db2.getUrl();
        dbUrl = url.url ?? "";
        await sqlite.closeConnection(STORAGE_POC_DB, false);
        push(
          "as-create-open",
          "SQLCipher create/open in Application Support location",
          dbUrl ? "pass" : "fail",
          `dbUrlPresent=${String(Boolean(dbUrl))} (path not logged as secret; url path ok to inspect)`
        );
      }
      const dbAttrs0 = dbUrl ? await LjdLocalSecurity.inspectPath({ path: dbUrl }) : null;
      push(
        "as-attrs-initial",
        "AS dummy DB attrs after create",
        dbAttrs0?.exists ? "pass" : "fail",
        `${fmtExcl(dbAttrs0 ?? void 0)} parent[${fmtExcl(
          dbAttrs0?.parent ? {
            ...dbAttrs0.parent,
            isDirectory: true,
            path: dbAttrs0.parent.path,
            exists: dbAttrs0.parent.exists,
            isExcludedFromBackup: dbAttrs0.parent.isExcludedFromBackup,
            fileProtection: dbAttrs0.parent.fileProtection
          } : void 0
        )}]`
      );
      appSupportPlaceOk = Boolean(dbAttrs0?.exists);
      const parentPath = dbAttrs0?.parent?.path ?? asMeta.ljdApplicationSupportDir;
      if (dbAttrs0?.parent?.isExcludedFromBackup === true || parentAfterPlugin.isExcludedFromBackup === true) {
        const forced = await LjdLocalSecurity.setExcludedFromBackup({
          path: parentPath,
          excluded: false
        });
        canForceIncludeBackup = forced.isExcludedFromBackup === false;
        push(
          "force-include",
          "set isExcludedFromBackup=false on LJD AS parent",
          canForceIncludeBackup ? "pass" : "fail",
          fmtExcl(forced)
        );
        await Filesystem.mkdir({
          path: "ljd/security-poc",
          directory: Directory.Library,
          recursive: true
        }).catch(() => void 0);
        await Filesystem.writeFile({
          path: "ljd/security-poc/storage-location-exclude-state.json",
          directory: Directory.Library,
          encoding: Encoding.UTF8,
          data: JSON.stringify(
            {
              at: (/* @__PURE__ */ new Date()).toISOString(),
              parentPath,
              parentExcludedAfterForceFalse: false,
              expectOnNextBoot: true
            },
            null,
            2
          )
        });
      } else {
        canForceIncludeBackup = true;
        push(
          "force-include",
          "set isExcludedFromBackup=false",
          "skip",
          "parent already not excluded"
        );
      }
      {
        await closeIfOpen3(sqlite, STORAGE_POC_DB);
        const db2 = await sqlite.createConnection(
          STORAGE_POC_DB,
          true,
          "secret",
          1,
          false
        );
        await db2.open();
        const q = await db2.query("SELECT body FROM s_rows LIMIT 1;");
        const body = String(
          q.values?.[0]?.body ?? ""
        );
        const url = await db2.getUrl();
        dbUrl = url.url ?? dbUrl;
        await sqlite.closeConnection(STORAGE_POC_DB, false);
        push(
          "reopen-ok",
          "encrypted reopen correct secret",
          body === STORAGE_POC_DUMMY ? "pass" : "fail",
          `contentMatch=${String(body === STORAGE_POC_DUMMY)}`
        );
      }
      {
        await closeIfOpen3(sqlite, STORAGE_POC_DB);
        let failed = false;
        try {
          const bad = await sqlite.createConnection(
            STORAGE_POC_DB,
            true,
            "wrongsecret",
            1,
            false
          );
          await bad.open();
          await sqlite.closeConnection(STORAGE_POC_DB, false);
        } catch {
          failed = true;
          await closeIfOpen3(sqlite, STORAGE_POC_DB);
        }
        push(
          "wrong-key",
          "wrong secret fails",
          failed ? "pass" : "fail",
          `failedAsExpected=${String(failed)}`
        );
      }
      const parentAfterReopen = await LjdLocalSecurity.inspectPath({ path: parentPath });
      includeSurvivesReopen = parentAfterReopen.isExcludedFromBackup === false;
      push(
        "exclude-after-reopen",
        "backup include after DB reopen",
        includeSurvivesReopen ? "pass" : "fail",
        fmtExcl(parentAfterReopen)
      );
      if (dbUrl) {
        const afterComplete = await LjdLocalSecurity.setCompleteProtection({ path: dbUrl });
        await closeIfOpen3(sqlite, STORAGE_POC_DB);
        const db2 = await sqlite.createConnection(
          STORAGE_POC_DB,
          true,
          "secret",
          1,
          false
        );
        await db2.open();
        await db2.run("INSERT INTO s_rows (id, body) VALUES (?, ?);", [2, "after-complete"]);
        await sqlite.closeConnection(STORAGE_POC_DB, false);
        const afterOpen = await LjdLocalSecurity.inspectPath({ path: dbUrl });
        completeProtectionHolds = afterComplete.fileProtection === "NSFileProtectionComplete" && afterOpen.fileProtection === "NSFileProtectionComplete";
        push(
          "fp-complete",
          "NSFileProtectionComplete holds across reopen",
          completeProtectionHolds ? "pass" : "info",
          `afterSet=${afterComplete.fileProtection} afterReopen=${afterOpen.fileProtection}`
        );
      }
    } catch (e) {
      push("error", "storage location suite", "fail", errMsg3(e));
    }
    const paths = await LjdLocalSecurity.resolveCandidatePaths();
    const docsProbe = await LjdLocalSecurity.ensureProbeFile({
      path: `${paths.candidateB_documents}/ljd_storage_compare_probe.db`
    });
    const capDbProbePath = `${paths.candidateA_libraryCapacitorDatabase}/ljd_storage_compare_probe.db`;
    const capDbProbe = await LjdLocalSecurity.ensureProbeFile({ path: capDbProbePath });
    const oldJournal = await LjdLocalSecurity.inspectPath({
      path: `${paths.candidateA_libraryCapacitorDatabase}/ljd_local_journalSQLite.db`
    });
    push(
      "compare-B-documents",
      "Documents comparison probe",
      "info",
      fmtExcl(docsProbe) + ` parentExcl=${String(docsProbe.parent?.isExcludedFromBackup)}`
    );
    push(
      "compare-C-capacitorDb",
      "Library/CapacitorDatabase comparison",
      "info",
      `probe ${fmtExcl(capDbProbe)} parentExcl=${String(capDbProbe.parent?.isExcludedFromBackup)} journalExists=${String(oldJournal.exists)} journalExcl=${String(oldJournal.isExcludedFromBackup)}`
    );
    push(
      "media-unchanged",
      "media path policy",
      "info",
      "Library/ljd/media/... left unchanged; prior 4B-3B isExcludedFromBackup=false stands"
    );
    try {
      await CapacitorSQLite.clearEncryptionSecret();
    } catch {
    }
    return finalize(
      steps,
      asMeta,
      {
        appSupportPlaceOk,
        pluginSetsParentExcluded,
        canForceIncludeBackup,
        includeSurvivesReopen,
        includeSurvivesRelaunch: relaunchInclude,
        completeProtectionHolds,
        documentsCompareKept: true
      },
      {
        A_db: dbUrl ? await LjdLocalSecurity.inspectPath({ path: dbUrl }).catch(() => null) : null,
        A_parent: await LjdLocalSecurity.inspectPath({
          path: asMeta.ljdApplicationSupportDir
        }),
        A_asRoot: await LjdLocalSecurity.inspectPath({
          path: asMeta.applicationSupportRoot
        }),
        B: docsProbe,
        C: capDbProbe,
        C_journal: oldJournal
      }
    );
  }
  function finalize(steps, asMeta, summary, extras) {
    const recommendation = "A";
    const bridgeNeeded = summary.pluginSetsParentExcluded === true && summary.canForceIncludeBackup === true;
    return {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: Capacitor.getPlatform(),
      comparison: {
        A_applicationSupport: {
          guideline: "Apple: app-created support files \u2192 Library/Application Support/<bundleId>",
          pluginRelative: asMeta.pluginRelativeLocation,
          absoluteLjdDir: asMeta.ljdApplicationSupportDir,
          db: extras?.A_db ? fmtExcl(extras.A_db) : null,
          parent: extras ? fmtExcl(extras.A_parent) : null,
          asRoot: extras ? fmtExcl(extras.A_asRoot) : null,
          filesAppExposure: "hidden from Files (not Documents)"
        },
        B_documents: {
          guideline: "Apple: user-managed documents only",
          probe: extras ? fmtExcl(extras.B) : null,
          filesAppExposure: "may surface via Files / sharing surfaces"
        },
        C_libraryCapacitorDatabase: {
          note: "current foundation provisional",
          probe: extras ? fmtExcl(extras.C) : null,
          parentTypicallyExcluded: true,
          journalLeftover: extras ? fmtExcl(extras.C_journal) : null
        }
      },
      recommendation,
      recommendationNote: "Recommend A (Application Support + backup included via LJD override if plugin excludes parent). Documents remains compare-only. CapacitorDatabase rejected as formal due to parent exclude + non-guideline path name.",
      additionalNativeBridgeNeededInProduction: bridgeNeeded,
      sqlCipherKeyPathConfirmed: "setEncryptionSecret \u2192 plugin Keychain unlockSecret/ljd_CapacitorSQLitePlugin (WhenUnlocked) \u2192 SQLCipher open",
      steps,
      summary
    };
  }
  async function persistStorageLocationReport(report) {
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true
    }).catch(() => void 0);
    await Filesystem.writeFile({
      path: "ljd/security-poc/storage-location-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(report, null, 2)
    });
  }

  // src/lib/local-first/security/runRealDeviceGroupAPoc.ts
  init_dist();
  var REAL_DEVICE_GROUP_A_DB = "ljd_real_device_group_a_poc";
  var REAL_DEVICE_GROUP_A_MEDIA = "ljd/media/real-device-group-a";
  var REAL_DEVICE_GROUP_A_TEXT = "real-device Group A dummy journal text";
  function assertNative6() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Group A PoC is native-only.");
    }
  }
  function errMsg4(e) {
    return e instanceof Error ? e.message : String(e);
  }
  function fmt(a) {
    if (!a) return "n/a";
    return `excl=${String(a.isExcludedFromBackup)} prot=${a.fileProtection} exists=${String(a.exists)}`;
  }
  function randomPassphrase4(bytes = 24) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    let out = "";
    for (const b of arr) out += b.toString(16).padStart(2, "0");
    return out;
  }
  async function closeIfOpen4(sqlite, name) {
    try {
      await sqlite.checkConnectionsConsistency();
    } catch {
    }
    try {
      if ((await sqlite.isConnection(name, false)).result) {
        await sqlite.closeConnection(name, false);
      }
    } catch {
      try {
        await CapacitorSQLite.closeConnection({ database: name, readonly: false });
      } catch {
      }
    }
  }
  async function runRealDeviceGroupAPoc() {
    assertNative6();
    const steps = [];
    const push = (id, title, status, detail) => steps.push({ id, title, status, detail });
    push(
      "policy",
      "device policy",
      "info",
      "Group A only: no erase/restore/uninstall/journal wipe. Dummy DB/media only. Personal everyday phone excluded."
    );
    const asMeta = await LjdLocalSecurity.resolveApplicationSupportLjdDir();
    push(
      "as-resolve",
      "Application Support resolve",
      "info",
      `bundleId=${asMeta.bundleIdentifier} ljdDir=${asMeta.ljdApplicationSupportDir}`
    );
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    let dbLocationOk = false;
    let backupIncludeOk = null;
    let completeProtectionOk = null;
    let keychainWhenUnlocked = null;
    let mediaReadOk = false;
    let encryptedReopenOk = false;
    let dbUrl = "";
    try {
      try {
        await CapacitorSQLite.clearEncryptionSecret();
      } catch {
      }
      await closeIfOpen4(sqlite, REAL_DEVICE_GROUP_A_DB);
      await LjdLocalSecurity.deletePath({
        path: `${asMeta.ljdApplicationSupportDir}/${REAL_DEVICE_GROUP_A_DB}SQLite.db`
      });
      const parent0 = await LjdLocalSecurity.inspectPath({
        path: asMeta.ljdApplicationSupportDir
      });
      if (parent0.isExcludedFromBackup === true) {
        await LjdLocalSecurity.setExcludedFromBackup({
          path: asMeta.ljdApplicationSupportDir,
          excluded: false
        });
      }
      const passphrase = randomPassphrase4();
      await CapacitorSQLite.setEncryptionSecret({ passphrase });
      void passphrase;
      {
        const db2 = await sqlite.createConnection(
          REAL_DEVICE_GROUP_A_DB,
          true,
          "secret",
          1,
          false
        );
        await db2.open();
        await db2.execute(`
        CREATE TABLE IF NOT EXISTS g_rows (
          id INTEGER PRIMARY KEY NOT NULL,
          body TEXT NOT NULL
        );
        DELETE FROM g_rows;
        INSERT INTO g_rows (id, body) VALUES (1, '${REAL_DEVICE_GROUP_A_TEXT}');
      `);
        dbUrl = (await db2.getUrl()).url ?? "";
        await sqlite.closeConnection(REAL_DEVICE_GROUP_A_DB, false);
        dbLocationOk = Boolean(dbUrl);
        push(
          "A2-db",
          "dummy encrypted DB create",
          dbLocationOk ? "pass" : "fail",
          `dbUrlPresent=${String(dbLocationOk)}`
        );
      }
      const parent = await LjdLocalSecurity.inspectPath({
        path: asMeta.ljdApplicationSupportDir
      });
      const dbAttrs = dbUrl ? await LjdLocalSecurity.inspectPath({ path: dbUrl }) : void 0;
      backupIncludeOk = parent.isExcludedFromBackup === false && (dbAttrs?.isExcludedFromBackup === false || dbAttrs?.isExcludedFromBackup === "unset");
      push(
        "A3-backup",
        "backup exclusion measure",
        backupIncludeOk ? "pass" : "info",
        `db=${fmt(dbAttrs)} parent=${fmt(parent)}`
      );
      if (dbUrl) {
        const after = await LjdLocalSecurity.setCompleteProtection({ path: dbUrl });
        await closeIfOpen4(sqlite, REAL_DEVICE_GROUP_A_DB);
        const db2 = await sqlite.createConnection(
          REAL_DEVICE_GROUP_A_DB,
          true,
          "secret",
          1,
          false
        );
        await db2.open();
        const q = await db2.query("SELECT body FROM g_rows LIMIT 1;");
        const body = String(
          q.values?.[0]?.body ?? ""
        );
        await sqlite.closeConnection(REAL_DEVICE_GROUP_A_DB, false);
        const afterOpen = await LjdLocalSecurity.inspectPath({ path: dbUrl });
        encryptedReopenOk = body === REAL_DEVICE_GROUP_A_TEXT;
        completeProtectionOk = after.fileProtection === "NSFileProtectionComplete" && afterOpen.fileProtection === "NSFileProtectionComplete";
        push(
          "A3-fp",
          "file protection Complete",
          completeProtectionOk ? "pass" : "info",
          `afterSet=${after.fileProtection} afterReopen=${afterOpen.fileProtection}`
        );
        push(
          "A7-reopen",
          "encrypted reopen (session)",
          encryptedReopenOk ? "pass" : "fail",
          `contentMatch=${String(encryptedReopenOk)}`
        );
      }
      const kc = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
        service: "unlockSecret",
        account: "ljd_CapacitorSQLitePlugin"
      });
      keychainWhenUnlocked = kc.found && kc.accessibility === "kSecAttrAccessibleWhenUnlocked";
      push(
        "A3-keychain",
        "plugin Keychain accessibility (no secret read)",
        keychainWhenUnlocked ? "pass" : "fail",
        `found=${String(kc.found)} accessibility=${kc.accessibility ?? "null"} returnedSecretData=${String(kc.returnedSecretData ?? false)}`
      );
      await Filesystem.mkdir({
        path: REAL_DEVICE_GROUP_A_MEDIA,
        directory: Directory.Library,
        recursive: true
      }).catch(() => void 0);
      const tinyPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      const mediaRel = `${REAL_DEVICE_GROUP_A_MEDIA}/dummy.png`;
      await Filesystem.writeFile({
        path: mediaRel,
        data: tinyPng,
        directory: Directory.Library
      });
      const uri = await Filesystem.getUri({
        path: mediaRel,
        directory: Directory.Library
      });
      const mediaAttrs = await LjdLocalSecurity.inspectPath({ path: uri.uri });
      await LjdLocalSecurity.setCompleteProtection({ path: uri.uri });
      const readBack = await Filesystem.readFile({
        path: mediaRel,
        directory: Directory.Library
      });
      mediaReadOk = typeof readBack.data === "string" && readBack.data.length > 0;
      push(
        "A2-media",
        "dummy media write/read + attrs",
        mediaReadOk ? "pass" : "fail",
        `${fmt(mediaAttrs)} readOk=${String(mediaReadOk)}`
      );
      push(
        "A6-lock",
        "lock-state access",
        "skip",
        "not_run_in_this_suite \u2014 requires user-operated device lock + separate native probe while locked; do not invent PASS"
      );
      push(
        "A8-reboot",
        "reboot test",
        "skip",
        "user-operated: after reboot+unlock, re-run Group A reopen / Keychain exists check. No erase."
      );
    } catch (e) {
      push("error", "Group A suite", "fail", errMsg4(e));
    }
    push(
      "cleanup-note",
      "cleanup policy",
      "info",
      "dummy DB/media left for kill/relaunch observe; production journal untouched; secret value never logged"
    );
    return {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: Capacitor.getPlatform(),
      deviceClass: "real_device_expected",
      destructiveOps: "forbidden",
      simulatorNote: "Do not merge these numbers into Simulator section of 4B-3D docs until confirmed on company device.",
      steps,
      summary: {
        dbLocationOk,
        backupIncludeOk,
        completeProtectionOk,
        keychainWhenUnlocked,
        mediaReadOk,
        encryptedReopenOk,
        lockTest: "not_run_in_this_suite"
      }
    };
  }
  async function persistGroupAReport(report) {
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true
    }).catch(() => void 0);
    await Filesystem.writeFile({
      path: "ljd/security-poc/real-device-group-a-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(report, null, 2)
    });
  }

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  function $(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing #${id}`);
    return el;
  }
  function setStatus(message, isError = false) {
    const el = $("status");
    el.textContent = message;
    el.className = isError ? "status err" : "status ok";
  }
  function escapeHtml(value) {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }
  async function renderEntries() {
    const listEl = $("list");
    const previewEl = $("preview");
    listEl.innerHTML = "";
    previewEl.removeAttribute("src");
    previewEl.hidden = true;
    const entries = await JournalRepository.list();
    if (entries.length === 0) {
      listEl.innerHTML = "<p class='muted'>Local Journal \u306F\u7A7A\u3067\u3059\u3002remote shell \u306E /preview/local-storage-diagnostics \u3067\u521D\u671F\u5316\u30FB\u8A3A\u65AD\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p>";
      return;
    }
    for (const entry of entries) {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
      <h3>${escapeHtml(entry.title)}</h3>
      <p class="meta">stableId: ${escapeHtml(entry.stableId)}</p>
      <p class="meta">legacyServerId: ${escapeHtml(entry.legacyServerId ?? "(none)")}</p>
      <p class="meta">source: ${escapeHtml(entry.source)}</p>
      <p class="meta">dateKey: ${escapeHtml(entry.dateKey)}</p>
      <p class="meta">tags: ${escapeHtml(entry.tags.join(" "))}</p>
      <p class="meta">media: ${escapeHtml(
        entry.mediaRefs.map((m) => m.relativePath).join(", ") || "(none)"
      )}</p>
    `;
      listEl.appendChild(card);
      const first = entry.mediaRefs[0];
      if (first) {
        try {
          previewEl.src = await resolveJournalMediaUri(first.relativePath);
          previewEl.hidden = false;
        } catch (err) {
          setStatus(`\u753B\u50CFURI\u5931\u6557: ${String(err)}`, true);
        }
      }
    }
  }
  async function boot() {
    $("platform").textContent = `platform=${Capacitor.getPlatform()} native=${String(
      Capacitor.isNativePlatform()
    )} diagnostics=local-storage remoteShell=false`;
    if (!Capacitor.isNativePlatform()) {
      setStatus("\u30CD\u30A4\u30C6\u30A3\u30D6\u5C02\u7528\u3067\u3059\u3002", true);
      return;
    }
    $("btn-load").addEventListener("click", () => {
      void (async () => {
        await openLocalJournalDatabase();
        await renderEntries();
        setStatus(`\u8AAD\u8FBC\u5B8C\u4E86 count=${await JournalRepository.count()}\uFF08\u30B5\u30FC\u30D0\u30FC\u518D\u53D6\u5F97\u306A\u3057\uFF09`);
      })().catch((e) => setStatus(String(e), true));
    });
    $("btn-clear").addEventListener("click", () => {
      void (async () => {
        const paths = await JournalRepository.deleteAll();
        for (const p of paths) await deleteJournalMediaRelative(p);
        await renderEntries();
        setStatus("\u7AEF\u672BLocal\u8A3A\u65AD\u30C7\u30FC\u30BF\u3092\u524A\u9664\uFF08\u30B5\u30FC\u30D0\u30FC\u672A\u5909\u66F4\uFF09\u3002");
      })().catch((e) => setStatus(String(e), true));
    });
    $("btn-security").addEventListener("click", () => {
      void (async () => {
        setStatus("Security PoC \u5B9F\u884C\u4E2D\u2026\uFF08secret\u975E\u8868\u793A\uFF09");
        const report = await runLocalDataProtectionPoc();
        await persistSecurityReport(report);
        const reportEl = $("security-report");
        reportEl.textContent = JSON.stringify(
          {
            ranAt: report.ranAt,
            summary: report.summary,
            steps: report.steps.map((s2) => ({
              id: s2.id,
              status: s2.status,
              title: s2.title,
              detail: s2.detail
            }))
          },
          null,
          2
        );
        const fails = report.steps.filter((s2) => s2.status === "fail").length;
        setStatus(
          `Security PoC \u5B8C\u4E86 fail=${fails} sqlcipherOk=${String(report.summary.sqlcipherOk)} keyStoreOk=${String(report.summary.secureKeyStoreOk)}`
        );
      })().catch((e) => setStatus(String(e), true));
    });
    $("btn-key-persist").addEventListener("click", () => {
      void (async () => {
        const meta = await checkSecureKeyStorePersistence();
        setStatus(
          `SecureKeyStore: exists=${String(meta.exists)} accessibility=${meta.accessibility ?? "null"}`
        );
      })().catch((e) => setStatus(String(e), true));
    });
    $("btn-key-integration").addEventListener("click", () => {
      void (async () => {
        setStatus("Key integration PoC\u2026\uFF08secret\u975E\u8868\u793A\u30FB\u975E\u53D6\u5F97\uFF09");
        const report = await runKeyIntegrationPoc();
        await persistKeyIntegrationReport(report);
        $("security-report").textContent = JSON.stringify(report, null, 2);
        setStatus(
          `Key integration \u5B8C\u4E86 accessibility=${report.accessibilityVerdict} builtInAdopt=${report.summary.builtInAdoptForDbKey} fork=${String(report.summary.forkNeeded)}`
        );
      })().catch((e) => setStatus(String(e), true));
    });
    $("btn-storage-location").addEventListener("click", () => {
      void (async () => {
        setStatus("Storage location PoC\u2026");
        const report = await runStorageLocationPoc();
        await persistStorageLocationReport(report);
        $("security-report").textContent = JSON.stringify(report, null, 2);
        setStatus(
          `Storage location \u5B8C\u4E86 recommend=${report.recommendation} bridgeNeeded=${String(report.additionalNativeBridgeNeededInProduction)}`
        );
      })().catch((e) => setStatus(String(e), true));
    });
    $("btn-group-a").addEventListener("click", () => {
      void (async () => {
        setStatus("Group A\uFF08\u975E\u7834\u58CA\u30FBdummy only\uFF09\u2026 secret\u975E\u8868\u793A");
        const report = await runRealDeviceGroupAPoc();
        await persistGroupAReport(report);
        $("security-report").textContent = JSON.stringify(report, null, 2);
        setStatus(
          `Group A \u5B8C\u4E86 db=${String(report.summary.dbLocationOk)} reopen=${String(report.summary.encryptedReopenOk)} kc=${String(report.summary.keychainWhenUnlocked)}`
        );
      })().catch((e) => setStatus(String(e), true));
    });
    try {
      $("platform").textContent = `platform=${Capacitor.getPlatform()} native=${String(
        Capacitor.isNativePlatform()
      )} phase=4B-3D GroupA-ready autorun=off`;
      setStatus(
        "\u6E96\u5099\u5B8C\u4E86\u3002\u4F1A\u793E\u7528\u5B9F\u6A5F\u3067\u306F Group A \u30DC\u30BF\u30F3\u306E\u307F\u3002\u500B\u4EBA\u7AEF\u672B\u30FBerase/restore/uninstall/\u7AEF\u672B\u30AF\u30EA\u30A2\u306F\u7981\u6B62\u3002"
      );
    } catch (err) {
      setStatus(`\u521D\u671F\u5316\u5931\u6557: ${String(err)}`, true);
    }
  }
  async function persistSecurityReport(report) {
    try {
      await Filesystem.mkdir({
        path: "ljd/security-poc",
        directory: Directory.Library,
        recursive: true
      });
    } catch {
    }
    await Filesystem.writeFile({
      path: "ljd/security-poc/last-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(
        {
          ranAt: report.ranAt,
          platform: report.platform,
          summary: report.summary,
          steps: report.steps
        },
        null,
        2
      )
    });
  }
  void boot();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
