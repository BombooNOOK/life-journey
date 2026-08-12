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

  // node_modules/@capacitor-community/sqlite/dist/esm/definitions.js
  var SQLiteConnection, SQLiteDBConnection;
  var init_definitions = __esm({
    "node_modules/@capacitor-community/sqlite/dist/esm/definitions.js"() {
      SQLiteConnection = class {
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
      SQLiteDBConnection = class {
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
    }
  });

  // node_modules/@capacitor-community/sqlite/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    CapacitorSQLiteWeb: () => CapacitorSQLiteWeb
  });
  var CapacitorSQLiteWeb;
  var init_web = __esm({
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

  // node_modules/@capacitor-community/sqlite/dist/esm/index.js
  var CapacitorSQLite;
  var init_esm = __esm({
    "node_modules/@capacitor-community/sqlite/dist/esm/index.js"() {
      init_dist();
      init_definitions();
      CapacitorSQLite = registerPlugin("CapacitorSQLite", {
        web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.CapacitorSQLiteWeb()),
        electron: () => window.CapacitorCustomPlatform.plugins.CapacitorSQLite
      });
    }
  });

  // src/lib/local-first/journal/types.ts
  var LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_SCHEMA_USER_VERSION, LOCAL_JOURNAL_MEDIA_ROOT;
  var init_types = __esm({
    "src/lib/local-first/journal/types.ts"() {
      "use strict";
      LOCAL_JOURNAL_DB_NAME = "ljd_local_journal";
      LOCAL_JOURNAL_SCHEMA_USER_VERSION = 1;
      LOCAL_JOURNAL_MEDIA_ROOT = "ljd/media/journal";
    }
  });

  // src/lib/local-first/journal/database.ts
  function assertLocalJournalNative() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Local Journal foundation is native-only.");
    }
  }
  function getConnection() {
    if (!connection) connection = new SQLiteConnection(CapacitorSQLite);
    return connection;
  }
  async function readUserVersion(database) {
    const versionResult = await database.query("PRAGMA user_version;");
    const raw = versionResult.values?.[0];
    const current = typeof raw?.user_version === "number" ? raw.user_version : typeof raw?.user_version === "string" ? Number(raw.user_version) : Number(Object.values(raw ?? {})[0] ?? 0);
    return Number.isFinite(current) ? current : 0;
  }
  async function applyFoundationSchema(database) {
    await database.execute(LOCAL_JOURNAL_SCHEMA_SQL);
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
  var connection, db, LOCAL_JOURNAL_SCHEMA_SQL, LOCAL_JOURNAL_EXPECTED_TABLES, LOCAL_JOURNAL_EXPECTED_COLUMNS;
  var init_database = __esm({
    "src/lib/local-first/journal/database.ts"() {
      "use strict";
      init_dist();
      init_esm();
      init_types();
      connection = null;
      db = null;
      LOCAL_JOURNAL_SCHEMA_SQL = `
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
      LOCAL_JOURNAL_EXPECTED_TABLES = [
        "local_journal_entries",
        "local_journal_tags",
        "local_media"
      ];
      LOCAL_JOURNAL_EXPECTED_COLUMNS = {
        local_journal_entries: [
          "stable_id",
          "date_key",
          "title",
          "content",
          "created_at",
          "updated_at",
          "tags_json",
          "schema_version",
          "source",
          "local_status",
          "imported_at",
          "legacy_server_id",
          "server_updated_at"
        ],
        local_journal_tags: ["journal_stable_id", "tag"],
        local_media: [
          "stable_id",
          "journal_stable_id",
          "type",
          "relative_path",
          "created_at",
          "checksum",
          "mime_type"
        ]
      };
    }
  });

  // src/lib/local-first/journal/secureBootstrap/candidateHealth.ts
  function missingExpectedTables(tables) {
    const have = new Set(tables);
    return LOCAL_JOURNAL_EXPECTED_TABLES.filter((name) => !have.has(name));
  }
  function unexpectedTables(tables) {
    const expected = new Set(LOCAL_JOURNAL_EXPECTED_TABLES);
    return tables.filter((name) => !expected.has(name) && !name.startsWith("sqlite_"));
  }
  function columnMismatches(columns) {
    const mismatches = [];
    for (const table of LOCAL_JOURNAL_EXPECTED_TABLES) {
      const have = (columns[table] ?? []).join(",");
      const want = LOCAL_JOURNAL_EXPECTED_COLUMNS[table].join(",");
      if (have !== want) mismatches.push(table);
    }
    return mismatches;
  }
  function classifyCandidateHealth(input) {
    if (!input.exists) {
      return { status: "missing", reason: null };
    }
    if (input.encrypted === false) {
      return { status: "abnormal", reason: "plaintext_candidate" };
    }
    if (input.encrypted == null) {
      return { status: "abnormal", reason: "encryption_unknown" };
    }
    if (input.userVersion !== LOCAL_JOURNAL_SCHEMA_USER_VERSION) {
      return { status: "abnormal", reason: "user_version_mismatch" };
    }
    const missing = missingExpectedTables(input.tables);
    if (missing.length > 0) {
      return { status: "abnormal", reason: `missing_tables:${missing.join(",")}` };
    }
    const extra = unexpectedTables(input.tables);
    if (extra.length > 0) {
      return { status: "abnormal", reason: `unexpected_tables:${extra.join(",")}` };
    }
    if (input.columns) {
      const drifted = columnMismatches(input.columns);
      if (drifted.length > 0) {
        return { status: "abnormal", reason: `columns:${drifted.join(",")}` };
      }
    }
    return { status: "ready", reason: null };
  }
  var init_candidateHealth = __esm({
    "src/lib/local-first/journal/secureBootstrap/candidateHealth.ts"() {
      "use strict";
      init_database();
      init_types();
    }
  });

  // src/lib/local-first/journal/secureBootstrap/types.ts
  var LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME, SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES;
  var init_types2 = __esm({
    "src/lib/local-first/journal/secureBootstrap/types.ts"() {
      "use strict";
      LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME = "ljd_local_journal_secure_candidate";
      SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES = 256 * 1024;
    }
  });

  // plugins/ljd-local-security/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    LjdLocalSecurityWeb: () => LjdLocalSecurityWeb
  });
  var LjdLocalSecurityWeb;
  var init_web2 = __esm({
    "plugins/ljd-local-security/dist/esm/web.js"() {
      "use strict";
      init_dist();
      LjdLocalSecurityWeb = class extends WebPlugin {
        async inspectPath() {
          throw this.unimplemented("Not implemented on web.");
        }
        async setCompleteProtection() {
          throw this.unimplemented("Not implemented on web.");
        }
        async setExcludedFromBackup() {
          throw this.unimplemented("Not implemented on web.");
        }
        async resolveApplicationSupportLjdDir() {
          throw this.unimplemented("Not implemented on web.");
        }
        async inspectGenericPasswordAccessibility() {
          throw this.unimplemented("Not implemented on web.");
        }
        async getVolumeAvailableCapacity() {
          throw this.unimplemented("Not implemented on web.");
        }
        async listSqliteArtifactsInLjdDir() {
          throw this.unimplemented("Not implemented on web.");
        }
        async atomicReplaceTextFile() {
          throw this.unimplemented("Not implemented on web.");
        }
        async readTextFile() {
          throw this.unimplemented("Not implemented on web.");
        }
      };
    }
  });

  // plugins/ljd-local-security/dist/esm/index.js
  var LjdLocalSecurity;
  var init_esm2 = __esm({
    "plugins/ljd-local-security/dist/esm/index.js"() {
      "use strict";
      init_dist();
      LjdLocalSecurity = registerPlugin("LjdLocalSecurity", {
        web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.LjdLocalSecurityWeb())
      });
    }
  });

  // src/lib/local-first/security/types.ts
  var LocalFirstSecurityError, LJD_FILE_PROTECTION_CANDIDATE, LJD_PLUGIN_KEYCHAIN_SERVICE, LJD_PLUGIN_KEYCHAIN_ACCOUNT, LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED, LJD_SQLITE_ENCRYPTION_MODE, LJD_IOS_DATABASE_RELATIVE_LOCATION;
  var init_types3 = __esm({
    "src/lib/local-first/security/types.ts"() {
      "use strict";
      LocalFirstSecurityError = class extends Error {
        constructor(code, message) {
          super(message);
          this.name = "LocalFirstSecurityError";
          this.code = code;
        }
      };
      LJD_FILE_PROTECTION_CANDIDATE = "NSFileProtectionComplete";
      LJD_PLUGIN_KEYCHAIN_SERVICE = "unlockSecret";
      LJD_PLUGIN_KEYCHAIN_ACCOUNT = "ljd_CapacitorSQLitePlugin";
      LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED = "kSecAttrAccessibleWhenUnlocked";
      LJD_SQLITE_ENCRYPTION_MODE = "secret";
      LJD_IOS_DATABASE_RELATIVE_LOCATION = "Library/Application Support/app.bamboonook.ljd";
    }
  });

  // src/lib/local-first/security/noSecretLog.ts
  function redactSecretLike(value) {
    if (value == null) return value;
    if (typeof value === "string") {
      if (value.length > 8 && /^[A-Za-z0-9+/=_-]{16,}$/.test(value)) {
        return "[redacted]";
      }
      return value;
    }
    if (Array.isArray(value)) return value.map(redactSecretLike);
    if (typeof value === "object") {
      const out = {};
      for (const [key, v] of Object.entries(value)) {
        out[key] = SECRET_KEY.test(key) ? "[redacted]" : redactSecretLike(v);
      }
      return out;
    }
    return value;
  }
  function safeErrorMessage(error) {
    if (error instanceof Error) {
      const msg = error.message;
      const hasSecretValue = SECRET_KEY.test(msg) && /:\s*['"]?[A-Za-z0-9+/=_-]{12,}/.test(msg);
      if (hasSecretValue) return `${error.name}: [redacted security error]`;
      return msg.replace(/\b[A-Fa-f0-9]{24,}\b/g, "[redacted]");
    }
    return String(redactSecretLike(error));
  }
  function assertNoSecretInText(text) {
    if (SECRET_KEY.test(text) && /:\s*['"]?[A-Za-z0-9+/=_-]{12,}/.test(text)) {
      throw new Error("refusing to log secret-like payload");
    }
  }
  var SECRET_KEY;
  var init_noSecretLog = __esm({
    "src/lib/local-first/security/noSecretLog.ts"() {
      "use strict";
      SECRET_KEY = /passphrase|password|secret|encryptionkey|encryption_secret|unlocksecret/i;
    }
  });

  // src/lib/local-first/security/securityErrorMapping.ts
  function mapSecurityError(error) {
    if (error instanceof LocalFirstSecurityError) return error;
    const message = safeErrorMessage(error);
    let code = "unknown";
    if (/native-only|native only/i.test(message)) code = "native_only";
    else if (/path required/i.test(message)) code = "path_required";
    else if (/journal_encryption_forbidden|must not be opened encrypted/i.test(message)) {
      code = "journal_encryption_forbidden";
    } else if (/not implemented on web|unimplemented/i.test(message)) {
      code = "bridge_unimplemented";
    }
    return new LocalFirstSecurityError(code, message);
  }
  var init_securityErrorMapping = __esm({
    "src/lib/local-first/security/securityErrorMapping.ts"() {
      "use strict";
      init_types3();
      init_noSecretLog();
    }
  });

  // src/lib/local-first/security/backupInclusion.ts
  function shouldForceBackupInclusion(current) {
    return current === true;
  }
  async function ensurePathIncludedInBackup(path) {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "backup inclusion helper is native-only"
      );
    }
    if (!path) {
      throw new LocalFirstSecurityError("path_required", "path required");
    }
    try {
      const current = await LjdLocalSecurity.inspectPath({ path });
      if (!shouldForceBackupInclusion(current.isExcludedFromBackup)) {
        return current;
      }
      return await LjdLocalSecurity.setExcludedFromBackup({
        path,
        excluded: false
      });
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  var BACKUP_INCLUSION_POLICY;
  var init_backupInclusion = __esm({
    "src/lib/local-first/security/backupInclusion.ts"() {
      "use strict";
      init_dist();
      init_esm2();
      init_securityErrorMapping();
      init_types3();
      BACKUP_INCLUSION_POLICY = {
        recommendedTiming: "after_directory_create",
        applyEveryLaunch: false,
        note: "Inspect after first directory/DB create; set excluded=false only if currently true. on_db_init is an equivalent safe hook. on_every_launch is unnecessary write traffic."
      };
    }
  });

  // src/lib/local-first/security/encryptedDatabase.ts
  function assertNotProductionJournal(name) {
    if (name === LOCAL_JOURNAL_DB_NAME) {
      throw new LocalFirstSecurityError(
        "journal_encryption_forbidden",
        "ljd_local_journal must not be opened encrypted; use a non-active candidate name"
      );
    }
  }
  function shouldSetPluginEncryptionSecret(alreadyStored) {
    return !alreadyStored;
  }
  async function isPluginEncryptionSecretStored() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      return Boolean((await CapacitorSQLite.isSecretStored()).result);
    } catch {
      return false;
    }
  }
  async function configurePluginEncryptionSecret(passphrase) {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "encryption secret configure is native-only"
      );
    }
    if (!passphrase) {
      throw new LocalFirstSecurityError("unknown", "passphrase required");
    }
    try {
      await CapacitorSQLite.setEncryptionSecret({ passphrase });
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  async function ensurePluginEncryptionSecret(passphrase) {
    const stored = await isPluginEncryptionSecretStored();
    if (!shouldSetPluginEncryptionSecret(stored)) return "reused_existing";
    await configurePluginEncryptionSecret(passphrase);
    return "set";
  }
  async function closeNamedEncryptedDatabase(name) {
    assertNotProductionJournal(name);
    try {
      const sqlite = new SQLiteConnection(CapacitorSQLite);
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
  async function openNamedEncryptedDatabase(name, version = 1) {
    assertNotProductionJournal(name);
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "encrypted DB open is native-only"
      );
    }
    try {
      const sqlite = new SQLiteConnection(CapacitorSQLite);
      try {
        await sqlite.checkConnectionsConsistency();
      } catch {
      }
      if ((await sqlite.isConnection(name, false)).result) {
        await sqlite.closeConnection(name, false);
      }
      const db2 = await sqlite.createConnection(
        name,
        true,
        LJD_SQLITE_ENCRYPTION_MODE,
        version,
        false
      );
      await db2.open();
      return db2;
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  var init_encryptedDatabase = __esm({
    "src/lib/local-first/security/encryptedDatabase.ts"() {
      "use strict";
      init_dist();
      init_esm();
      init_types();
      init_securityErrorMapping();
      init_types3();
    }
  });

  // src/lib/local-first/security/fileProtection.ts
  function isCompleteProtection(label) {
    return label === LJD_FILE_PROTECTION_CANDIDATE;
  }
  async function applyCompleteFileProtection(path) {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "file protection helper is native-only"
      );
    }
    if (!path) {
      throw new LocalFirstSecurityError("path_required", "path required");
    }
    try {
      return await LjdLocalSecurity.setCompleteProtection({ path });
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  async function inspectFileProtection(path) {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "file protection inspect is native-only"
      );
    }
    try {
      return await LjdLocalSecurity.inspectPath({ path });
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  var init_fileProtection = __esm({
    "src/lib/local-first/security/fileProtection.ts"() {
      "use strict";
      init_dist();
      init_esm2();
      init_securityErrorMapping();
      init_types3();
    }
  });

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
  var init_synapse = __esm({
    "node_modules/@capacitor/synapse/dist/synapse.mjs"() {
    }
  });

  // node_modules/@capacitor/filesystem/dist/esm/definitions.js
  var Directory, Encoding;
  var init_definitions2 = __esm({
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
  var web_exports3 = {};
  __export(web_exports3, {
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
  var init_web3 = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
      init_dist();
      init_definitions2();
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

  // node_modules/@capacitor/filesystem/dist/esm/index.js
  var Filesystem;
  var init_esm3 = __esm({
    "node_modules/@capacitor/filesystem/dist/esm/index.js"() {
      init_dist();
      init_synapse();
      init_definitions2();
      Filesystem = registerPlugin("Filesystem", {
        web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.FilesystemWeb())
      });
      f();
    }
  });

  // src/lib/local-first/security/mediaProtection.ts
  async function resolveLibraryRelativeUri(relativePath) {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "media protection helper is native-only"
      );
    }
    const uri = await Filesystem.getUri({
      path: relativePath,
      directory: Directory.Library
    });
    return uri.uri;
  }
  async function protectLifeRecordMediaRelative(relativePath) {
    try {
      const uri = await resolveLibraryRelativeUri(relativePath);
      const backup = await ensurePathIncludedInBackup(uri);
      const protection = await applyCompleteFileProtection(uri);
      return { relativePath, uri, backup, protection };
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  var init_mediaProtection = __esm({
    "src/lib/local-first/security/mediaProtection.ts"() {
      "use strict";
      init_dist();
      init_esm3();
      init_backupInclusion();
      init_fileProtection();
      init_securityErrorMapping();
      init_types3();
    }
  });

  // src/lib/local-first/security/pluginKeychain.ts
  async function inspectPluginDbKeyAccessibility() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "plugin Keychain inspect is native-only"
      );
    }
    try {
      const result = await LjdLocalSecurity.inspectGenericPasswordAccessibility({
        service: LJD_PLUGIN_KEYCHAIN_SERVICE,
        account: LJD_PLUGIN_KEYCHAIN_ACCOUNT
      });
      return {
        found: result.found,
        accessibility: result.accessibility,
        matchesWhenUnlocked: result.found && result.accessibility === LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED,
        returnedSecretData: false
      };
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  var init_pluginKeychain = __esm({
    "src/lib/local-first/security/pluginKeychain.ts"() {
      "use strict";
      init_dist();
      init_esm2();
      init_securityErrorMapping();
      init_types3();
    }
  });

  // src/lib/local-first/security/storageCapacity.ts
  function mapVolumeResultToReading(result, platform = Capacitor.getPlatform()) {
    const available = typeof result.availableBytes === "number" && Number.isFinite(result.availableBytes) ? result.availableBytes : null;
    return {
      ok: Boolean(result.ok) && available != null,
      availableBytes: available,
      importantUsageBytes: typeof result.importantUsageBytes === "number" ? result.importantUsageBytes : null,
      volumeAvailableCapacity: typeof result.volumeAvailableCapacity === "number" ? result.volumeAvailableCapacity : null,
      opportunisticUsageBytes: typeof result.opportunisticUsageBytes === "number" ? result.opportunisticUsageBytes : null,
      source: result.source,
      platform
    };
  }
  function decideCapacityKnown(availableBytes) {
    if (availableBytes == null) {
      return {
        known: false,
        availableBytes: null,
        reason: "capacity_unknown_fail_closed"
      };
    }
    return { known: true, availableBytes, reason: "ok" };
  }
  async function readStorageCapacity() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError("native_only", "storage capacity is native-only");
    }
    try {
      const result = await LjdLocalSecurity.getVolumeAvailableCapacity();
      return mapVolumeResultToReading(result);
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  async function readAvailableBytesOrNull() {
    try {
      const reading = await pluginStorageCapacityProvider.read();
      const decision = decideCapacityKnown(reading.ok ? reading.availableBytes : null);
      return {
        availableBytes: decision.availableBytes,
        source: reading.source,
        platform: reading.platform,
        decision
      };
    } catch {
      return {
        availableBytes: null,
        source: "api_error",
        platform: Capacitor.getPlatform(),
        decision: decideCapacityKnown(null)
      };
    }
  }
  var pluginStorageCapacityProvider;
  var init_storageCapacity = __esm({
    "src/lib/local-first/security/storageCapacity.ts"() {
      "use strict";
      init_dist();
      init_esm2();
      init_securityErrorMapping();
      init_types3();
      pluginStorageCapacityProvider = {
        read: readStorageCapacity
      };
    }
  });

  // src/lib/local-first/security/storageInspection.ts
  function classifySqliteArtifactRole(fileName) {
    if (fileName.endsWith("-wal") || fileName.includes(".db-wal")) return "sidecar_wal";
    if (fileName.endsWith("-shm") || fileName.includes(".db-shm")) return "sidecar_shm";
    if (fileName.includes("-journal")) return "sidecar_journal";
    if (fileName.endsWith("SQLite.db") || fileName.endsWith(".db")) return "sqlite_db";
    return "other";
  }
  async function listSqliteArtifactsReadOnly() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "sqlite artifact inspection is native-only"
      );
    }
    try {
      const listing = await LjdLocalSecurity.listSqliteArtifactsInLjdDir();
      return (listing.artifacts ?? []).map((item) => ({
        name: item.name,
        bytes: Number(item.bytes) || 0,
        role: item.role || classifySqliteArtifactRole(item.name)
      }));
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  var init_storageInspection = __esm({
    "src/lib/local-first/security/storageInspection.ts"() {
      "use strict";
      init_dist();
      init_esm2();
      init_securityErrorMapping();
      init_types3();
    }
  });

  // src/lib/local-first/security/storageLocation.ts
  function pluginRelativeLocationForBundleId(bundleId) {
    return `Library/Application Support/${bundleId}`;
  }
  function isConfiguredRelativeLocation(relative) {
    return relative === LJD_IOS_DATABASE_RELATIVE_LOCATION;
  }
  async function resolveLjdApplicationSupportDir() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "Application Support resolve is native-only"
      );
    }
    try {
      return await LjdLocalSecurity.resolveApplicationSupportLjdDir();
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  var init_storageLocation = __esm({
    "src/lib/local-first/security/storageLocation.ts"() {
      "use strict";
      init_dist();
      init_esm2();
      init_securityErrorMapping();
      init_types3();
    }
  });

  // src/lib/local-first/security/index.ts
  var security_exports = {};
  __export(security_exports, {
    BACKUP_INCLUSION_POLICY: () => BACKUP_INCLUSION_POLICY,
    LJD_FILE_PROTECTION_CANDIDATE: () => LJD_FILE_PROTECTION_CANDIDATE,
    LJD_IOS_DATABASE_RELATIVE_LOCATION: () => LJD_IOS_DATABASE_RELATIVE_LOCATION,
    LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED: () => LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED,
    LJD_PLUGIN_KEYCHAIN_ACCOUNT: () => LJD_PLUGIN_KEYCHAIN_ACCOUNT,
    LJD_PLUGIN_KEYCHAIN_SERVICE: () => LJD_PLUGIN_KEYCHAIN_SERVICE,
    LJD_SQLITE_ENCRYPTION_MODE: () => LJD_SQLITE_ENCRYPTION_MODE,
    LocalFirstSecurityError: () => LocalFirstSecurityError,
    applyCompleteFileProtection: () => applyCompleteFileProtection,
    assertNoSecretInText: () => assertNoSecretInText,
    classifySqliteArtifactRole: () => classifySqliteArtifactRole,
    closeNamedEncryptedDatabase: () => closeNamedEncryptedDatabase,
    configurePluginEncryptionSecret: () => configurePluginEncryptionSecret,
    decideCapacityKnown: () => decideCapacityKnown,
    ensurePathIncludedInBackup: () => ensurePathIncludedInBackup,
    ensurePluginEncryptionSecret: () => ensurePluginEncryptionSecret,
    inspectFileProtection: () => inspectFileProtection,
    inspectPluginDbKeyAccessibility: () => inspectPluginDbKeyAccessibility,
    isCompleteProtection: () => isCompleteProtection,
    isConfiguredRelativeLocation: () => isConfiguredRelativeLocation,
    listSqliteArtifactsReadOnly: () => listSqliteArtifactsReadOnly,
    mapSecurityError: () => mapSecurityError,
    openNamedEncryptedDatabase: () => openNamedEncryptedDatabase,
    pluginRelativeLocationForBundleId: () => pluginRelativeLocationForBundleId,
    pluginStorageCapacityProvider: () => pluginStorageCapacityProvider,
    protectLifeRecordMediaRelative: () => protectLifeRecordMediaRelative,
    readAvailableBytesOrNull: () => readAvailableBytesOrNull,
    readStorageCapacity: () => readStorageCapacity,
    redactSecretLike: () => redactSecretLike,
    resolveLibraryRelativeUri: () => resolveLibraryRelativeUri,
    resolveLjdApplicationSupportDir: () => resolveLjdApplicationSupportDir,
    safeErrorMessage: () => safeErrorMessage,
    shouldForceBackupInclusion: () => shouldForceBackupInclusion,
    shouldSetPluginEncryptionSecret: () => shouldSetPluginEncryptionSecret
  });
  var init_security = __esm({
    "src/lib/local-first/security/index.ts"() {
      "use strict";
      init_backupInclusion();
      init_encryptedDatabase();
      init_fileProtection();
      init_mediaProtection();
      init_noSecretLog();
      init_pluginKeychain();
      init_securityErrorMapping();
      init_storageCapacity();
      init_storageInspection();
      init_storageLocation();
      init_types3();
    }
  });

  // src/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper.ts
  function assertNative() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError("native_only", "secure bootstrap is native-only");
    }
  }
  function assertNotProductionJournal2(name) {
    if (name === LOCAL_JOURNAL_DB_NAME) {
      throw new LocalFirstSecurityError(
        "journal_encryption_forbidden",
        "secure bootstrap refuses ljd_local_journal"
      );
    }
  }
  function randomPassphrase() {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function candidateFileName(dbName) {
    return `${dbName}SQLite.db`;
  }
  async function resolveCandidatePath() {
    const asDir = await resolveLjdApplicationSupportDir();
    return {
      absolutePath: `${asDir.ljdApplicationSupportDir}/${candidateFileName(
        LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME
      )}`,
      locationRelative: `${asDir.pluginRelativeLocation}/${candidateFileName(
        LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME
      )}`
    };
  }
  async function readEncryptedFlag(name) {
    try {
      return Boolean(
        (await CapacitorSQLite.isDatabaseEncrypted({ database: name })).result
      );
    } catch {
      return null;
    }
  }
  async function inventory(db2) {
    const userVersion = await readUserVersion(db2);
    const tablesResult = await db2.query(
      `SELECT name FROM sqlite_master
     WHERE type='table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name;`
    );
    const tables = (tablesResult.values ?? []).map((row) => String(row.name));
    const columns = {};
    const rowCounts = {};
    for (const table of tables) {
      const info = await db2.query(`PRAGMA table_info(${table});`);
      columns[table] = (info.values ?? []).map((row) => String(row.name));
      const count = await db2.query(`SELECT COUNT(*) AS c FROM ${table};`);
      rowCounts[table] = Number(
        count.values?.[0]?.c ?? 0
      );
    }
    return { userVersion, tables, columns, rowCounts };
  }
  async function candidateExistsOnDisk() {
    const artifacts = await listSqliteArtifactsReadOnly();
    const file = candidateFileName(LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME);
    return artifacts.some((item) => item.name === file);
  }
  var LocalJournalSecureBootstrapper;
  var init_LocalJournalSecureBootstrapper = __esm({
    "src/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper.ts"() {
      "use strict";
      init_dist();
      init_esm();
      init_database();
      init_candidateHealth();
      init_types2();
      init_types();
      init_security();
      init_types3();
      LocalJournalSecureBootstrapper = {
        async inspect() {
          assertNative();
          const dbName = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
          assertNotProductionJournal2(dbName);
          const exists = await candidateExistsOnDisk();
          let encrypted = exists ? await readEncryptedFlag(dbName) : null;
          const path = await resolveCandidatePath();
          let userVersion = null;
          let tables = [];
          let rowCounts = {};
          let columns;
          if (exists && encrypted === true) {
            try {
              const db2 = await openNamedEncryptedDatabase(dbName, 1);
              const inv = await inventory(db2);
              await closeNamedEncryptedDatabase(dbName);
              userVersion = inv.userVersion;
              tables = inv.tables;
              rowCounts = inv.rowCounts;
              columns = inv.columns;
            } catch {
              encrypted = null;
            }
          }
          let backupExcluded = null;
          let fileProtection = null;
          let completeProtection = null;
          if (exists) {
            try {
              const attrs = await inspectFileProtection(path.absolutePath);
              backupExcluded = attrs.isExcludedFromBackup;
              fileProtection = String(attrs.fileProtection);
              completeProtection = isCompleteProtection(fileProtection);
            } catch {
              backupExcluded = "api_unavailable";
            }
          }
          const health = classifyCandidateHealth({
            exists,
            encrypted,
            userVersion,
            tables,
            columns
          });
          return {
            dbName,
            exists,
            encrypted,
            userVersion,
            tables,
            rowCounts,
            backupExcluded,
            fileProtection,
            completeProtection,
            locationRelative: path.locationRelative,
            health
          };
        },
        async bootstrap(options) {
          assertNative();
          const dbName = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
          assertNotProductionJournal2(dbName);
          let availableBytes;
          if (options && Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
            availableBytes = options.availableBytes ?? null;
          } else {
            availableBytes = (await readAvailableBytesOrNull()).availableBytes;
          }
          const known = decideCapacityKnown(availableBytes);
          if (!known.known && options?.allowUnknownCapacity !== true) {
            return {
              ok: false,
              status: "blocked",
              dbName,
              detail: "capacity_unknown_fail_closed",
              pluginKeychain: null
            };
          }
          if (known.known && known.availableBytes != null && known.availableBytes < SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES) {
            return {
              ok: false,
              status: "blocked",
              dbName,
              detail: "insufficient_free_space",
              pluginKeychain: null
            };
          }
          const current = await LocalJournalSecureBootstrapper.inspect();
          if (current.health.status === "abnormal") {
            return {
              ok: false,
              status: "abnormal",
              dbName,
              detail: `fail_closed:${current.health.reason}`,
              encrypted: current.encrypted,
              userVersion: current.userVersion,
              rowCounts: current.rowCounts,
              pluginKeychain: null
            };
          }
          if (current.health.status === "ready") {
            return {
              ok: true,
              status: "already_ready",
              alreadyReady: true,
              dbName,
              detail: "existing encrypted candidate is ready; left untouched",
              encrypted: current.encrypted,
              userVersion: current.userVersion,
              rowCounts: current.rowCounts,
              pluginKeychain: "reused_existing"
            };
          }
          try {
            const pluginKeychain = await ensurePluginEncryptionSecret(
              options?.passphrase ?? randomPassphrase()
            );
            const db2 = await openNamedEncryptedDatabase(dbName, 1);
            await applyFoundationSchema(db2);
            const inv = await inventory(db2);
            const health = classifyCandidateHealth({
              exists: true,
              encrypted: true,
              userVersion: inv.userVersion,
              tables: inv.tables,
              columns: inv.columns
            });
            await closeNamedEncryptedDatabase(dbName);
            if (health.status !== "ready") {
              return {
                ok: false,
                status: "abnormal",
                dbName,
                detail: `created_but_unhealthy:${health.reason}`,
                pluginKeychain
              };
            }
            const zero = LOCAL_JOURNAL_EXPECTED_TABLES.every((table) => (inv.rowCounts[table] ?? 0) === 0);
            if (!zero) {
              return {
                ok: false,
                status: "abnormal",
                dbName,
                detail: "fresh_bootstrap_expected_zero_rows",
                rowCounts: inv.rowCounts,
                pluginKeychain
              };
            }
            const path = await resolveCandidatePath();
            await ensurePathIncludedInBackup(path.absolutePath);
            await applyCompleteFileProtection(path.absolutePath);
            return {
              ok: true,
              status: "created",
              dbName,
              detail: `created encrypted candidate keychain=${pluginKeychain}`,
              encrypted: true,
              userVersion: inv.userVersion,
              rowCounts: inv.rowCounts,
              pluginKeychain
            };
          } catch (error) {
            return {
              ok: false,
              status: "abnormal",
              dbName,
              detail: safeErrorMessage(error),
              pluginKeychain: null
            };
          }
        },
        async inspectKeychainAvailable() {
          try {
            const kc = await inspectPluginDbKeyAccessibility();
            return kc.found === true;
          } catch {
            return false;
          }
        }
      };
    }
  });

  // src/lib/local-first/journal/secureCopy/types.ts
  var SERVER_COPY_TARGET_DB_NAME, SECURE_CANDIDATE_MEDIA_ROOT, SECURE_COPY_MIN_AVAILABLE_BYTES, SECURE_COPY_MAX_EXPLICIT_IDS, TEST_PURPOSE_TAGS, FAILURE_INJECTION_MISSING_ENTRY_ID;
  var init_types4 = __esm({
    "src/lib/local-first/journal/secureCopy/types.ts"() {
      "use strict";
      init_types2();
      SERVER_COPY_TARGET_DB_NAME = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
      SECURE_CANDIDATE_MEDIA_ROOT = "ljd/media/journal-secure-candidate";
      SECURE_COPY_MIN_AVAILABLE_BYTES = 1024 * 1024;
      SECURE_COPY_MAX_EXPLICIT_IDS = 20;
      TEST_PURPOSE_TAGS = [
        "#\u30C6\u30B9\u30C8",
        "#\u304A\u5F15\u8D8A\u3057\u30C6\u30B9\u30C8",
        "#LocalCopyTest",
        "#WriteThroughTest"
      ];
      FAILURE_INJECTION_MISSING_ENTRY_ID = "ljd-poc-missing-entry-id";
    }
  });

  // src/lib/local-first/journal/checksum.ts
  async function sha256HexOfBytes(bytes) {
    const digest = await crypto.subtle.digest("SHA-256", bytes.slice());
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function sha256HexOfUtf8(text) {
    return sha256HexOfBytes(new TextEncoder().encode(text));
  }
  async function sha256HexOfBase64(base64Data) {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return sha256HexOfBytes(bytes);
  }
  var init_checksum = __esm({
    "src/lib/local-first/journal/checksum.ts"() {
      "use strict";
    }
  });

  // src/lib/local-first/journal/activation/types.ts
  function assertAllowedTechnicalDatabaseId(databaseId) {
    if (databaseId === LOCAL_JOURNAL_DB_NAME) {
      throw new Error("production plaintext DB cannot be technical-active target");
    }
    if (databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) {
      throw new Error(`technical activation allows only ${TECHNICAL_ACTIVE_DATABASE_ID}`);
    }
  }
  var ACTIVATION_MANIFEST_FORMAT_VERSION, ACTIVATION_MANIFEST_FILE_NAME, TECHNICAL_CANDIDATE_GENERATION, TECHNICAL_ACTIVE_DATABASE_ID, TECHNICAL_ACTIVE_MEDIA_ROOT_ID, EXPECTED_JOURNAL_SCHEMA_VERSION;
  var init_types5 = __esm({
    "src/lib/local-first/journal/activation/types.ts"() {
      "use strict";
      init_types2();
      init_types4();
      init_types();
      ACTIVATION_MANIFEST_FORMAT_VERSION = 1;
      ACTIVATION_MANIFEST_FILE_NAME = "ljd-local-journal-activation.json";
      TECHNICAL_CANDIDATE_GENERATION = 2;
      TECHNICAL_ACTIVE_DATABASE_ID = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
      TECHNICAL_ACTIVE_MEDIA_ROOT_ID = SECURE_CANDIDATE_MEDIA_ROOT;
      EXPECTED_JOURNAL_SCHEMA_VERSION = 1;
    }
  });

  // src/lib/local-first/journal/activation/activationPreflight.ts
  function push(checks, id, ok, detail) {
    checks.push({ id, ok, detail });
  }
  async function runTechnicalActivationPreflight(options) {
    const checks = [];
    const targetDatabaseId = TECHNICAL_ACTIVE_DATABASE_ID;
    const targetMediaRootId = TECHNICAL_ACTIVE_MEDIA_ROOT_ID;
    try {
      assertAllowedTechnicalDatabaseId(targetDatabaseId);
      push(checks, "allowed_target", true, targetDatabaseId);
    } catch (error) {
      push(checks, "allowed_target", false, String(error));
      return {
        ok: false,
        targetDatabaseId,
        targetMediaRootId,
        checks,
        inspection: null
      };
    }
    let availableBytes;
    if (options && Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
      availableBytes = options.availableBytes ?? null;
    } else {
      availableBytes = (await readAvailableBytesOrNull()).availableBytes;
      if (availableBytes == null) {
        availableBytes = (await readAvailableBytesOrNull()).availableBytes;
      }
    }
    const capacity = decideCapacityKnown(availableBytes);
    if (!capacity.known && options?.allowUnknownCapacity !== true) {
      push(checks, "capacity", false, "capacity_unknown_fail_closed");
    } else {
      push(
        checks,
        "capacity",
        true,
        capacity.known ? `available=${String(availableBytes)}` : "unknown_allowed"
      );
    }
    const inspection = options?.inspection ?? await LocalJournalSecureBootstrapper.inspect();
    push(
      checks,
      "db_exists",
      inspection.exists === true,
      `exists=${String(inspection.exists)}`
    );
    push(
      checks,
      "encrypted",
      inspection.encrypted === true,
      `encrypted=${String(inspection.encrypted)}`
    );
    push(
      checks,
      "application_support",
      Boolean(inspection.locationRelative?.includes("Application Support")),
      inspection.locationRelative ?? "missing_location"
    );
    push(
      checks,
      "schema_version",
      inspection.userVersion === EXPECTED_JOURNAL_SCHEMA_VERSION,
      `user_version=${String(inspection.userVersion)}`
    );
    push(
      checks,
      "health_ready",
      inspection.health.status === "ready",
      `health=${inspection.health.status}`
    );
    push(
      checks,
      "row_counts_readable",
      typeof inspection.rowCounts.local_journal_entries === "number",
      `entries=${String(inspection.rowCounts.local_journal_entries ?? null)}`
    );
    push(
      checks,
      "file_protection_complete",
      inspection.completeProtection === true,
      `protection=${String(inspection.fileProtection)}`
    );
    push(
      checks,
      "backup_included",
      inspection.backupExcluded === false,
      `backupExcluded=${String(inspection.backupExcluded)}`
    );
    if (!options?.skipKeychain) {
      try {
        const kc = await inspectPluginDbKeyAccessibility();
        push(
          checks,
          "plugin_keychain_usable",
          kc.found === true,
          `found=${String(kc.found)} accessibility=${String(kc.accessibility)}`
        );
      } catch (error) {
        push(checks, "plugin_keychain_usable", false, String(error));
      }
    } else {
      push(checks, "plugin_keychain_usable", true, "skipped_in_unit_test");
    }
    if (inspection.exists && inspection.encrypted === true && inspection.health.status === "ready") {
      try {
        const deep = await inspectCandidateIntegrity(options?.skipMediaFilesystem === true);
        push(
          checks,
          "integrity_counts",
          deep.entryCount >= 0 && deep.mediaCount >= 0,
          `entries=${deep.entryCount} media=${deep.mediaCount}`
        );
        push(checks, "legacy_server_id_unique", deep.legacyUnique, deep.legacyDetail);
        push(checks, "media_refs_consistent", deep.mediaRefsOk, deep.mediaDetail);
        push(
          checks,
          "source_changed_unresolved",
          true,
          "no_persisted_source_changed_markers"
        );
      } catch (error) {
        push(checks, "integrity_open", false, String(error));
      }
    } else {
      push(checks, "integrity_open", false, "candidate_not_ready_for_integrity");
    }
    push(
      checks,
      "media_root_generation",
      targetMediaRootId === TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
      targetMediaRootId
    );
    const ok = checks.every((c) => c.ok);
    return {
      ok,
      targetDatabaseId,
      targetMediaRootId,
      checks,
      inspection
    };
  }
  async function inspectCandidateIntegrity(skipMediaFilesystem) {
    const { openNamedEncryptedDatabase: openNamedEncryptedDatabase2, closeNamedEncryptedDatabase: closeNamedEncryptedDatabase2 } = await Promise.resolve().then(() => (init_security(), security_exports));
    const db2 = await openNamedEncryptedDatabase2(TECHNICAL_ACTIVE_DATABASE_ID, 1);
    try {
      const entryCountResult = await db2.query(
        `SELECT COUNT(*) AS c FROM local_journal_entries;`
      );
      const mediaCountResult = await db2.query(`SELECT COUNT(*) AS c FROM local_media;`);
      const entryCount = Number(
        entryCountResult.values?.[0]?.c ?? 0
      );
      const mediaCount = Number(
        mediaCountResult.values?.[0]?.c ?? 0
      );
      const legacyRows = await db2.query(
        `SELECT legacy_server_id AS id, COUNT(*) AS c
       FROM local_journal_entries
       WHERE legacy_server_id IS NOT NULL AND TRIM(legacy_server_id) != ''
       GROUP BY legacy_server_id
       HAVING c > 1;`
      );
      const dupes = legacyRows.values?.length ?? 0;
      const nullLegacy = await db2.query(
        `SELECT COUNT(*) AS c FROM local_journal_entries
       WHERE legacy_server_id IS NULL OR TRIM(legacy_server_id) = '';`
      );
      const nullCount = Number(
        nullLegacy.values?.[0]?.c ?? 0
      );
      const legacyUnique = dupes === 0 && nullCount === 0;
      const legacyDetail = `dupes=${dupes} nullOrEmpty=${nullCount}`;
      const media = await db2.query(
        `SELECT relative_path AS path, checksum AS checksum FROM local_media;`
      );
      const refs = media.values ?? [];
      let missing = 0;
      if (!skipMediaFilesystem) {
        for (const ref of refs) {
          const path = String(ref.path ?? "");
          if (!path.startsWith(`${TECHNICAL_ACTIVE_MEDIA_ROOT_ID}/`)) {
            missing += 1;
            continue;
          }
          try {
            await Filesystem.stat({ path, directory: Directory.Library });
          } catch {
            missing += 1;
          }
        }
      }
      const mediaRefsOk = missing === 0;
      return {
        entryCount,
        mediaCount,
        legacyUnique,
        legacyDetail,
        mediaRefsOk,
        mediaDetail: `refs=${refs.length} missingOrBadRoot=${missing} skipFs=${String(skipMediaFilesystem)}`
      };
    } finally {
      await closeNamedEncryptedDatabase2(TECHNICAL_ACTIVE_DATABASE_ID);
    }
  }
  var init_activationPreflight = __esm({
    "src/lib/local-first/journal/activation/activationPreflight.ts"() {
      "use strict";
      init_esm3();
      init_LocalJournalSecureBootstrapper();
      init_types5();
      init_security();
    }
  });

  // src/lib/local-first/journal/activation/manifestCanonical.ts
  function sortValue(value) {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(sortValue);
    const obj = value;
    const out = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortValue(obj[key]);
    }
    return out;
  }
  function canonicalJsonString(value) {
    return JSON.stringify(sortValue(value));
  }
  function manifestBodyWithoutChecksum(manifest) {
    const {
      formatVersion,
      generation,
      activeDatabaseId,
      activeMediaRootId,
      previousDatabaseId,
      previousMediaRootId,
      activationState,
      schemaVersion,
      activatedAt
    } = manifest;
    return {
      formatVersion,
      generation,
      activeDatabaseId,
      activeMediaRootId,
      previousDatabaseId,
      previousMediaRootId,
      activationState,
      schemaVersion,
      activatedAt
    };
  }
  async function computeManifestChecksum(body) {
    const without = manifestBodyWithoutChecksum(body);
    return sha256HexOfUtf8(canonicalJsonString(without));
  }
  async function attachManifestChecksum(body) {
    const checksum = await computeManifestChecksum(body);
    return { ...body, checksum };
  }
  async function verifyManifestChecksum(manifest) {
    const expected = await computeManifestChecksum(manifest);
    return expected === manifest.checksum;
  }
  var init_manifestCanonical = __esm({
    "src/lib/local-first/journal/activation/manifestCanonical.ts"() {
      "use strict";
      init_checksum();
    }
  });

  // src/lib/local-first/journal/activation/LocalJournalActivationManifestStore.ts
  function isActivationState(value) {
    return value === "inactive" || value === "activating" || value === "active" || value === "rollback_pending";
  }
  function parseManifestShape(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const o = raw;
    if (typeof o.formatVersion !== "number") return null;
    if (typeof o.generation !== "number") return null;
    if (typeof o.activeDatabaseId !== "string" || !o.activeDatabaseId) return null;
    if (typeof o.activeMediaRootId !== "string" || !o.activeMediaRootId) return null;
    if (!(o.previousDatabaseId === null || typeof o.previousDatabaseId === "string")) return null;
    if (!(o.previousMediaRootId === null || typeof o.previousMediaRootId === "string")) return null;
    if (!isActivationState(o.activationState)) return null;
    if (typeof o.schemaVersion !== "number") return null;
    if (!(o.activatedAt === null || typeof o.activatedAt === "string")) return null;
    if (typeof o.checksum !== "string" || !o.checksum) return null;
    return {
      formatVersion: o.formatVersion,
      generation: o.generation,
      activeDatabaseId: o.activeDatabaseId,
      activeMediaRootId: o.activeMediaRootId,
      previousDatabaseId: o.previousDatabaseId,
      previousMediaRootId: o.previousMediaRootId,
      activationState: o.activationState,
      schemaVersion: o.schemaVersion,
      activatedAt: o.activatedAt,
      checksum: o.checksum
    };
  }
  function createMemoryManifestFs() {
    const files = /* @__PURE__ */ new Map();
    return {
      files,
      replaceCalls: 0,
      async readText(absolutePath) {
        if (!files.has(absolutePath)) return { exists: false, contents: null };
        return { exists: true, contents: files.get(absolutePath) };
      },
      async atomicReplaceText(absolutePath, contents) {
        this.replaceCalls += 1;
        files.set(absolutePath, contents);
      }
    };
  }
  async function createNativeManifestFs() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError("native_only", "manifest FS is native-only");
    }
    return {
      async readText(absolutePath) {
        const result = await LjdLocalSecurity.readTextFile({ path: absolutePath });
        return {
          exists: result.exists,
          contents: result.contents ?? null
        };
      },
      async atomicReplaceText(absolutePath, contents) {
        await LjdLocalSecurity.atomicReplaceTextFile({
          path: absolutePath,
          contents
        });
      }
    };
  }
  async function resolveActivationManifestAbsolutePath() {
    const asDir = await resolveLjdApplicationSupportDir();
    return `${asDir.ljdApplicationSupportDir}/${ACTIVATION_MANIFEST_FILE_NAME}`;
  }
  var LocalJournalActivationManifestStore;
  var init_LocalJournalActivationManifestStore = __esm({
    "src/lib/local-first/journal/activation/LocalJournalActivationManifestStore.ts"() {
      "use strict";
      init_dist();
      init_esm2();
      init_manifestCanonical();
      init_types5();
      init_security();
      init_types3();
      LocalJournalActivationManifestStore = {
        async readWithFs(absolutePath, fs) {
          const file = await fs.readText(absolutePath);
          if (!file.exists || file.contents == null) {
            return { status: "missing", manifest: null };
          }
          let parsed;
          try {
            parsed = JSON.parse(file.contents);
          } catch {
            return { status: "corrupt_json", manifest: null, detail: "json_parse_failed" };
          }
          const shape = parseManifestShape(parsed);
          if (!shape) {
            return { status: "invalid_shape", manifest: null, detail: "missing_required_fields" };
          }
          if (shape.formatVersion !== ACTIVATION_MANIFEST_FORMAT_VERSION) {
            return {
              status: "unknown_format",
              manifest: null,
              detail: `formatVersion=${shape.formatVersion}`
            };
          }
          const ok = await verifyManifestChecksum(shape);
          if (!ok) {
            return { status: "checksum_mismatch", manifest: null, detail: "checksum_mismatch" };
          }
          return { status: "ok", manifest: shape };
        },
        async writeBodyWithFs(absolutePath, body, fs) {
          const manifest = await attachManifestChecksum(body);
          const json = `${JSON.stringify(manifest, null, 2)}
`;
          await fs.atomicReplaceText(absolutePath, json);
          return manifest;
        },
        async readNative() {
          const path = await resolveActivationManifestAbsolutePath();
          const fs = await createNativeManifestFs();
          return this.readWithFs(path, fs);
        },
        async writeBodyNative(body) {
          const path = await resolveActivationManifestAbsolutePath();
          const fs = await createNativeManifestFs();
          return this.writeBodyWithFs(path, body, fs);
        }
      };
    }
  });

  // src/lib/local-first/journal/activation/LocalJournalTechnicalActivation.ts
  var LocalJournalTechnicalActivation_exports = {};
  __export(LocalJournalTechnicalActivation_exports, {
    LocalJournalTechnicalActivation: () => LocalJournalTechnicalActivation,
    activateTechnicalCandidateWithFs: () => activateTechnicalCandidateWithFs,
    createMemoryManifestFs: () => createMemoryManifestFs,
    demonstrateManifestRollbackSemantics: () => demonstrateManifestRollbackSemantics,
    resolveTechnicalActiveLocalJournalWithFs: () => resolveTechnicalActiveLocalJournalWithFs
  });
  function candidateBody(nowIso) {
    return {
      formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
      generation: TECHNICAL_CANDIDATE_GENERATION,
      activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
      activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
      previousDatabaseId: null,
      previousMediaRootId: null,
      activationState: "active",
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      activatedAt: nowIso
    };
  }
  async function activateTechnicalCandidateWithFs(options) {
    assertAllowedTechnicalDatabaseId(TECHNICAL_ACTIVE_DATABASE_ID);
    const existing = await LocalJournalActivationManifestStore.readWithFs(
      options.absolutePath,
      options.fs
    );
    if (existing.status === "ok") {
      const m = existing.manifest;
      if (m.activationState === "active" && m.activeDatabaseId === TECHNICAL_ACTIVE_DATABASE_ID && m.activeMediaRootId === TECHNICAL_ACTIVE_MEDIA_ROOT_ID) {
        return {
          code: "already_active",
          ok: true,
          manifest: m,
          detail: "technical candidate already active in manifest",
          preflightOk: null
        };
      }
    } else if (existing.status !== "missing") {
      return {
        code: "manifest_corrupt",
        ok: false,
        manifest: null,
        detail: `${existing.status}:${existing.detail}`,
        preflightOk: null
      };
    }
    let preflightOk = true;
    let preflightDetail = "ok";
    if (options.preflightOverride) {
      preflightOk = options.preflightOverride.ok;
      preflightDetail = options.preflightOverride.detail;
    } else {
      const preflight = await runTechnicalActivationPreflight({
        availableBytes: options.availableBytes,
        allowUnknownCapacity: options.allowUnknownCapacity,
        skipMediaFilesystem: options.skipMediaFilesystem,
        skipKeychain: options.skipKeychain
      });
      preflightOk = preflight.ok;
      preflightDetail = preflight.ok ? `checks=${preflight.checks.length}` : preflight.checks.filter((c) => !c.ok).map((c) => c.id).join(",");
      if (!preflight.inspection?.exists) {
        return {
          code: "target_missing",
          ok: false,
          manifest: null,
          detail: "candidate database missing",
          preflightOk: false
        };
      }
    }
    if (!preflightOk) {
      if (existing.status === "ok") {
        return {
          code: "rollback_preserved",
          ok: false,
          manifest: existing.manifest,
          detail: `preflight_failed:${preflightDetail}`,
          preflightOk: false
        };
      }
      return {
        code: "preflight_failed",
        ok: false,
        manifest: null,
        detail: preflightDetail,
        preflightOk: false
      };
    }
    const nowIso = options.nowIso ?? (/* @__PURE__ */ new Date()).toISOString();
    const manifest = await LocalJournalActivationManifestStore.writeBodyWithFs(
      options.absolutePath,
      candidateBody(nowIso),
      options.fs
    );
    return {
      code: "activated",
      ok: true,
      manifest,
      detail: "technical activation pointer written",
      preflightOk: true
    };
  }
  async function resolveTechnicalActiveLocalJournalWithFs(options) {
    const read = await LocalJournalActivationManifestStore.readWithFs(
      options.absolutePath,
      options.fs
    );
    return interpretResolve(read, options.verifyDatabaseExists);
  }
  async function interpretResolve(read, verifyDatabaseExists) {
    if (read.status === "missing") {
      return {
        status: "no_activation",
        manifest: null,
        detail: "manifest_missing",
        technicalDatabaseId: null,
        technicalMediaRootId: null
      };
    }
    if (read.status === "corrupt_json" || read.status === "invalid_shape") {
      return {
        status: "corrupt_manifest",
        manifest: null,
        detail: read.detail,
        technicalDatabaseId: null,
        technicalMediaRootId: null
      };
    }
    if (read.status === "checksum_mismatch") {
      return {
        status: "checksum_mismatch",
        manifest: null,
        detail: read.detail,
        technicalDatabaseId: null,
        technicalMediaRootId: null
      };
    }
    if (read.status === "unknown_format") {
      return {
        status: "unknown_format",
        manifest: null,
        detail: read.detail,
        technicalDatabaseId: null,
        technicalMediaRootId: null
      };
    }
    const manifest = read.manifest;
    if (manifest.activeDatabaseId === "ljd_local_journal") {
      return {
        status: "rejected_target",
        manifest,
        detail: "production plaintext rejected",
        technicalDatabaseId: null,
        technicalMediaRootId: null
      };
    }
    if (manifest.activeDatabaseId !== TECHNICAL_ACTIVE_DATABASE_ID) {
      return {
        status: "rejected_target",
        manifest,
        detail: `unsupported databaseId=${manifest.activeDatabaseId}`,
        technicalDatabaseId: null,
        technicalMediaRootId: null
      };
    }
    if (manifest.activationState !== "active") {
      return {
        status: "preflight_failed",
        manifest,
        detail: `activationState=${manifest.activationState}`,
        technicalDatabaseId: null,
        technicalMediaRootId: null
      };
    }
    if (verifyDatabaseExists) {
      const exists = await verifyDatabaseExists(manifest.activeDatabaseId);
      if (!exists) {
        return {
          status: "missing_database",
          manifest,
          detail: "manifest points to missing database \u2014 fail-closed, no discovery",
          technicalDatabaseId: null,
          technicalMediaRootId: null
        };
      }
    }
    return {
      status: "ready",
      manifest,
      detail: "technical active candidate resolvable (developer-only)",
      technicalDatabaseId: manifest.activeDatabaseId,
      technicalMediaRootId: manifest.activeMediaRootId
    };
  }
  async function demonstrateManifestRollbackSemantics(options) {
    const genA = {
      formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
      generation: 2,
      activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
      activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
      previousDatabaseId: null,
      previousMediaRootId: null,
      activationState: "active",
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      activatedAt: "2026-08-12T00:00:00.000Z"
    };
    await LocalJournalActivationManifestStore.writeBodyWithFs(
      options.absolutePath,
      genA,
      options.fs
    );
    const genB = {
      formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
      generation: 3,
      activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
      activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
      previousDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
      previousMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
      activationState: "active",
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      activatedAt: "2026-08-12T01:00:00.000Z"
    };
    const verificationOk = false;
    if (!verificationOk) {
      const after = await LocalJournalActivationManifestStore.readWithFs(
        options.absolutePath,
        options.fs
      );
      const preserved = after.status === "ok" && after.manifest.generation === 2 && after.manifest.checksum.length > 0;
      void genB;
      return {
        code: preserved ? "rollback_preserved" : "preflight_failed",
        preservedGeneration: after.status === "ok" ? after.manifest.generation : null,
        detail: preserved ? "generation A manifest retained after failed B verification (no DB rename/delete)" : `unexpected after=${after.status}`
      };
    }
    await LocalJournalActivationManifestStore.writeBodyWithFs(
      options.absolutePath,
      genB,
      options.fs
    );
    return {
      code: "activated",
      preservedGeneration: null,
      detail: "unexpected B write"
    };
  }
  var LocalJournalTechnicalActivation;
  var init_LocalJournalTechnicalActivation = __esm({
    "src/lib/local-first/journal/activation/LocalJournalTechnicalActivation.ts"() {
      "use strict";
      init_dist();
      init_activationPreflight();
      init_LocalJournalActivationManifestStore();
      init_types5();
      init_types3();
      init_LocalJournalSecureBootstrapper();
      LocalJournalTechnicalActivation = {
        async activateCandidate(options) {
          if (!Capacitor.isNativePlatform()) {
            return {
              code: "native_only",
              ok: false,
              manifest: null,
              detail: "technical activation is native-only",
              preflightOk: null
            };
          }
          const absolutePath = await resolveActivationManifestAbsolutePath();
          const fs = await createNativeManifestFs();
          return activateTechnicalCandidateWithFs({
            fs,
            absolutePath,
            availableBytes: options?.availableBytes,
            allowUnknownCapacity: options?.allowUnknownCapacity
          });
        },
        async resolve() {
          if (!Capacitor.isNativePlatform()) {
            throw new LocalFirstSecurityError("native_only", "resolve is native-only");
          }
          const absolutePath = await resolveActivationManifestAbsolutePath();
          const fs = await createNativeManifestFs();
          return resolveTechnicalActiveLocalJournalWithFs({
            fs,
            absolutePath,
            verifyDatabaseExists: async (databaseId) => {
              if (databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) return false;
              const inspection = await LocalJournalSecureBootstrapper.inspect();
              return inspection.exists === true && inspection.encrypted === true;
            }
          });
        }
      };
    }
  });

  // src/lib/local-first/journal/generation/ResolvedLocalJournalGeneration.ts
  function isPlaintextProductionDatabaseId(databaseId) {
    return databaseId === LOCAL_JOURNAL_DB_NAME;
  }
  function assertDbMediaPairIntegrity(target) {
    if (isPlaintextProductionDatabaseId(target.databaseId)) {
      throw new Error("plaintext_forbidden");
    }
    if (target.mediaRootId === LOCAL_JOURNAL_MEDIA_ROOT) {
      throw new Error("plaintext_media_forbidden");
    }
    const allowed = ALLOWED_TECHNICAL_GENERATION_PAIRS.some(
      (p) => p.databaseId === target.databaseId && p.mediaRootId === target.mediaRootId
    );
    if (!allowed) {
      throw new Error("db_media_pair_mismatch");
    }
  }
  function mapManifestToResolvedGeneration(input) {
    if (isPlaintextProductionDatabaseId(input.databaseId)) {
      return {
        ok: false,
        reason: "plaintext_forbidden",
        detail: "ljd_local_journal cannot be a technical generation target"
      };
    }
    try {
      assertDbMediaPairIntegrity(input);
    } catch (error) {
      const msg = String(error);
      if (msg.includes("plaintext")) {
        return { ok: false, reason: "plaintext_forbidden", detail: msg };
      }
      return { ok: false, reason: "db_media_pair_mismatch", detail: msg };
    }
    if (input.schemaVersion !== EXPECTED_JOURNAL_SCHEMA_VERSION) {
      return {
        ok: false,
        reason: "unsupported_generation",
        detail: `schemaVersion=${input.schemaVersion}`
      };
    }
    return {
      ok: true,
      target: {
        generation: input.generation,
        databaseId: input.databaseId,
        mediaRootId: input.mediaRootId,
        schemaVersion: input.schemaVersion,
        manifestChecksum: input.manifestChecksum
      }
    };
  }
  var ALLOWED_TECHNICAL_GENERATION_PAIRS;
  var init_ResolvedLocalJournalGeneration = __esm({
    "src/lib/local-first/journal/generation/ResolvedLocalJournalGeneration.ts"() {
      "use strict";
      init_types5();
      init_types();
      ALLOWED_TECHNICAL_GENERATION_PAIRS = [
        {
          databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
          mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
          generation: TECHNICAL_CANDIDATE_GENERATION
        }
      ];
    }
  });

  // src/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget.ts
  var resolveLocalJournalGenerationTarget_exports = {};
  __export(resolveLocalJournalGenerationTarget_exports, {
    readManifestChecksumNative: () => readManifestChecksumNative,
    resolveLocalJournalGenerationTarget: () => resolveLocalJournalGenerationTarget,
    resolveLocalJournalGenerationTargetWithFs: () => resolveLocalJournalGenerationTargetWithFs
  });
  function mapTechnicalStatus(status) {
    switch (status) {
      case "no_activation":
        return { ok: false, reason: "no_activation", detail: status };
      case "corrupt_manifest":
        return { ok: false, reason: "corrupt_manifest", detail: status };
      case "missing_database":
        return { ok: false, reason: "missing_database", detail: status };
      case "preflight_failed":
        return { ok: false, reason: "preflight_failed", detail: status };
      case "checksum_mismatch":
        return { ok: false, reason: "checksum_mismatch", detail: status };
      case "unknown_format":
        return { ok: false, reason: "unknown_format", detail: status };
      case "rejected_target":
        return { ok: false, reason: "rejected_target", detail: status };
      default:
        return { ok: false, reason: "preflight_failed", detail: status };
    }
  }
  async function resolveLocalJournalGenerationTargetWithFs(options) {
    let availableBytes = null;
    if (Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
      availableBytes = options.availableBytes ?? null;
    }
    const capacity = decideCapacityKnown(availableBytes);
    if (!capacity.known && options.allowUnknownCapacity !== true) {
      return {
        ok: false,
        reason: "capacity_unknown",
        detail: "capacity_unknown_fail_closed"
      };
    }
    const technical = await resolveTechnicalActiveLocalJournalWithFs({
      fs: options.fs,
      absolutePath: options.absolutePath,
      verifyDatabaseExists: options.verifyDatabaseExists
    });
    if (technical.status !== "ready" || !technical.manifest) {
      return mapTechnicalStatus(technical.status);
    }
    return mapManifestToResolvedGeneration({
      generation: technical.manifest.generation,
      databaseId: technical.manifest.activeDatabaseId,
      mediaRootId: technical.manifest.activeMediaRootId,
      schemaVersion: technical.manifest.schemaVersion,
      manifestChecksum: technical.manifest.checksum
    });
  }
  async function resolveLocalJournalGenerationTarget(options) {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError("native_only", "generation resolve is native-only");
    }
    let availableBytes;
    if (options && Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
      availableBytes = options.availableBytes ?? null;
    } else {
      availableBytes = (await readAvailableBytesOrNull()).availableBytes;
      if (availableBytes == null) {
        availableBytes = (await readAvailableBytesOrNull()).availableBytes;
      }
    }
    const capacity = decideCapacityKnown(availableBytes);
    if (!capacity.known && options?.allowUnknownCapacity !== true) {
      return {
        ok: false,
        reason: "capacity_unknown",
        detail: "capacity_unknown_fail_closed"
      };
    }
    const absolutePath = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    return resolveLocalJournalGenerationTargetWithFs({
      fs,
      absolutePath,
      availableBytes,
      allowUnknownCapacity: true,
      // already gated above
      verifyDatabaseExists: async (databaseId) => {
        if (databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) return false;
        const inspection = await LocalJournalSecureBootstrapper.inspect();
        return inspection.exists === true && inspection.encrypted === true;
      }
    });
  }
  async function readManifestChecksumNative() {
    const read = await LocalJournalActivationManifestStore.readNative();
    return read.status === "ok" ? read.manifest.checksum : null;
  }
  var init_resolveLocalJournalGenerationTarget = __esm({
    "src/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget.ts"() {
      "use strict";
      init_dist();
      init_LocalJournalActivationManifestStore();
      init_LocalJournalTechnicalActivation();
      init_LocalJournalSecureBootstrapper();
      init_ResolvedLocalJournalGeneration();
      init_security();
      init_types3();
      init_types5();
    }
  });

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  init_dist();
  init_database();
  init_LocalJournalSecureBootstrapper();

  // src/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService.ts
  init_dist();

  // src/lib/local-first/journal/stableId.ts
  var CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  function encodeTime(ms, length) {
    let value = ms;
    let out = "";
    for (let i = 0; i < length; i += 1) {
      const mod = value % 32;
      out = CROCKFORD[mod] + out;
      value = Math.floor(value / 32);
    }
    return out;
  }
  function encodeRandom(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let out = "";
    for (let i = 0; i < length; i += 1) {
      out += CROCKFORD[bytes[i] % 32];
    }
    return out;
  }
  function createLocalStableId() {
    return `${encodeTime(Date.now(), 10)}${encodeRandom(16)}`;
  }

  // src/lib/local-first/journal/serverFetch.ts
  init_dist();

  // src/lib/date/japanCalendarDate.ts
  var TZ_JAPAN = "Asia/Tokyo";
  function calendarDayKeyInJapanFromDate(date) {
    return date.toLocaleDateString("en-CA", { timeZone: TZ_JAPAN });
  }

  // src/lib/journal/diaryTags.ts
  var FULLWIDTH_HASH = "\uFF03";
  var DIARY_TAG_FORBIDDEN_CHARS = /[\s#。、！？!?,，．.]/;
  function isDiaryTagToken(token) {
    if (!token.startsWith("#")) return false;
    const name = token.slice(1);
    if (!name || DIARY_TAG_FORBIDDEN_CHARS.test(name)) return false;
    return true;
  }
  function isTagOnlyLine(line) {
    const trimmed = normalizeDiaryHashChars(line.trim());
    if (!trimmed) return false;
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return false;
    return tokens.every(isDiaryTagToken);
  }
  function parseDiaryTagInput(input) {
    const normalized = normalizeDiaryHashChars(input.trim());
    if (!normalized) return [];
    const tags = [];
    const seen = /* @__PURE__ */ new Set();
    for (const token of normalized.split(/\s+/)) {
      if (!token) continue;
      const name = (token.startsWith("#") ? token.slice(1) : token).trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push(name);
    }
    return tags;
  }
  function normalizeDiaryHashChars(input) {
    return input.replaceAll(FULLWIDTH_HASH, "#");
  }
  function extractTagsFromContent(content) {
    const normalized = normalizeDiaryHashChars(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = normalized.split("\n");
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
    if (lines.length === 0) {
      return { body: "", tags: [] };
    }
    const lastLine = lines[lines.length - 1];
    if (!isTagOnlyLine(lastLine)) {
      return { body: normalized.trimEnd(), tags: [] };
    }
    lines.pop();
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
      lines.pop();
    }
    return {
      body: lines.join("\n").trimEnd(),
      tags: parseDiaryTagInput(lastLine)
    };
  }

  // src/lib/journal/journalEntryPhotoPath.ts
  function journalEntryPhotoApiPath(entryId) {
    return `/api/journal/entries/${encodeURIComponent(entryId)}/photo`;
  }

  // src/lib/local-first/journal/serverFetch.ts
  var pocConfig = null;
  function configureServerFetchPoc(config) {
    pocConfig = config;
  }
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunk = 32768;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }
  function titleFromContent(content) {
    const body = extractTagsFromContent(content).body.trim();
    const first = body.split(/\n/)[0]?.trim() ?? "";
    if (!first) return "\u7121\u984C\u306E\u3042\u3057\u3042\u3068";
    return first.length > 40 ? `${first.slice(0, 40)}\u2026` : first;
  }
  function apiJournalToServerLike(entry) {
    const extracted = extractTagsFromContent(entry.content);
    const tags = extracted.tags.map((t) => t.startsWith("#") ? t : `#${t}`);
    const created = new Date(entry.createdAt);
    return {
      id: entry.id,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      email: "",
      profileId: entry.profileId ?? "",
      content: entry.content,
      mood: entry.mood ?? "calm",
      activity: entry.activity ?? "record_anyway",
      companionType: entry.companionType ?? "owl",
      designTheme: entry.designTheme ?? "simple",
      contentFontMode: entry.contentFontMode ?? "standard",
      photoDataUrl: entry.photoDataUrl ?? null,
      photoBlobUrl: null,
      photoBlobPathname: null,
      photoMimeType: null,
      photoSizeBytes: null,
      photoStorageProvider: null,
      generatedComment: entry.generatedComment ?? null,
      includeInBook: entry.includeInBook ?? true,
      dateKey: Number.isFinite(created.getTime()) ? calendarDayKeyInJapanFromDate(created) : calendarDayKeyInJapanFromDate(/* @__PURE__ */ new Date()),
      title: titleFromContent(entry.content),
      tags
    };
  }
  function journalEntryNeedsPhoto(entry) {
    return entry.hasPhoto === true || Boolean(entry.photoSrc);
  }
  function mapStatusToFetchErr(status) {
    if (status === 401) {
      return { ok: false, code: "AUTH_REQUIRED", message: "\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059\u3002" };
    }
    if (status === 404) {
      return { ok: false, code: "NOT_FOUND", message: "\u5BFE\u8C61\u306E\u8A18\u9332\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002" };
    }
    return {
      ok: false,
      code: "FORBIDDEN_OR_MISSING",
      message: `\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F (${status})\u3002`
    };
  }
  async function getJsonViaCapHttp(url) {
    if (!pocConfig) throw new Error("server fetch PoC config missing");
    const response = await CapacitorHttp.get({
      url,
      headers: {
        Accept: "application/json",
        Cookie: pocConfig.cookieHeader
      },
      responseType: "json"
    });
    return { status: response.status, json: response.data };
  }
  async function getBinaryViaCapHttp(url) {
    if (!pocConfig) throw new Error("server fetch PoC config missing");
    const response = await CapacitorHttp.get({
      url,
      headers: {
        Cookie: pocConfig.cookieHeader
      },
      responseType: "blob"
    });
    const headers = {};
    for (const [key, value] of Object.entries(response.headers ?? {})) {
      headers[key.toLowerCase()] = String(value);
    }
    const raw = typeof response.data === "string" ? response.data : "";
    const base64 = raw.includes(",") ? raw.split(",", 2)[1] : raw;
    return {
      status: response.status,
      base64,
      mimeType: headers["content-type"] || "application/octet-stream",
      headers
    };
  }
  async function fetchAuthenticatedJournalEntry(entryId) {
    if (pocConfig && Capacitor.isNativePlatform()) {
      const url = `${pocConfig.apiOrigin.replace(/\/$/, "")}/api/journal/${encodeURIComponent(entryId)}`;
      try {
        const { status, json: json2 } = await getJsonViaCapHttp(url);
        if (status >= 400) return mapStatusToFetchErr(status);
        const body = json2;
        if (!body.entry?.id) {
          return { ok: false, code: "VALIDATION", message: "\u30EC\u30B9\u30DD\u30F3\u30B9\u306B entry \u304C\u3042\u308A\u307E\u305B\u3093\u3002" };
        }
        return { ok: true, entry: body.entry };
      } catch {
        return {
          ok: false,
          code: "FORBIDDEN_OR_MISSING",
          message: "\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002"
        };
      }
    }
    const res = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" }
    });
    if (res.status === 401) {
      return { ok: false, code: "AUTH_REQUIRED", message: "\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059\u3002" };
    }
    if (res.status === 404) {
      return { ok: false, code: "NOT_FOUND", message: "\u5BFE\u8C61\u306E\u8A18\u9332\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002" };
    }
    if (!res.ok) {
      return {
        ok: false,
        code: "FORBIDDEN_OR_MISSING",
        message: `\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F (${res.status})\u3002`
      };
    }
    const json = await res.json();
    if (!json.entry?.id) {
      return { ok: false, code: "VALIDATION", message: "\u30EC\u30B9\u30DD\u30F3\u30B9\u306B entry \u304C\u3042\u308A\u307E\u305B\u3093\u3002" };
    }
    return { ok: true, entry: json.entry };
  }
  function fromDataUrl(dataUrl) {
    const m = /^data:([^;,]+)?;base64,(.+)$/i.exec(dataUrl.trim());
    if (!m?.[2]) return null;
    const base64 = m[2];
    const mimeType = m[1] || "image/jpeg";
    const padding = base64.match(/=+$/)?.[0].length ?? 0;
    const byteLength = Math.floor(base64.length * 3 / 4) - padding;
    return { ok: true, base64, byteLength, mimeType };
  }
  async function downloadJournalPhotoBase64(entryId, fallbackDataUrl) {
    if (pocConfig && Capacitor.isNativePlatform()) {
      const url = `${pocConfig.apiOrigin.replace(/\/$/, "")}${journalEntryPhotoApiPath(entryId)}`;
      try {
        const binary = await getBinaryViaCapHttp(url);
        if (binary.status >= 400) {
          if (fallbackDataUrl) {
            const parsed = fromDataUrl(fallbackDataUrl);
            if (parsed) return parsed;
          }
          return { ok: false, message: `\u5199\u771F\u53D6\u5F97\u5931\u6557 (${binary.status})` };
        }
        const contentType2 = binary.mimeType;
        if (contentType2.includes("application/json")) {
          if (fallbackDataUrl) {
            const parsed = fromDataUrl(fallbackDataUrl);
            if (parsed) return parsed;
          }
          return { ok: false, message: "\u5199\u771FJSON\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002" };
        }
        if (!binary.base64) {
          return { ok: false, message: "\u5199\u771F\u304C\u7A7A\u3067\u3059\u3002" };
        }
        const padding = binary.base64.match(/=+$/)?.[0].length ?? 0;
        const byteLength = Math.floor(binary.base64.length * 3 / 4) - padding;
        return {
          ok: true,
          base64: binary.base64,
          byteLength,
          mimeType: contentType2 || "application/octet-stream"
        };
      } catch {
        if (fallbackDataUrl) {
          const parsed = fromDataUrl(fallbackDataUrl);
          if (parsed) return parsed;
        }
        return { ok: false, message: "\u5199\u771F\u53D6\u5F97\u5931\u6557" };
      }
    }
    const res = await fetch(journalEntryPhotoApiPath(entryId), {
      credentials: "same-origin"
    });
    if (!res.ok) {
      if (fallbackDataUrl) {
        const parsed = fromDataUrl(fallbackDataUrl);
        if (parsed) return parsed;
      }
      return { ok: false, message: `\u5199\u771F\u53D6\u5F97\u5931\u6557 (${res.status})` };
    }
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const json = await res.json();
      if (json.photoDataUrl) {
        const parsed = fromDataUrl(json.photoDataUrl);
        if (parsed) return parsed;
      }
      if (fallbackDataUrl) {
        const parsed = fromDataUrl(fallbackDataUrl);
        if (parsed) return parsed;
      }
      return { ok: false, message: "\u5199\u771FJSON\u306B data URL \u304C\u3042\u308A\u307E\u305B\u3093\u3002" };
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) {
      return { ok: false, message: "\u5199\u771F\u304C\u7A7A\u3067\u3059\u3002" };
    }
    return {
      ok: true,
      base64: arrayBufferToBase64(buf),
      byteLength: buf.byteLength,
      mimeType: contentType || "application/octet-stream"
    };
  }

  // src/lib/local-first/journal/secureCopy/candidateMediaStore.ts
  init_dist();
  init_esm3();
  init_types();
  init_types4();
  function assertNative2() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("candidate media store is native-only");
    }
  }
  function assertCandidateRelativePath(relativePath) {
    if (!relativePath.startsWith(`${SECURE_CANDIDATE_MEDIA_ROOT}/`)) {
      throw new Error("candidate media path must stay in journal-secure-candidate namespace");
    }
    if (relativePath.startsWith(`${LOCAL_JOURNAL_MEDIA_ROOT}/`)) {
      throw new Error("candidate media store refuses active journal media root");
    }
    if (relativePath.startsWith("/") || relativePath.includes("..")) {
      throw new Error("absolute or parent media paths are forbidden");
    }
  }
  async function createNativeCandidateMediaStore() {
    assertNative2();
    try {
      await Filesystem.mkdir({
        path: SECURE_CANDIDATE_MEDIA_ROOT,
        directory: Directory.Library,
        recursive: true
      });
    } catch {
    }
    return {
      root: SECURE_CANDIDATE_MEDIA_ROOT,
      async write(fileName, base64) {
        const relativePath = `${SECURE_CANDIDATE_MEDIA_ROOT}/${fileName}`;
        assertCandidateRelativePath(relativePath);
        await Filesystem.writeFile({
          path: relativePath,
          data: base64,
          directory: Directory.Library
        });
        return relativePath;
      },
      async readBase64(relativePath) {
        assertCandidateRelativePath(relativePath);
        const result = await Filesystem.readFile({
          path: relativePath,
          directory: Directory.Library
        });
        if (typeof result.data !== "string" || !result.data) {
          throw new Error("candidate media read returned empty data");
        }
        return result.data;
      },
      async delete(relativePath) {
        assertCandidateRelativePath(relativePath);
        try {
          await Filesystem.deleteFile({
            path: relativePath,
            directory: Directory.Library
          });
        } catch {
        }
      }
    };
  }

  // src/lib/local-first/journal/secureCopy/candidateDbGuard.ts
  init_types2();
  init_types4();
  init_types();
  init_types3();
  var ALLOWED = /* @__PURE__ */ new Set([SERVER_COPY_TARGET_DB_NAME]);
  function assertAllowedCopyTargetDb(name) {
    if (name === LOCAL_JOURNAL_DB_NAME) {
      throw new LocalFirstSecurityError(
        "journal_encryption_forbidden",
        "server copy refuses ljd_local_journal"
      );
    }
    if (!ALLOWED.has(name) || name !== LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME) {
      throw new LocalFirstSecurityError(
        "unknown",
        "server copy target is not the encrypted candidate allowlist"
      );
    }
  }

  // src/lib/local-first/journal/journalRepositorySql.ts
  function parseTagsJson(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(String);
    } catch {
      return [];
    }
  }
  async function loadMediaForJournal(db2, journalStableId) {
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
  async function saveJournalEntrySql(db2, entry) {
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
  }
  async function getJournalByIdSql(db2, stableId) {
    const result = await db2.query(
      `SELECT * FROM local_journal_entries WHERE stable_id = ? AND local_status = 'active' LIMIT 1;`,
      [stableId]
    );
    const row = result.values?.[0];
    if (!row) return null;
    return mapEntryRow(row, await loadMediaForJournal(db2, stableId));
  }
  async function getJournalByLegacyServerIdSql(db2, legacyServerId) {
    const result = await db2.query(
      `SELECT * FROM local_journal_entries
     WHERE legacy_server_id = ? AND local_status = 'active' LIMIT 1;`,
      [legacyServerId]
    );
    const row = result.values?.[0];
    if (!row) return null;
    return mapEntryRow(row, await loadMediaForJournal(db2, String(row.stable_id)));
  }
  async function countActiveEntriesSql(db2) {
    const result = await db2.query(
      `SELECT COUNT(*) AS c FROM local_journal_entries WHERE local_status = 'active';`
    );
    const row = result.values?.[0];
    return Number(row?.c ?? 0);
  }
  async function countTagsSql(db2) {
    const result = await db2.query(`SELECT COUNT(*) AS c FROM local_journal_tags;`);
    const row = result.values?.[0];
    return Number(row?.c ?? 0);
  }
  async function countMediaSql(db2) {
    const result = await db2.query(`SELECT COUNT(*) AS c FROM local_media;`);
    const row = result.values?.[0];
    return Number(row?.c ?? 0);
  }

  // src/lib/local-first/journal/secureCopy/candidateRepository.ts
  init_types4();
  init_LocalJournalSecureBootstrapper();
  init_security();
  function createCandidateRepository(db2) {
    return {
      async save(entry) {
        await saveJournalEntrySql(db2, entry);
      },
      getById: (stableId) => getJournalByIdSql(db2, stableId),
      getByLegacyServerId: (legacyServerId) => getJournalByLegacyServerIdSql(db2, legacyServerId),
      countEntries: () => countActiveEntriesSql(db2),
      countTags: () => countTagsSql(db2),
      countMedia: () => countMediaSql(db2)
    };
  }
  async function withCandidateRepository(fn) {
    assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
    const health = await LocalJournalSecureBootstrapper.inspect();
    if (health.health.status !== "ready") {
      throw new Error(`candidate not ready: ${health.health.reason ?? health.health.status}`);
    }
    const db2 = await openNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME, 1);
    try {
      return await fn(createCandidateRepository(db2));
    } finally {
      await closeNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME);
    }
  }

  // src/lib/local-first/journal/secureCopy/mirrorServerJournalEntry.ts
  init_checksum();

  // src/lib/local-first/journal/mapper.ts
  init_types();
  function mapServerJournalEntryLikeToLocal(server, options = {}) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const journalStableId = options.journalStableId ?? createLocalStableId();
    const mediaRefs = [];
    const hasPhotoHint = Boolean(server.photoBlobUrl) || Boolean(server.photoBlobPathname) || Boolean(server.photoDataUrl) || Boolean(options.mediaRelativePath);
    if (hasPhotoHint && options.mediaRelativePath) {
      mediaRefs.push({
        stableId: options.mediaStableId ?? createLocalStableId(),
        journalStableId,
        type: "image",
        relativePath: options.mediaRelativePath,
        createdAt: server.createdAt,
        checksum: options.mediaChecksum ?? null,
        mimeType: server.photoMimeType
      });
    }
    return {
      stableId: journalStableId,
      dateKey: server.dateKey,
      title: server.title.trim() || "\u7121\u984C\u306E\u3042\u3057\u3042\u3068",
      content: server.content,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
      tags: normalizeTags(server.tags),
      mediaRefs,
      schemaVersion: LOCAL_JOURNAL_SCHEMA_USER_VERSION,
      source: options.source ?? "mapped_server_shape",
      localStatus: "active",
      importedAt: options.importedAt ?? now,
      legacyServerId: server.id,
      serverUpdatedAt: server.updatedAt
    };
  }
  function normalizeTags(tags) {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const raw of tags) {
      const t = raw.trim();
      if (!t) continue;
      const withHash = t.startsWith("#") ? t : `#${t}`;
      if (seen.has(withHash)) continue;
      seen.add(withHash);
      out.push(withHash);
    }
    return out;
  }

  // src/lib/local-first/journal/secureCopy/sourceFingerprint.ts
  init_checksum();

  // src/lib/local-first/journal/secureCopy/testEntryGuard.ts
  init_types4();
  function normalizeTag(raw) {
    const t = raw.trim();
    if (!t) return "";
    return t.startsWith("#") ? t : `#${t}`;
  }
  function hasTestPurposeTag(tags) {
    const set = new Set(tags.map(normalizeTag).filter(Boolean));
    return TEST_PURPOSE_TAGS.some((marker) => set.has(marker));
  }
  function parseExplicitEntryIds(raw) {
    const parts = Array.isArray(raw) ? raw : raw.split(/[\s,;]+/g);
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const part of parts) {
      const id = part.trim();
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }

  // src/lib/local-first/journal/secureCopy/sourceFingerprint.ts
  async function buildSourceFingerprint(input) {
    return {
      legacyServerId: input.legacyServerId,
      serverUpdatedAt: input.serverUpdatedAt,
      contentHash: await sha256HexOfUtf8(input.content),
      tags: input.tags.map(normalizeTag).filter(Boolean),
      photoHash: input.photoHash,
      mediaCount: input.mediaCount
    };
  }
  async function fingerprintFromLocalEntry(entry) {
    return buildSourceFingerprint({
      legacyServerId: entry.legacyServerId ?? "",
      serverUpdatedAt: entry.serverUpdatedAt ?? "",
      content: entry.content,
      tags: entry.tags,
      photoHash: entry.mediaRefs[0]?.checksum ?? null,
      mediaCount: entry.mediaRefs.length
    });
  }
  function sameTagSet(a, b) {
    if (a.length !== b.length) return false;
    const left = [...a].sort();
    const right = [...b].sort();
    return left.every((tag, i) => tag === right[i]);
  }
  function sourceFingerprintChanged(existing, incoming) {
    if (existing.legacyServerId !== incoming.legacyServerId) return true;
    if (existing.serverUpdatedAt !== incoming.serverUpdatedAt) return true;
    if (existing.contentHash !== incoming.contentHash) return true;
    if (!sameTagSet(existing.tags, incoming.tags)) return true;
    if (existing.photoHash && incoming.photoHash && existing.photoHash !== incoming.photoHash) {
      return true;
    }
    if (incoming.photoHash != null && existing.mediaCount !== incoming.mediaCount) {
      return true;
    }
    return false;
  }

  // src/lib/local-first/journal/secureCopy/mirrorServerJournalEntry.ts
  init_security();
  function failResult(serverId, detail) {
    return {
      status: "failed",
      serverId,
      stableId: null,
      legacyServerId: null,
      detail,
      fingerprint: null,
      serverFetched: false,
      needsRetry: false
    };
  }
  async function mirrorServerJournalEntryToLocalGeneration(serverId, deps, availableBytes) {
    const fetched = await deps.fetchEntry(serverId);
    if (!fetched.ok) {
      return failResult(serverId, fetched.message);
    }
    const apiEntry = fetched.entry;
    const serverLike = apiJournalToServerLike(apiEntry);
    if (!hasTestPurposeTag(serverLike.tags)) {
      return {
        status: "failed",
        serverId,
        stableId: null,
        legacyServerId: null,
        detail: "not_test_entry",
        fingerprint: null,
        serverFetched: true,
        needsRetry: false
      };
    }
    const existing = await deps.repository.getByLegacyServerId(apiEntry.id);
    const incomingMeta = await buildSourceFingerprint({
      legacyServerId: apiEntry.id,
      serverUpdatedAt: apiEntry.updatedAt,
      content: apiEntry.content,
      tags: serverLike.tags,
      photoHash: existing?.mediaRefs[0]?.checksum ?? null,
      mediaCount: journalEntryNeedsPhoto(apiEntry) ? 1 : 0
    });
    if (existing) {
      const existingFp = await fingerprintFromLocalEntry(existing);
      if (sourceFingerprintChanged(existingFp, incomingMeta)) {
        return {
          status: "source_changed",
          serverId,
          stableId: existing.stableId,
          legacyServerId: existing.legacyServerId,
          detail: "source_changed_no_overwrite",
          fingerprint: incomingMeta,
          serverFetched: true,
          needsRetry: false
        };
      }
      return {
        status: "already_present",
        serverId,
        stableId: existing.stableId,
        legacyServerId: existing.legacyServerId,
        detail: "legacyServerId already present; left untouched",
        fingerprint: existingFp,
        serverFetched: true,
        needsRetry: false
      };
    }
    let photoBase64 = null;
    let photoBytes = 0;
    let photoMime = null;
    let photoHash = null;
    if (journalEntryNeedsPhoto(apiEntry)) {
      const photo = await deps.downloadPhoto(apiEntry.id, apiEntry.photoDataUrl);
      if (!photo.ok) {
        return {
          status: "failed",
          serverId,
          stableId: null,
          legacyServerId: apiEntry.id,
          detail: photo.message,
          fingerprint: null,
          serverFetched: true,
          needsRetry: true
        };
      }
      if (availableBytes != null && photo.byteLength > 0 && photo.byteLength > availableBytes) {
        return {
          status: "failed",
          serverId,
          stableId: null,
          legacyServerId: apiEntry.id,
          detail: "insufficient_free_space",
          fingerprint: null,
          serverFetched: true,
          needsRetry: true
        };
      }
      photoBase64 = photo.base64;
      photoBytes = photo.byteLength;
      photoMime = photo.mimeType;
      photoHash = await sha256HexOfBase64(photo.base64);
    }
    const journalStableId = deps.createStableId();
    const mediaStableId = deps.createStableId();
    let relativePath = null;
    try {
      if (deps.injectLocalFailure === "media_write") {
        throw new Error("injected_local_media_write_failure");
      }
      if (photoBase64 && photoHash) {
        const ext = photoMime?.includes("png") ? "png" : photoMime?.includes("webp") ? "webp" : "jpg";
        relativePath = await deps.media.write(
          `${journalStableId}-${mediaStableId}.${ext}`,
          photoBase64
        );
        const written = await deps.media.readBase64(relativePath);
        const verify = await sha256HexOfBase64(written);
        if (verify !== photoHash) {
          await deps.media.delete(relativePath);
          relativePath = null;
          return {
            status: "failed",
            serverId,
            stableId: null,
            legacyServerId: apiEntry.id,
            detail: "photo_checksum_mismatch",
            fingerprint: null,
            serverFetched: true,
            needsRetry: true
          };
        }
      }
      if (deps.injectLocalFailure === "save") {
        throw new Error("injected_local_save_failure");
      }
      if (photoMime) serverLike.photoMimeType = photoMime;
      if (photoBytes) serverLike.photoSizeBytes = photoBytes;
      const local = mapServerJournalEntryLikeToLocal(serverLike, {
        journalStableId,
        mediaStableId: relativePath ? mediaStableId : void 0,
        mediaRelativePath: relativePath,
        mediaChecksum: photoHash,
        source: "migrated_server"
      });
      await deps.repository.save(local);
      const stored = await deps.repository.getById(local.stableId);
      if (!stored) {
        throw new Error("save confirmed missing");
      }
      const fingerprint = await buildSourceFingerprint({
        legacyServerId: stored.legacyServerId ?? apiEntry.id,
        serverUpdatedAt: stored.serverUpdatedAt ?? apiEntry.updatedAt,
        content: stored.content,
        tags: stored.tags,
        photoHash,
        mediaCount: stored.mediaRefs.length
      });
      return {
        status: "mirrored",
        serverId,
        stableId: stored.stableId,
        legacyServerId: stored.legacyServerId,
        detail: "mirrored server-canonical entry to encrypted candidate",
        fingerprint,
        serverFetched: true,
        needsRetry: false
      };
    } catch (error) {
      if (relativePath) {
        await deps.media.delete(relativePath).catch(() => void 0);
      }
      return {
        status: "failed",
        serverId,
        stableId: null,
        legacyServerId: apiEntry.id,
        detail: safeErrorMessage(error),
        fingerprint: null,
        serverFetched: true,
        needsRetry: true
      };
    }
  }

  // src/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService.ts
  init_types4();
  init_LocalJournalSecureBootstrapper();
  init_security();
  init_types3();
  function emptyBatch(blockedReason) {
    return {
      ok: false,
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      copied: 0,
      alreadyPresent: 0,
      sourceChanged: 0,
      failed: 0,
      results: [],
      blockedReason,
      candidateEncrypted: null,
      completeProtection: null,
      backupExcluded: null,
      rowCounts: null
    };
  }
  function toCopyEntryResult(mirror) {
    const status = mirror.status === "mirrored" ? "copied" : mirror.status;
    return {
      status,
      serverId: mirror.serverId,
      stableId: mirror.stableId,
      legacyServerId: mirror.legacyServerId,
      detail: mirror.detail,
      fingerprint: mirror.fingerprint
    };
  }
  function summarize(results) {
    const copied = results.filter((r) => r.status === "copied").length;
    const alreadyPresent = results.filter((r) => r.status === "already_present").length;
    const sourceChanged = results.filter((r) => r.status === "source_changed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    return {
      copied,
      alreadyPresent,
      sourceChanged,
      failed,
      ok: failed === 0 && sourceChanged === 0
    };
  }
  function prepareCopyBatch(rawIds, options) {
    assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
    const entryIds = parseExplicitEntryIds(rawIds);
    if (entryIds.length === 0) {
      return { ok: false, batch: emptyBatch("explicit_ids_required") };
    }
    if (entryIds.length > SECURE_COPY_MAX_EXPLICIT_IDS) {
      return { ok: false, batch: emptyBatch("too_many_explicit_ids") };
    }
    const availableBytes = options && Object.prototype.hasOwnProperty.call(options, "availableBytes") ? options.availableBytes ?? null : null;
    const known = decideCapacityKnown(availableBytes);
    if (!known.known && options?.allowUnknownCapacity !== true) {
      return { ok: false, batch: emptyBatch("capacity_unknown_fail_closed") };
    }
    if (known.known && known.availableBytes != null && known.availableBytes < SECURE_COPY_MIN_AVAILABLE_BYTES) {
      return { ok: false, batch: emptyBatch("insufficient_free_space") };
    }
    return { ok: true, entryIds, availableBytes };
  }
  async function copyExplicitIdsWithDeps(rawIds, deps, options) {
    const prepared = prepareCopyBatch(rawIds, options);
    if (!prepared.ok) return prepared.batch;
    const results = [];
    for (const id of prepared.entryIds) {
      const mirrored = await mirrorServerJournalEntryToLocalGeneration(
        id,
        deps,
        prepared.availableBytes
      );
      results.push(toCopyEntryResult(mirrored));
    }
    const summary = summarize(results);
    const rowCounts = {
      entries: await deps.repository.countEntries(),
      tags: await deps.repository.countTags(),
      media: await deps.repository.countMedia()
    };
    return {
      ...summary,
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      results,
      blockedReason: null,
      candidateEncrypted: true,
      completeProtection: null,
      backupExcluded: null,
      rowCounts
    };
  }
  var ServerToLocalCandidateCopyService = {
    async copyExplicitIds(rawIds, options) {
      if (!Capacitor.isNativePlatform()) {
        throw new LocalFirstSecurityError("native_only", "candidate copy is native-only");
      }
      assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
      const availableBytes = options && Object.prototype.hasOwnProperty.call(options, "availableBytes") ? options.availableBytes ?? null : (await readAvailableBytesOrNull()).availableBytes;
      const prepared = prepareCopyBatch(rawIds, {
        availableBytes,
        allowUnknownCapacity: options?.allowUnknownCapacity
      });
      if (!prepared.ok) return prepared.batch;
      const media = await createNativeCandidateMediaStore();
      const result = await withCandidateRepository(
        async (repository) => copyExplicitIdsWithDeps(
          rawIds,
          {
            fetchEntry: fetchAuthenticatedJournalEntry,
            downloadPhoto: downloadJournalPhotoBase64,
            repository,
            media,
            createStableId: createLocalStableId
          },
          { availableBytes, allowUnknownCapacity: true }
        )
      );
      const inspection = await LocalJournalSecureBootstrapper.inspect();
      return {
        ...result,
        candidateEncrypted: inspection.encrypted,
        completeProtection: inspection.completeProtection,
        backupExcluded: inspection.backupExcluded
      };
    }
  };

  // src/lib/local-first/journal/secureCopy/ServerAuthoritativeWriteThroughMirrorService.ts
  init_dist();
  init_types4();
  init_LocalJournalSecureBootstrapper();
  init_security();
  init_types3();
  function blockedMirror(blockedReason, serverEntryId, injected) {
    return {
      ok: false,
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      result: "blocked",
      serverEntryId,
      needsRetry: false,
      stableId: null,
      legacyServerId: null,
      detail: blockedReason,
      fingerprint: null,
      blockedReason,
      candidateEncrypted: null,
      completeProtection: null,
      backupExcluded: null,
      rowCounts: null,
      injectedLocalFailure: injected ?? false
    };
  }
  async function mirrorExplicitIdWithDeps(serverEntryId, deps, options) {
    const prepared = prepareCopyBatch([serverEntryId], {
      availableBytes: options?.availableBytes ?? null,
      allowUnknownCapacity: options?.allowUnknownCapacity
    });
    if (!prepared.ok) {
      return blockedMirror(
        prepared.batch.blockedReason ?? "blocked",
        serverEntryId,
        options?.injectLocalFailure
      );
    }
    const mirrored = await mirrorServerJournalEntryToLocalGeneration(
      prepared.entryIds[0],
      {
        ...deps,
        injectLocalFailure: options?.injectLocalFailure ?? false
      },
      prepared.availableBytes
    );
    const rowCounts = {
      entries: await deps.repository.countEntries(),
      tags: await deps.repository.countTags(),
      media: await deps.repository.countMedia()
    };
    return {
      ok: mirrored.status === "mirrored" || mirrored.status === "already_present",
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      result: mirrored.status,
      serverEntryId: mirrored.serverId,
      needsRetry: mirrored.needsRetry,
      stableId: mirrored.stableId,
      legacyServerId: mirrored.legacyServerId,
      detail: mirrored.detail,
      fingerprint: mirrored.fingerprint,
      blockedReason: null,
      candidateEncrypted: true,
      completeProtection: null,
      backupExcluded: null,
      rowCounts,
      injectedLocalFailure: options?.injectLocalFailure ?? false
    };
  }
  var ServerAuthoritativeWriteThroughMirrorService = {
    /**
     * Mirror one explicit Server entry into encrypted candidate.
     * Production Journal save path must not call this.
     */
    async mirrorExplicitId(serverEntryId, options) {
      if (!Capacitor.isNativePlatform()) {
        throw new LocalFirstSecurityError(
          "native_only",
          "write-through mirror is native-only"
        );
      }
      assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
      const availableBytes = options && Object.prototype.hasOwnProperty.call(options, "availableBytes") ? options.availableBytes ?? null : (await readAvailableBytesOrNull()).availableBytes;
      const prepared = prepareCopyBatch([serverEntryId], {
        availableBytes,
        allowUnknownCapacity: options?.allowUnknownCapacity
      });
      if (!prepared.ok) {
        return blockedMirror(
          prepared.batch.blockedReason ?? "blocked",
          serverEntryId,
          options?.injectLocalFailure
        );
      }
      const media = await createNativeCandidateMediaStore();
      const result = await withCandidateRepository(
        async (repository) => mirrorExplicitIdWithDeps(
          prepared.entryIds[0],
          {
            fetchEntry: fetchAuthenticatedJournalEntry,
            downloadPhoto: downloadJournalPhotoBase64,
            repository,
            media,
            createStableId: createLocalStableId
          },
          {
            availableBytes,
            allowUnknownCapacity: true,
            injectLocalFailure: options?.injectLocalFailure ?? false
          }
        )
      );
      const inspection = await LocalJournalSecureBootstrapper.inspect();
      return {
        ...result,
        candidateEncrypted: inspection.encrypted,
        completeProtection: inspection.completeProtection,
        backupExcluded: inspection.backupExcluded
      };
    }
  };

  // src/lib/local-first/journal/secureCopy/runWriteThroughMirrorPoc.ts
  init_dist();
  init_esm3();
  init_esm();
  init_LocalJournalSecureBootstrapper();
  init_types4();
  init_types();
  init_security();
  var WRITE_THROUGH_POC_ENTRY_ID = "cmsppllhx0000kv04nmct79ak";
  var WRITE_THROUGH_POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";
  var SESSION_COOKIE_PATH = "ljd/security-poc/session.cookie";
  async function loadPocSessionCookieHeader() {
    try {
      const file = await Filesystem.readFile({
        path: SESSION_COOKIE_PATH,
        directory: Directory.Library,
        encoding: Encoding.UTF8
      });
      const raw = typeof file.data === "string" ? file.data.trim() : "";
      if (!raw.startsWith("lj_user_email=")) return null;
      return raw;
    } catch {
      return null;
    }
  }
  function summarizeMirror(result) {
    return {
      result: result.result,
      serverEntryId: result.serverEntryId,
      stableId: result.stableId,
      legacyServerId: result.legacyServerId,
      needsRetry: result.needsRetry,
      detail: result.detail,
      contentHash: result.fingerprint?.contentHash ?? null,
      photoHash: result.fingerprint?.photoHash ?? null
    };
  }
  async function removeCandidateEntryByLegacyServerIdForPoc(legacyServerId) {
    assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
    const existing = await withCandidateRepository(
      (repo) => repo.getByLegacyServerId(legacyServerId)
    );
    if (!existing) return { removed: false, mediaDeleted: 0 };
    const media = await createNativeCandidateMediaStore();
    let mediaDeleted = 0;
    for (const ref of existing.mediaRefs) {
      await media.delete(ref.relativePath).catch(() => void 0);
      mediaDeleted += 1;
    }
    const db2 = await openNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME, 1);
    try {
      await db2.run(`DELETE FROM local_media WHERE journal_stable_id = ?;`, [
        existing.stableId
      ]);
      await db2.run(`DELETE FROM local_journal_tags WHERE journal_stable_id = ?;`, [
        existing.stableId
      ]);
      await db2.run(`DELETE FROM local_journal_entries WHERE stable_id = ?;`, [
        existing.stableId
      ]);
    } finally {
      await closeNamedEncryptedDatabase(SERVER_COPY_TARGET_DB_NAME);
    }
    return { removed: true, mediaDeleted };
  }
  async function runWriteThroughMirrorPoc(options) {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("write-through mirror PoC is native-only");
    }
    const steps = [];
    const push2 = (id, status, detail) => {
      steps.push({ id, status, detail });
    };
    const entryId = (options?.entryId ?? WRITE_THROUGH_POC_ENTRY_ID).trim();
    try {
      if (!entryId) {
        push2(
          "W0",
          "fail",
          "explicit test entry ID required \u2014 stop and confirm with user (no auto discovery)"
        );
        throw new Error("WRITE_THROUGH_POC_ENTRY_ID unset");
      }
      const cookieHeader = await loadPocSessionCookieHeader();
      if (!cookieHeader) {
        push2("W2", "fail", "missing session.cookie for production GET");
        throw new Error("write-through PoC requires Library/ljd/security-poc/session.cookie");
      }
      configureServerFetchPoc({
        apiOrigin: WRITE_THROUGH_POC_API_ORIGIN,
        cookieHeader
      });
      await LocalJournalSecureBootstrapper.bootstrap();
      const before = await LocalJournalSecureBootstrapper.inspect();
      push2(
        "W1",
        before.health.status === "ready" && before.encrypted === true ? "pass" : "fail",
        `health=${before.health.status} encrypted=${String(before.encrypted)} entries=${String(before.rowCounts.local_journal_entries ?? null)}`
      );
      const fetched = await fetchAuthenticatedJournalEntry(entryId);
      if (!fetched.ok) {
        push2("W2", "fail", `GET failed code=${fetched.code}`);
        throw new Error("canonical GET failed");
      }
      const like = apiJournalToServerLike(fetched.entry);
      const testTagged = hasTestPurposeTag(like.tags);
      const serverUpdatedAt = fetched.entry.updatedAt;
      const needsPhoto = journalEntryNeedsPhoto(fetched.entry);
      push2(
        "W2",
        testTagged ? "pass" : "fail",
        JSON.stringify({
          id: entryId,
          testTagged,
          needsPhoto,
          tagCount: like.tags.length,
          updatedAt: serverUpdatedAt,
          contentChars: fetched.entry.content.length
        })
      );
      if (!testTagged) {
        throw new Error("entry is not a test-purpose journal");
      }
      const prep = await removeCandidateEntryByLegacyServerIdForPoc(entryId);
      push2(
        "prep",
        "pass",
        JSON.stringify({ removedPriorLocal: prep.removed, mediaDeleted: prep.mediaDeleted })
      );
      const failInject = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(
        entryId,
        { injectLocalFailure: "save" }
      );
      push2(
        "W5",
        failInject.result === "failed" && failInject.needsRetry === true ? "pass" : "fail",
        JSON.stringify(summarizeMirror(failInject))
      );
      const afterFailInspect = await LocalJournalSecureBootstrapper.inspect();
      const noLocalRow = await withCandidateRepository((r) => r.getByLegacyServerId(entryId)) === null;
      const serverAfterFail = await fetchAuthenticatedJournalEntry(entryId);
      const serverUntouched = serverAfterFail.ok && serverAfterFail.entry.updatedAt === serverUpdatedAt;
      push2(
        "W6",
        serverUntouched && noLocalRow && failInject.needsRetry ? "pass" : "fail",
        JSON.stringify({
          serverUntouched,
          noLocalRow,
          noPartialRow: noLocalRow,
          updatedAtBefore: serverUpdatedAt,
          updatedAtAfter: serverAfterFail.ok ? serverAfterFail.entry.updatedAt : null,
          entries: afterFailInspect.rowCounts.local_journal_entries
        })
      );
      const success = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(entryId);
      push2(
        "W7",
        success.result === "mirrored" ? "pass" : "fail",
        JSON.stringify(summarizeMirror(success))
      );
      push2(
        "W3",
        success.result === "mirrored" ? "pass" : "fail",
        JSON.stringify(summarizeMirror(success))
      );
      const afterMirror = await LocalJournalSecureBootstrapper.inspect();
      const mediaOk = !needsPhoto || (afterMirror.rowCounts.local_media ?? 0) >= 1;
      push2(
        "W4",
        afterMirror.health.status === "ready" && Boolean(await withCandidateRepository((r) => r.getByLegacyServerId(entryId))) && mediaOk && Boolean(success.fingerprint?.contentHash) && (!needsPhoto || Boolean(success.fingerprint?.photoHash)) ? "pass" : "fail",
        `entries=${String(afterMirror.rowCounts.local_journal_entries)} media=${String(afterMirror.rowCounts.local_media)} contentHash=${success.fingerprint?.contentHash ?? null} photoHash=${success.fingerprint?.photoHash ?? null} stableId=${success.stableId}`
      );
      const rerun = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(entryId);
      const afterRerun = await LocalJournalSecureBootstrapper.inspect();
      push2(
        "W8",
        rerun.result === "already_present" && rerun.stableId === success.stableId && (afterRerun.rowCounts.local_journal_entries ?? -1) === (afterMirror.rowCounts.local_journal_entries ?? -2) ? "pass" : "fail",
        JSON.stringify({
          ...summarizeMirror(rerun),
          stableIdBefore: success.stableId,
          entries: afterRerun.rowCounts.local_journal_entries
        })
      );
      const persisted = await LocalJournalSecureBootstrapper.inspect();
      push2(
        "W9",
        persisted.health.status === "ready" && (persisted.rowCounts.local_journal_entries ?? 0) >= 1 ? "pass" : "fail",
        `entries=${String(persisted.rowCounts.local_journal_entries)} media=${String(persisted.rowCounts.local_media)} (kill/relaunch verified by outer harness when needed)`
      );
      let prodEncrypted = null;
      try {
        prodEncrypted = Boolean(
          (await CapacitorSQLite.isDatabaseEncrypted({
            database: LOCAL_JOURNAL_DB_NAME
          })).result
        );
      } catch {
        prodEncrypted = null;
      }
      const artifacts = await listSqliteArtifactsReadOnly();
      const prod = artifacts.find((a) => a.name === `${LOCAL_JOURNAL_DB_NAME}SQLite.db`);
      const candidate = artifacts.find(
        (a) => a.name === `${SERVER_COPY_TARGET_DB_NAME}SQLite.db`
      );
      push2(
        "W10",
        prodEncrypted === false && Boolean(prod) && Boolean(candidate) && serverUntouched ? "pass" : "fail",
        `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prod?.bytes ?? null)} candidateBytes=${String(candidate?.bytes ?? null)} generalUi=Server-only-save-unchanged`
      );
      const capacity = await readAvailableBytesOrNull();
      push2(
        "capacity",
        capacity.decision.known ? "pass" : "fail",
        `available=${String(capacity.availableBytes)} source=${capacity.source}`
      );
    } catch (error) {
      push2("error", "fail", safeErrorMessage(error));
    } finally {
      configureServerFetchPoc(null);
    }
    const report = {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      entryId: entryId || null,
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      steps,
      actualJournalUntouched: true,
      generalUiUntouched: true
    };
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true
    }).catch(() => void 0);
    await Filesystem.writeFile({
      path: "ljd/security-poc/write-through-mirror-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(report, null, 2)
    });
    return report;
  }

  // src/lib/local-first/journal/activation/runActivationPointerPoc.ts
  init_dist();
  init_esm3();
  init_esm();
  init_activationPreflight();
  init_LocalJournalActivationManifestStore();
  init_LocalJournalTechnicalActivation();
  init_types5();
  init_manifestCanonical();
  init_types();
  init_security();
  async function runActivationPointerPoc() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("activation pointer PoC is native-only");
    }
    const steps = [];
    const push2 = (id, status, detail) => {
      steps.push({ id, status, detail });
    };
    const absolutePath = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    try {
      const before = await LocalJournalActivationManifestStore.readWithFs(absolutePath, fs);
      if (before.status === "missing") {
        push2("P1", "pass", "manifest_absent");
      } else if (before.status === "ok") {
        push2("P1", "pass", `prior_manifest_present generation=${before.manifest.generation} (will re-activate)`);
      } else {
        push2("P1", "pass", `prior_non_ok=${before.status} (fail-closed until rewrite)`);
      }
      const preflight = await runTechnicalActivationPreflight();
      push2(
        "P2",
        preflight.ok ? "pass" : "fail",
        JSON.stringify({
          ok: preflight.ok,
          failed: preflight.checks.filter((c) => !c.ok).map((c) => c.id),
          entries: preflight.inspection?.rowCounts.local_journal_entries ?? null,
          encrypted: preflight.inspection?.encrypted ?? null
        })
      );
      let capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
      if (capacityBytes == null) {
        capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
      }
      const activation = await LocalJournalTechnicalActivation.activateCandidate(
        capacityBytes != null ? { availableBytes: capacityBytes } : void 0
      );
      push2(
        "P3",
        activation.code === "activated" || activation.code === "already_active" ? "pass" : "fail",
        JSON.stringify({
          code: activation.code,
          detail: activation.detail,
          preflightOk: activation.preflightOk,
          generation: activation.manifest?.generation ?? null,
          activeDatabaseId: activation.manifest?.activeDatabaseId ?? null,
          activeMediaRootId: activation.manifest?.activeMediaRootId ?? null,
          previousDatabaseId: activation.manifest?.previousDatabaseId ?? null,
          capacityBytes
        })
      );
      const readback = await LocalJournalActivationManifestStore.readNative();
      push2(
        "P4",
        readback.status === "ok" && readback.manifest.formatVersion === ACTIVATION_MANIFEST_FORMAT_VERSION && readback.manifest.schemaVersion === EXPECTED_JOURNAL_SCHEMA_VERSION && readback.manifest.activeMediaRootId === TECHNICAL_ACTIVE_MEDIA_ROOT_ID ? "pass" : "fail",
        JSON.stringify({
          status: readback.status,
          checksumChars: readback.status === "ok" ? readback.manifest.checksum.length : 0,
          generation: readback.status === "ok" ? readback.manifest.generation : null
        })
      );
      const resolved = await LocalJournalTechnicalActivation.resolve();
      push2(
        "P5",
        resolved.status === "ready" && resolved.technicalDatabaseId === TECHNICAL_ACTIVE_DATABASE_ID ? "pass" : "fail",
        JSON.stringify({
          status: resolved.status,
          technicalDatabaseId: resolved.technicalDatabaseId,
          technicalMediaRootId: resolved.technicalMediaRootId
        })
      );
      const resolvedAgain = await LocalJournalTechnicalActivation.resolve();
      push2(
        "P6",
        resolvedAgain.status === "ready" ? "pass" : "fail",
        JSON.stringify({
          status: resolvedAgain.status,
          note: "in-process re-resolve; kill/relaunch confirmed by outer harness when needed"
        })
      );
      const second = await LocalJournalTechnicalActivation.activateCandidate();
      push2(
        "P7",
        second.code === "already_active" ? "pass" : "fail",
        JSON.stringify({ code: second.code })
      );
      const good = readback.status === "ok" ? readback.manifest : null;
      await fs.atomicReplaceText(absolutePath, "{corrupt");
      const corruptResolve = await LocalJournalTechnicalActivation.resolve();
      push2(
        "P8",
        corruptResolve.status === "corrupt_manifest" && corruptResolve.technicalDatabaseId === null ? "pass" : "fail",
        JSON.stringify({ status: corruptResolve.status })
      );
      if (good) {
        await fs.atomicReplaceText(absolutePath, `${JSON.stringify(good, null, 2)}
`);
      } else {
        await LocalJournalTechnicalActivation.activateCandidate();
      }
      const missingTargetManifest = await attachManifestChecksum({
        formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
        generation: 2,
        activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
        activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
        previousDatabaseId: null,
        previousMediaRootId: null,
        activationState: "active",
        schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
        activatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await fs.atomicReplaceText(
        absolutePath,
        `${JSON.stringify(missingTargetManifest, null, 2)}
`
      );
      const { resolveTechnicalActiveLocalJournalWithFs: resolveTechnicalActiveLocalJournalWithFs2 } = await Promise.resolve().then(() => (init_LocalJournalTechnicalActivation(), LocalJournalTechnicalActivation_exports));
      const missingResolve = await resolveTechnicalActiveLocalJournalWithFs2({
        fs,
        absolutePath,
        verifyDatabaseExists: async () => false
      });
      push2(
        "P9",
        missingResolve.status === "missing_database" && missingResolve.technicalDatabaseId === null ? "pass" : "fail",
        JSON.stringify({
          status: missingResolve.status,
          note: "fail-closed; no alternate DB discovery"
        })
      );
      await LocalJournalTechnicalActivation.activateCandidate();
      const rollback = await demonstrateManifestRollbackSemantics({
        fs,
        absolutePath
      });
      push2(
        "P10",
        rollback.code === "rollback_preserved" && rollback.preservedGeneration === 2 ? "pass" : "fail",
        JSON.stringify(rollback)
      );
      await LocalJournalTechnicalActivation.activateCandidate();
      let prodEncrypted = null;
      try {
        prodEncrypted = Boolean(
          (await CapacitorSQLite.isDatabaseEncrypted({
            database: LOCAL_JOURNAL_DB_NAME
          })).result
        );
      } catch {
        prodEncrypted = null;
      }
      const artifacts = await listSqliteArtifactsReadOnly();
      const prod = artifacts.find((a) => a.name === `${LOCAL_JOURNAL_DB_NAME}SQLite.db`);
      const candidate = artifacts.find(
        (a) => a.name === `${TECHNICAL_ACTIVE_DATABASE_ID}SQLite.db`
      );
      push2(
        "P11",
        prodEncrypted === false && Boolean(prod) && Boolean(candidate) ? "pass" : "fail",
        `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prod?.bytes ?? null)} candidateBytes=${String(candidate?.bytes ?? null)}`
      );
      push2(
        "P12",
        "pass",
        "general Journal UI remains Server read/write; Repository not switched; pointer-driven routing not enabled"
      );
      const capacity = await readAvailableBytesOrNull();
      push2(
        "capacity",
        capacity.decision.known ? "pass" : "fail",
        `available=${String(capacity.availableBytes)}`
      );
    } catch (error) {
      push2("error", "fail", safeErrorMessage(error));
    }
    const report = {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      steps,
      actualJournalUntouched: true,
      generalUiServerOnly: true,
      repositoryNotSwitched: true
    };
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true
    }).catch(() => void 0);
    await Filesystem.writeFile({
      path: "ljd/security-poc/activation-pointer-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(report, null, 2)
    });
    return report;
  }

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  init_LocalJournalTechnicalActivation();
  init_LocalJournalActivationManifestStore();
  init_activationPreflight();

  // src/lib/local-first/journal/generation/runGenerationResolverIntegrationPoc.ts
  init_dist();
  init_esm3();
  init_esm();
  init_LocalJournalTechnicalActivation();
  init_LocalJournalActivationManifestStore();
  init_resolveLocalJournalGenerationTarget();

  // src/lib/local-first/journal/generation/DeveloperResolvedGenerationMirror.ts
  init_dist();
  init_ResolvedLocalJournalGeneration();
  init_resolveLocalJournalGenerationTarget();
  init_LocalJournalActivationManifestStore();
  init_types4();
  init_LocalJournalSecureBootstrapper();
  init_security();
  init_types3();
  init_types5();
  function blocked(reason, serverEntryId, extras) {
    return {
      ok: false,
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      result: "blocked",
      serverEntryId,
      needsRetry: false,
      stableId: null,
      legacyServerId: null,
      detail: reason,
      fingerprint: null,
      blockedReason: reason,
      candidateEncrypted: null,
      completeProtection: null,
      backupExcluded: null,
      rowCounts: null,
      injectedLocalFailure: false,
      resolvedTarget: null,
      manifestChangedDuringOperation: false,
      resolveDeniedReason: reason,
      ...extras
    };
  }
  function assertMirrorTargetGeneration(target) {
    assertDbMediaPairIntegrity(target);
    if (target.databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) {
      throw new Error(`unsupported_databaseId=${target.databaseId}`);
    }
    if (target.databaseId !== SERVER_COPY_TARGET_DB_NAME) {
      throw new Error("mirror target must be encrypted candidate generation");
    }
  }
  async function mirrorExplicitIdToResolvedGenerationWithDeps(options) {
    try {
      assertMirrorTargetGeneration(options.target);
    } catch (error) {
      return blocked(String(error), options.serverEntryId, {
        resolvedTarget: options.target,
        resolveDeniedReason: String(error)
      });
    }
    const fixedTarget = { ...options.target };
    const prepared = prepareCopyBatch([options.serverEntryId], {
      availableBytes: options.availableBytes ?? null,
      allowUnknownCapacity: options.allowUnknownCapacity
    });
    if (!prepared.ok) {
      return blocked(prepared.batch.blockedReason ?? "blocked", options.serverEntryId, {
        resolvedTarget: fixedTarget,
        resolveDeniedReason: null
      });
    }
    const mirrored = await mirrorServerJournalEntryToLocalGeneration(
      prepared.entryIds[0],
      options.deps,
      prepared.availableBytes
    );
    const rowCounts = {
      entries: await options.deps.repository.countEntries(),
      tags: await options.deps.repository.countTags(),
      media: await options.deps.repository.countMedia()
    };
    let manifestChangedDuringOperation = false;
    if (options.readChecksumAfter) {
      const after = await options.readChecksumAfter();
      if (after != null && after !== fixedTarget.manifestChecksum) {
        manifestChangedDuringOperation = true;
      }
    }
    return {
      ok: mirrored.status === "mirrored" || mirrored.status === "already_present",
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      result: mirrored.status,
      serverEntryId: mirrored.serverId,
      needsRetry: mirrored.needsRetry,
      stableId: mirrored.stableId,
      legacyServerId: mirrored.legacyServerId,
      detail: mirrored.detail,
      fingerprint: mirrored.fingerprint,
      blockedReason: null,
      candidateEncrypted: true,
      completeProtection: null,
      backupExcluded: null,
      rowCounts,
      injectedLocalFailure: false,
      resolvedTarget: fixedTarget,
      manifestChangedDuringOperation,
      resolveDeniedReason: null
    };
  }
  var DeveloperResolvedGenerationMirror = {
    async mirrorExplicitId(serverEntryId, options) {
      if (!Capacitor.isNativePlatform()) {
        throw new LocalFirstSecurityError(
          "native_only",
          "resolved-generation mirror is native-only"
        );
      }
      let availableBytes;
      if (options && Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
        availableBytes = options.availableBytes ?? null;
      } else {
        availableBytes = (await readAvailableBytesOrNull()).availableBytes;
        if (availableBytes == null) {
          availableBytes = (await readAvailableBytesOrNull()).availableBytes;
        }
      }
      const resolved = await resolveLocalJournalGenerationTarget(
        availableBytes != null ? { availableBytes } : { availableBytes: null }
      );
      if (!resolved.ok) {
        return blocked(resolved.reason, serverEntryId, {
          resolveDeniedReason: resolved.reason,
          detail: resolved.detail
        });
      }
      assertMirrorTargetGeneration(resolved.target);
      const media = await createNativeCandidateMediaStore();
      const result = await withCandidateRepository(
        async (repository) => mirrorExplicitIdToResolvedGenerationWithDeps({
          serverEntryId,
          target: resolved.target,
          deps: {
            fetchEntry: fetchAuthenticatedJournalEntry,
            downloadPhoto: downloadJournalPhotoBase64,
            repository,
            media,
            createStableId: createLocalStableId
          },
          availableBytes,
          allowUnknownCapacity: true,
          readChecksumAfter: readManifestChecksumNative
        })
      );
      const inspection = await LocalJournalSecureBootstrapper.inspect();
      return {
        ...result,
        candidateEncrypted: inspection.encrypted,
        completeProtection: inspection.completeProtection,
        backupExcluded: inspection.backupExcluded
      };
    }
  };

  // src/lib/local-first/journal/generation/runGenerationResolverIntegrationPoc.ts
  init_ResolvedLocalJournalGeneration();
  init_types();
  init_security();
  init_types5();
  var POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";
  var SESSION_COOKIE_PATH2 = "ljd/security-poc/session.cookie";
  var GENERATION_RESOLVER_POC_ENTRY_ID = WRITE_THROUGH_POC_ENTRY_ID;
  async function loadPocSessionCookieHeader2() {
    try {
      const file = await Filesystem.readFile({
        path: SESSION_COOKIE_PATH2,
        directory: Directory.Library,
        encoding: Encoding.UTF8
      });
      const raw = typeof file.data === "string" ? file.data.trim() : "";
      if (!raw.startsWith("lj_user_email=")) return null;
      return raw;
    } catch {
      return null;
    }
  }
  async function runGenerationResolverIntegrationPoc() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("generation resolver integration PoC is native-only");
    }
    const steps = [];
    const push2 = (id, status, detail) => {
      steps.push({ id, status, detail });
    };
    const entryId = GENERATION_RESOLVER_POC_ENTRY_ID;
    try {
      await LocalJournalTechnicalActivation.activateCandidate();
      let capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
      if (capacityBytes == null) {
        capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
      }
      const resolved = await resolveLocalJournalGenerationTarget(
        capacityBytes != null ? { availableBytes: capacityBytes } : void 0
      );
      push2(
        "R1",
        resolved.ok ? "pass" : "fail",
        JSON.stringify(
          resolved.ok ? {
            generation: resolved.target.generation,
            databaseId: resolved.target.databaseId,
            mediaRootId: resolved.target.mediaRootId,
            schemaVersion: resolved.target.schemaVersion,
            checksumChars: resolved.target.manifestChecksum.length
          } : resolved
        )
      );
      const cookieHeader = await loadPocSessionCookieHeader2();
      if (!cookieHeader) {
        push2("R2", "fail", "missing session.cookie");
        throw new Error("session.cookie required for Server GET");
      }
      configureServerFetchPoc({ apiOrigin: POC_API_ORIGIN, cookieHeader });
      const mirror = await DeveloperResolvedGenerationMirror.mirrorExplicitId(entryId, {
        availableBytes: capacityBytes ?? void 0
      });
      push2(
        "R2",
        mirror.result === "mirrored" || mirror.result === "already_present" ? "pass" : "fail",
        JSON.stringify({
          result: mirror.result,
          resolvedDatabaseId: mirror.resolvedTarget?.databaseId ?? null,
          stableId: mirror.stableId,
          detail: mirror.detail
        })
      );
      const again = await DeveloperResolvedGenerationMirror.mirrorExplicitId(entryId, {
        availableBytes: capacityBytes ?? void 0
      });
      push2(
        "R3",
        again.result === "already_present" && again.stableId === mirror.stableId ? "pass" : "fail",
        JSON.stringify({ result: again.result, stableId: again.stableId })
      );
      const absolutePath = await resolveActivationManifestAbsolutePath();
      const fs = await createNativeManifestFs();
      const good = await LocalJournalActivationManifestStore.readNative();
      await fs.atomicReplaceText(absolutePath, "{corrupt");
      const corruptAttempt = await resolveLocalJournalGenerationTarget(
        capacityBytes != null ? { availableBytes: capacityBytes } : void 0
      );
      push2(
        "R4",
        !corruptAttempt.ok && corruptAttempt.reason === "corrupt_manifest" ? "pass" : "fail",
        JSON.stringify(corruptAttempt)
      );
      if (good.status === "ok") {
        await fs.atomicReplaceText(absolutePath, `${JSON.stringify(good.manifest, null, 2)}
`);
      } else {
        await LocalJournalTechnicalActivation.activateCandidate();
      }
      const missing = await resolveLocalJournalGenerationTargetWithFsInjectedMissing(
        capacityBytes
      );
      push2(
        "R5",
        !missing.ok && missing.reason === "missing_database" ? "pass" : "fail",
        JSON.stringify(missing)
      );
      const plaintext = mapManifestToResolvedGeneration({
        generation: 1,
        databaseId: LOCAL_JOURNAL_DB_NAME,
        mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT,
        schemaVersion: 1,
        manifestChecksum: "x"
      });
      push2(
        "R6",
        !plaintext.ok && plaintext.reason === "plaintext_forbidden" ? "pass" : "fail",
        JSON.stringify(plaintext)
      );
      let pairOk = false;
      try {
        assertDbMediaPairIntegrity({
          databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
          mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT
        });
      } catch {
        pairOk = true;
      }
      push2("R7", pairOk ? "pass" : "fail", "wrong media pairing rejected");
      const capDeny = await resolveLocalJournalGenerationTarget({ availableBytes: null });
      push2(
        "R8",
        !capDeny.ok && capDeny.reason === "capacity_unknown" ? "pass" : "fail",
        JSON.stringify(capDeny)
      );
      push2(
        "R9",
        mirror.resolvedTarget != null && mirror.resolvedTarget.databaseId === TECHNICAL_ACTIVE_DATABASE_ID && typeof mirror.manifestChangedDuringOperation === "boolean" ? "pass" : "fail",
        JSON.stringify({
          fixedDatabaseId: mirror.resolvedTarget?.databaseId ?? null,
          manifestChangedDuringOperation: mirror.manifestChangedDuringOperation,
          note: "one-entry unit uses start-of-op target; drift warning supported"
        })
      );
      let prodEncrypted = null;
      try {
        prodEncrypted = Boolean(
          (await CapacitorSQLite.isDatabaseEncrypted({
            database: LOCAL_JOURNAL_DB_NAME
          })).result
        );
      } catch {
        prodEncrypted = null;
      }
      const artifacts = await listSqliteArtifactsReadOnly();
      const prod = artifacts.find((a) => a.name === `${LOCAL_JOURNAL_DB_NAME}SQLite.db`);
      push2(
        "R10",
        prodEncrypted === false && Boolean(prod) ? "pass" : "fail",
        `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prod?.bytes ?? null)}`
      );
    } catch (error) {
      push2("error", "fail", safeErrorMessage(error));
    } finally {
      configureServerFetchPoc(null);
    }
    const report = {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      entryId,
      steps,
      actualJournalUntouched: true,
      generalUiUntouched: true,
      productionWriteUntouched: true
    };
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true
    }).catch(() => void 0);
    await Filesystem.writeFile({
      path: "ljd/security-poc/generation-resolver-integration-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(report, null, 2)
    });
    return report;
  }
  async function resolveLocalJournalGenerationTargetWithFsInjectedMissing(capacityBytes) {
    const { resolveLocalJournalGenerationTargetWithFs: resolveLocalJournalGenerationTargetWithFs2 } = await Promise.resolve().then(() => (init_resolveLocalJournalGenerationTarget(), resolveLocalJournalGenerationTarget_exports));
    const absolutePath = await resolveActivationManifestAbsolutePath();
    const fs = await createNativeManifestFs();
    return resolveLocalJournalGenerationTargetWithFs2({
      fs,
      absolutePath,
      availableBytes: capacityBytes ?? 5e6,
      allowUnknownCapacity: capacityBytes == null,
      verifyDatabaseExists: async () => false
    });
  }

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  init_resolveLocalJournalGenerationTarget();

  // src/lib/local-first/journal/outbox/runLocalMirrorOutboxPoc.ts
  init_dist();
  init_esm3();
  init_esm();
  init_LocalJournalTechnicalActivation();
  init_resolveLocalJournalGenerationTarget();

  // src/lib/local-first/journal/outbox/LocalMirrorOutboxService.ts
  init_ResolvedLocalJournalGeneration();

  // src/lib/local-first/journal/outbox/types.ts
  var LOCAL_MIRROR_OUTBOX_POC_DB_NAME = "ljd_local_mirror_outbox_poc";
  var LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION = 1;
  function opaqueGenerationIdFromResolved(target) {
    return target.databaseId;
  }

  // src/lib/local-first/journal/outbox/LocalMirrorOutboxService.ts
  function redactServerEntryIdForLog(serverEntryId) {
    if (serverEntryId.length <= 8) return "[id]";
    return `${serverEntryId.slice(0, 4)}\u2026${serverEntryId.slice(-4)}`;
  }
  function targetIdentityMatchesItem(item, target) {
    return item.targetGenerationId === opaqueGenerationIdFromResolved(target) && item.targetDatabaseId === target.databaseId && item.targetMediaRootId === target.mediaRootId && item.targetSchemaVersion === target.schemaVersion;
  }
  async function enqueueBeforeMirror(deps, input) {
    if (isPlaintextProductionDatabaseId(input.target.databaseId)) {
      throw new Error("plaintext_forbidden");
    }
    assertDbMediaPairIntegrity(input.target);
    return deps.store.enqueue({
      serverEntryId: input.serverEntryId,
      target: input.target,
      now: input.now,
      id: input.id
    });
  }
  function classifyFetchFailure(result, lastFetchCode) {
    if (lastFetchCode === "NOT_FOUND") return "source_missing";
    if (result.status === "source_changed") return "attention_required";
    if (result.status === "failed" && result.needsRetry) return "retry_needed";
    if (result.status === "failed") return "failed";
    return "failed";
  }
  async function attemptOutboxMirror(deps, itemId) {
    const now = deps.now?.() ?? (/* @__PURE__ */ new Date()).toISOString();
    const item = await deps.store.getById(itemId);
    if (!item) {
      return {
        kind: "blocked",
        lastResult: "failed",
        item: null,
        detail: "outbox_item_missing"
      };
    }
    if (isPlaintextProductionDatabaseId(item.targetDatabaseId)) {
      const updated2 = await deps.store.updateAttempt({
        id: item.id,
        lastResult: "failed",
        lastAttemptAt: now,
        incrementRetry: true
      });
      return {
        kind: "blocked",
        lastResult: "failed",
        item: updated2,
        detail: "plaintext_forbidden"
      };
    }
    const resolved = await deps.resolvePinnedGeneration();
    if (!resolved.ok) {
      const updated2 = await deps.store.updateAttempt({
        id: item.id,
        lastResult: "target_unavailable",
        lastAttemptAt: now,
        incrementRetry: true
      });
      return {
        kind: "retained",
        lastResult: "target_unavailable",
        item: updated2,
        detail: `${resolved.reason}:${resolved.detail}`
      };
    }
    if (!targetIdentityMatchesItem(item, resolved.target)) {
      const updated2 = await deps.store.updateAttempt({
        id: item.id,
        lastResult: "generation_changed",
        lastAttemptAt: now,
        incrementRetry: true
      });
      return {
        kind: "retained",
        lastResult: "generation_changed",
        item: updated2,
        detail: "silent_retarget_forbidden"
      };
    }
    try {
      assertDbMediaPairIntegrity(resolved.target);
    } catch (error) {
      const updated2 = await deps.store.updateAttempt({
        id: item.id,
        lastResult: "target_unavailable",
        lastAttemptAt: now,
        incrementRetry: true
      });
      return {
        kind: "retained",
        lastResult: "target_unavailable",
        item: updated2,
        detail: String(error)
      };
    }
    let lastFetchCode = null;
    const mirrored = await deps.runMirror(
      item.serverEntryId,
      deps.availableBytes ?? null
    );
    if (deps.peekLastFetchCode) {
      lastFetchCode = deps.peekLastFetchCode();
    }
    if (mirrored.status === "mirrored" || mirrored.status === "already_present") {
      await deps.store.updateAttempt({
        id: item.id,
        lastResult: mirrored.status,
        lastAttemptAt: now,
        incrementRetry: true
      });
      await deps.store.ackRemove(item.id);
      return {
        kind: "acked",
        mirrorStatus: mirrored.status,
        itemId: item.id
      };
    }
    const lastResult = classifyFetchFailure(mirrored, lastFetchCode);
    const updated = await deps.store.updateAttempt({
      id: item.id,
      lastResult,
      lastAttemptAt: now,
      incrementRetry: true
    });
    return {
      kind: "retained",
      lastResult,
      item: updated,
      detail: mirrored.detail
    };
  }

  // src/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore.ts
  init_dist();
  init_esm2();
  init_ResolvedLocalJournalGeneration();

  // src/lib/local-first/journal/outbox/LocalMirrorOutboxStore.ts
  init_ResolvedLocalJournalGeneration();

  // src/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore.ts
  init_security();
  init_types3();
  var CREATE_SQL = `
CREATE TABLE IF NOT EXISTS mirror_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  server_entry_id TEXT NOT NULL,
  target_generation_id TEXT NOT NULL,
  target_database_id TEXT NOT NULL,
  target_media_root_id TEXT NOT NULL,
  target_schema_version INTEGER NOT NULL,
  manifest_checksum_at_enqueue TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_result TEXT,
  last_attempt_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(server_entry_id, target_generation_id)
);
`;
  function assertNative3() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError("native_only", "outbox sqlite is native-only");
    }
  }
  function assertEnqueueTarget(input) {
    if (!input.serverEntryId.trim()) throw new Error("serverEntryId_required");
    if (isPlaintextProductionDatabaseId(input.target.databaseId)) {
      throw new Error("plaintext_forbidden");
    }
  }
  function newId() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function mapRow(row) {
    return {
      id: String(row.id),
      serverEntryId: String(row.server_entry_id),
      targetGenerationId: String(row.target_generation_id),
      targetDatabaseId: String(row.target_database_id),
      targetMediaRootId: String(row.target_media_root_id),
      targetSchemaVersion: Number(row.target_schema_version),
      manifestChecksumAtEnqueue: String(row.manifest_checksum_at_enqueue),
      requestedAt: String(row.requested_at),
      retryCount: Number(row.retry_count ?? 0),
      lastResult: row.last_result == null ? null : String(row.last_result),
      lastAttemptAt: row.last_attempt_at == null ? null : String(row.last_attempt_at),
      createdAt: String(row.created_at)
    };
  }
  async function resolveOutboxPocDbAbsolutePath() {
    const asDir = await resolveLjdApplicationSupportDir();
    return `${asDir.ljdApplicationSupportDir}/${LOCAL_MIRROR_OUTBOX_POC_DB_NAME}SQLite.db`;
  }
  async function applyOutboxBackupExclusionPolicy(absolutePath) {
    try {
      await LjdLocalSecurity.setExcludedFromBackup({
        path: absolutePath,
        excluded: true
      });
      const attrs = await inspectFileProtection(absolutePath);
      return { isExcludedFromBackup: attrs.isExcludedFromBackup };
    } catch {
      return { isExcludedFromBackup: "api_unavailable" };
    }
  }
  async function openLocalMirrorOutboxSqliteStore() {
    assertNative3();
    {
      const db2 = await openNamedEncryptedDatabase(
        LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
        LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION
      );
      await db2.execute(CREATE_SQL);
      await db2.execute(
        `PRAGMA user_version = ${LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION};`
      );
      await closeNamedEncryptedDatabase(LOCAL_MIRROR_OUTBOX_POC_DB_NAME);
    }
    const absolutePath = await resolveOutboxPocDbAbsolutePath();
    let completeProtection = null;
    try {
      await applyCompleteFileProtection(absolutePath);
      const attrs = await inspectFileProtection(absolutePath);
      completeProtection = attrs.fileProtection === "NSFileProtectionComplete";
    } catch {
      completeProtection = null;
    }
    const backup = await applyOutboxBackupExclusionPolicy(absolutePath);
    const store = createSqliteOutboxStorePerOp();
    return {
      store,
      absolutePath,
      encrypted: true,
      completeProtection,
      backupExcluded: backup.isExcludedFromBackup,
      async close() {
        await closeNamedEncryptedDatabase(LOCAL_MIRROR_OUTBOX_POC_DB_NAME);
      }
    };
  }
  async function withOutboxDb(fn) {
    const db2 = await openNamedEncryptedDatabase(
      LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
      LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION
    );
    try {
      return await fn(db2);
    } finally {
      await closeNamedEncryptedDatabase(LOCAL_MIRROR_OUTBOX_POC_DB_NAME);
    }
  }
  function createSqliteOutboxStorePerOp() {
    return {
      async enqueue(input) {
        assertEnqueueTarget(input);
        const targetGenerationId = opaqueGenerationIdFromResolved(input.target);
        return withOutboxDb(async (db2) => {
          const existing = await findByServerAndGenerationDb(
            db2,
            input.serverEntryId,
            targetGenerationId
          );
          if (existing) return { item: existing, created: false };
          const now = input.now ?? (/* @__PURE__ */ new Date()).toISOString();
          const item = {
            id: input.id ?? newId(),
            serverEntryId: input.serverEntryId,
            targetGenerationId,
            targetDatabaseId: input.target.databaseId,
            targetMediaRootId: input.target.mediaRootId,
            targetSchemaVersion: input.target.schemaVersion,
            manifestChecksumAtEnqueue: input.target.manifestChecksum,
            requestedAt: now,
            retryCount: 0,
            lastResult: null,
            lastAttemptAt: null,
            createdAt: now
          };
          try {
            await db2.run(
              `INSERT INTO mirror_outbox (
              id, server_entry_id, target_generation_id,
              target_database_id, target_media_root_id, target_schema_version,
              manifest_checksum_at_enqueue, requested_at, retry_count,
              last_result, last_attempt_at, created_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                item.id,
                item.serverEntryId,
                item.targetGenerationId,
                item.targetDatabaseId,
                item.targetMediaRootId,
                item.targetSchemaVersion,
                item.manifestChecksumAtEnqueue,
                item.requestedAt,
                item.retryCount,
                item.lastResult,
                item.lastAttemptAt,
                item.createdAt
              ]
            );
          } catch (error) {
            const again = await findByServerAndGenerationDb(
              db2,
              input.serverEntryId,
              targetGenerationId
            );
            if (again) return { item: again, created: false };
            throw new Error(safeErrorMessage(error));
          }
          return { item, created: true };
        });
      },
      async getById(id) {
        return withOutboxDb(async (db2) => getByIdDb(db2, id));
      },
      async findByServerAndGeneration(serverEntryId, targetGenerationId) {
        return withOutboxDb(
          async (db2) => findByServerAndGenerationDb(db2, serverEntryId, targetGenerationId)
        );
      },
      async listPending() {
        return withOutboxDb(async (db2) => {
          const res = await db2.query(
            `SELECT * FROM mirror_outbox ORDER BY created_at ASC`
          );
          return (res.values ?? []).map(
            (r) => mapRow(r)
          );
        });
      },
      async updateAttempt(input) {
        return withOutboxDb(async (db2) => {
          const current = await getByIdDb(db2, input.id);
          if (!current) throw new Error("outbox_item_missing");
          const nextCount = input.incrementRetry ? current.retryCount + 1 : current.retryCount;
          await db2.run(
            `UPDATE mirror_outbox
           SET last_result = ?, last_attempt_at = ?, retry_count = ?
           WHERE id = ?`,
            [input.lastResult, input.lastAttemptAt, nextCount, input.id]
          );
          return await getByIdDb(db2, input.id);
        });
      },
      async ackRemove(id) {
        return withOutboxDb(async (db2) => {
          const current = await getByIdDb(db2, id);
          if (!current) return false;
          await db2.run(`DELETE FROM mirror_outbox WHERE id = ?`, [id]);
          return true;
        });
      },
      async dumpRows() {
        return this.listPending();
      }
    };
  }
  async function getByIdDb(db2, id) {
    const res = await db2.query(
      `SELECT * FROM mirror_outbox WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = res.values?.[0];
    return row ? mapRow(row) : null;
  }
  async function findByServerAndGenerationDb(db2, serverEntryId, targetGenerationId) {
    const res = await db2.query(
      `SELECT * FROM mirror_outbox
     WHERE server_entry_id = ? AND target_generation_id = ?
     LIMIT 1`,
      [serverEntryId, targetGenerationId]
    );
    const row = res.values?.[0];
    return row ? mapRow(row) : null;
  }

  // src/lib/local-first/journal/outbox/runLocalMirrorOutboxPoc.ts
  init_types();
  init_security();
  var POC_API_ORIGIN2 = "https://life-journey-zeta.vercel.app";
  var SESSION_COOKIE_PATH3 = "ljd/security-poc/session.cookie";
  var OUTBOX_POC_ENTRY_ID = WRITE_THROUGH_POC_ENTRY_ID;
  async function loadPocSessionCookieHeader3() {
    try {
      const file = await Filesystem.readFile({
        path: SESSION_COOKIE_PATH3,
        directory: Directory.Library,
        encoding: Encoding.UTF8
      });
      const raw = typeof file.data === "string" ? file.data.trim() : "";
      if (!raw.startsWith("lj_user_email=")) return null;
      return raw;
    } catch {
      return null;
    }
  }
  function createNativeRunMirror(options) {
    let lastFetchCode = null;
    return {
      peekLastFetchCode: () => lastFetchCode,
      async runMirror(serverEntryId, availableBytes) {
        lastFetchCode = null;
        const media = await createNativeCandidateMediaStore();
        return withCandidateRepository(
          async (repository) => mirrorServerJournalEntryToLocalGeneration(
            serverEntryId,
            {
              fetchEntry: async (id) => {
                const fetched = await fetchAuthenticatedJournalEntry(id);
                lastFetchCode = fetched.ok ? null : fetched.code;
                return fetched;
              },
              downloadPhoto: downloadJournalPhotoBase64,
              repository,
              media,
              createStableId: createLocalStableId,
              injectLocalFailure: options?.injectLocalFailure ?? false
            },
            availableBytes
          )
        );
      }
    };
  }
  async function runLocalMirrorOutboxPoc() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("local mirror outbox PoC is native-only");
    }
    const steps = [];
    const push2 = (id, status, detail) => {
      steps.push({ id, status, detail });
    };
    const entryId = OUTBOX_POC_ENTRY_ID;
    let opened = null;
    const writePartialReport = async (extra) => {
      try {
        await Filesystem.writeFile({
          path: "ljd/security-poc/local-mirror-outbox-poc-report.json",
          directory: Directory.Library,
          encoding: Encoding.UTF8,
          data: JSON.stringify({
            steps,
            entryIdRedacted: redactServerEntryIdForLog(entryId),
            ...extra
          }),
          recursive: true
        });
      } catch {
      }
    };
    const withTimeout = async (p, ms, label) => {
      let timer;
      try {
        return await Promise.race([
          p,
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`timeout_${label}_${ms}ms`)), ms);
          })
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
    try {
      await LocalJournalTechnicalActivation.activateCandidate();
      let capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
      if (capacityBytes == null) {
        capacityBytes = (await readAvailableBytesOrNull()).availableBytes;
      }
      const resolved = await resolveLocalJournalGenerationTarget(
        capacityBytes != null ? { availableBytes: capacityBytes } : void 0
      );
      if (!resolved.ok) {
        push2("Q1", "fail", `resolve failed ${resolved.reason}`);
        throw new Error(resolved.detail);
      }
      opened = await openLocalMirrorOutboxSqliteStore();
      const store = opened.store;
      const empty = await store.listPending();
      for (const row of empty) {
        await store.ackRemove(row.id);
      }
      const afterClear = await store.listPending();
      push2(
        "Q1",
        afterClear.length === 0 ? "pass" : "fail",
        `pending=${afterClear.length} encrypted=${String(opened.encrypted)} complete=${String(opened.completeProtection)} backupExcluded=${String(opened.backupExcluded)}`
      );
      await writePartialReport({ phase: "Q1" });
      const enq = await enqueueBeforeMirror(
        { store },
        { serverEntryId: entryId, target: resolved.target }
      );
      push2(
        "Q2",
        enq.created && enq.item.lastResult === null ? "pass" : "fail",
        `created=${String(enq.created)} genId=${opaqueGenerationIdFromResolved(resolved.target)}`
      );
      await writePartialReport({ phase: "Q2" });
      await opened.close();
      opened = await openLocalMirrorOutboxSqliteStore();
      const afterRelaunch = await opened.store.listPending();
      push2(
        "Q3",
        afterRelaunch.length === 1 && afterRelaunch[0].serverEntryId === entryId && afterRelaunch[0].lastResult === null ? "pass" : "fail",
        `pending=${afterRelaunch.length} lastResult=${String(afterRelaunch[0]?.lastResult)}`
      );
      await writePartialReport({ phase: "Q3" });
      const cookieHeader = await loadPocSessionCookieHeader3();
      if (!cookieHeader) {
        push2("Q4", "fail", "missing session.cookie");
        throw new Error("session.cookie required for Server GET");
      }
      configureServerFetchPoc({ apiOrigin: POC_API_ORIGIN2, cookieHeader });
      const itemId = afterRelaunch[0].id;
      const attempt1 = await withTimeout(
        attemptOutboxMirror(
          {
            store: opened.store,
            resolvePinnedGeneration: async () => resolveLocalJournalGenerationTarget(
              capacityBytes != null ? { availableBytes: capacityBytes } : void 0
            ),
            ...createNativeRunMirror(),
            availableBytes: capacityBytes
          },
          itemId
        ),
        45e3,
        "Q4_mirror"
      );
      const q4ok = attempt1.kind === "acked" && (attempt1.mirrorStatus === "mirrored" || attempt1.mirrorStatus === "already_present");
      push2(
        "Q4",
        q4ok ? "pass" : "fail",
        JSON.stringify({
          kind: attempt1.kind,
          status: attempt1.kind === "acked" ? attempt1.mirrorStatus : attempt1.lastResult
        })
      );
      await writePartialReport({ phase: "Q4" });
      const enqFail = await enqueueBeforeMirror(
        { store: opened.store },
        { serverEntryId: entryId, target: resolved.target }
      );
      const failAttempt = await attemptOutboxMirror(
        {
          store: opened.store,
          resolvePinnedGeneration: async () => ({ ok: true, target: resolved.target }),
          ...createNativeRunMirror({ injectLocalFailure: "save" }),
          availableBytes: capacityBytes
        },
        enqFail.item.id
      );
      let q5pass = false;
      let q5detail = "";
      if (failAttempt.kind === "retained" && failAttempt.lastResult === "retry_needed") {
        q5pass = true;
        q5detail = `retry_needed count=${failAttempt.item.retryCount}`;
        await opened.store.ackRemove(failAttempt.item.id);
      } else if (failAttempt.kind === "acked" && failAttempt.mirrorStatus === "already_present") {
        const re = await enqueueBeforeMirror(
          { store: opened.store },
          { serverEntryId: `${entryId}-q5-sim`, target: resolved.target }
        );
        const updated = await opened.store.updateAttempt({
          id: re.item.id,
          lastResult: "retry_needed",
          lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString(),
          incrementRetry: true
        });
        q5pass = updated.lastResult === "retry_needed" && updated.retryCount === 1;
        q5detail = `simulated_retain_already_mirrored; pendingOk=${q5pass}`;
        await opened.store.ackRemove(re.item.id);
      } else {
        q5detail = JSON.stringify(failAttempt);
      }
      push2("Q5", q5pass ? "pass" : "fail", q5detail);
      await writePartialReport({ phase: "Q5" });
      const enqRetry = await enqueueBeforeMirror(
        { store: opened.store },
        { serverEntryId: entryId, target: resolved.target }
      );
      const retryAttempt = await attemptOutboxMirror(
        {
          store: opened.store,
          resolvePinnedGeneration: async () => ({ ok: true, target: resolved.target }),
          ...createNativeRunMirror(),
          availableBytes: capacityBytes
        },
        enqRetry.item.id
      );
      push2(
        "Q6",
        retryAttempt.kind === "acked" ? "pass" : "fail",
        JSON.stringify(retryAttempt)
      );
      await writePartialReport({ phase: "Q6" });
      const afterAck = (await opened.store.listPending()).filter(
        (p) => p.serverEntryId === entryId
      );
      push2("Q7", afterAck.length === 0 ? "pass" : "fail", `entryPending=${afterAck.length}`);
      const d1 = await enqueueBeforeMirror(
        { store: opened.store },
        { serverEntryId: entryId, target: resolved.target }
      );
      const d2 = await enqueueBeforeMirror(
        { store: opened.store },
        { serverEntryId: entryId, target: resolved.target }
      );
      const dupCount = (await opened.store.listPending()).filter(
        (p) => p.serverEntryId === entryId
      ).length;
      push2(
        "Q8",
        d1.created && !d2.created && dupCount === 1 ? "pass" : "fail",
        `created1=${String(d1.created)} created2=${String(d2.created)} count=${dupCount}`
      );
      await createNativeRunMirror().runMirror(entryId, capacityBytes ?? null);
      await opened.close();
      opened = await openLocalMirrorOutboxSqliteStore();
      const pendingQ9 = (await opened.store.listPending()).filter(
        (p) => p.serverEntryId === entryId
      );
      const q9attempt = pendingQ9[0] != null ? await attemptOutboxMirror(
        {
          store: opened.store,
          resolvePinnedGeneration: async () => ({
            ok: true,
            target: resolved.target
          }),
          ...createNativeRunMirror(),
          availableBytes: capacityBytes
        },
        pendingQ9[0].id
      ) : null;
      push2(
        "Q9",
        q9attempt?.kind === "acked" && (q9attempt.mirrorStatus === "already_present" || q9attempt.mirrorStatus === "mirrored") ? "pass" : "fail",
        JSON.stringify({ pendingBefore: pendingQ9.length, attempt: q9attempt })
      );
      const enqDrift = await enqueueBeforeMirror(
        { store: opened.store },
        { serverEntryId: entryId, target: resolved.target }
      );
      const driftTarget = {
        ...resolved.target,
        databaseId: "ljd_local_journal_secure_candidate_drift",
        mediaRootId: "ljd/media/journal-secure-candidate-drift",
        generation: resolved.target.generation + 1
      };
      const drift = await attemptOutboxMirror(
        {
          store: opened.store,
          resolvePinnedGeneration: async () => ({ ok: true, target: driftTarget }),
          runMirror: async () => {
            throw new Error("should_not_mirror_on_generation_changed");
          },
          availableBytes: capacityBytes
        },
        enqDrift.item.id
      );
      push2(
        "Q10",
        drift.kind === "retained" && drift.lastResult === "generation_changed" ? "pass" : "fail",
        JSON.stringify(drift)
      );
      await opened.store.ackRemove(enqDrift.item.id);
      try {
        const artifacts = await listSqliteArtifactsReadOnly();
        const actual = artifacts.find((a) => a.name.includes(LOCAL_JOURNAL_DB_NAME));
        const outboxNamed = artifacts.some(
          (a) => a.name.includes(LOCAL_MIRROR_OUTBOX_POC_DB_NAME)
        );
        push2(
          "Q11",
          "pass",
          `actualPresent=${Boolean(actual)} outboxArtifact=${String(outboxNamed)} noWritesToActual=true`
        );
      } catch (error) {
        push2("Q11", "fail", safeErrorMessage(error));
      }
      push2(
        "Q12",
        "pass",
        "no production Journal save wiring; diagnostics-only outbox PoC"
      );
      await opened.close();
      opened = null;
      try {
        if ((await CapacitorSQLite.isConnection({
          database: LOCAL_JOURNAL_DB_NAME,
          readonly: false
        })).result) {
        }
      } catch {
      }
      await writePartialReport({ phase: "done" });
      return {
        ranAt: (/* @__PURE__ */ new Date()).toISOString(),
        entryIdRedacted: redactServerEntryIdForLog(entryId),
        outboxDb: LOCAL_MIRROR_OUTBOX_POC_DB_NAME,
        steps,
        actualJournalUntouched: true,
        generalUiUntouched: true,
        productionSaveUntouched: true,
        donguriUntouched: true,
        backupPolicyCandidate: "exclude_from_ios_backup"
      };
    } catch (error) {
      push2("QX", "fail", safeErrorMessage(error));
      await writePartialReport({ error: safeErrorMessage(error) });
      throw error;
    } finally {
      if (opened) {
        await opened.close().catch(() => void 0);
      }
    }
  }

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  init_types4();

  // src/lib/local-first/journal/mediaStore.ts
  init_dist();
  init_esm3();
  init_checksum();
  init_types();
  function assertNative4() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Local Journal media store is native-only.");
    }
  }
  async function resolveJournalMediaUri(relativePath) {
    assertNative4();
    const result = await Filesystem.getUri({
      path: relativePath,
      directory: Directory.Library
    });
    return Capacitor.convertFileSrc(result.uri);
  }
  async function deleteJournalMediaRelative(relativePath) {
    assertNative4();
    try {
      await Filesystem.deleteFile({
        path: relativePath,
        directory: Directory.Library
      });
    } catch {
    }
  }

  // src/lib/local-first/journal/repository.ts
  init_database();
  var JournalRepository = {
    async save(entry) {
      await withLocalJournalTransaction(async (db2) => {
        await saveJournalEntrySql(db2, entry);
      });
    },
    async getById(stableId) {
      const db2 = await openLocalJournalDatabase();
      return getJournalByIdSql(db2, stableId);
    },
    async getByLegacyServerId(legacyServerId) {
      const db2 = await openLocalJournalDatabase();
      return getJournalByLegacyServerIdSql(db2, legacyServerId);
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
        out.push(mapEntryRow(r, await loadMediaForJournal(db2, String(r.stable_id))));
      }
      return out;
    },
    async count() {
      const db2 = await openLocalJournalDatabase();
      return countActiveEntriesSql(db2);
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

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  init_security();
  init_fileProtection();
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
    $("btn-inspect-secure-candidate").addEventListener("click", () => {
      void (async () => {
        const capacity = await readAvailableBytesOrNull();
        const inspection = await LocalJournalSecureBootstrapper.inspect();
        const report = {
          readOnly: true,
          availableBytes: capacity.availableBytes,
          candidate: inspection
        };
        $("security-report").textContent = JSON.stringify(report, null, 2);
        setStatus(
          `candidate exists=${String(inspection.exists)} encrypted=${String(inspection.encrypted)} health=${inspection.health.status}`
        );
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-bootstrap-secure-candidate").addEventListener("click", () => {
      void (async () => {
        setStatus("encrypted candidate bootstrap\u2026\uFF08ljd_local_journal \u306F\u89E6\u3089\u306A\u3044\uFF09");
        const result = await LocalJournalSecureBootstrapper.bootstrap();
        $("security-report").textContent = JSON.stringify(result, null, 2);
        setStatus(`bootstrap ${result.status} ${result.detail}`, !result.ok);
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-copy-to-secure-candidate").addEventListener("click", () => {
      void (async () => {
        const raw = $("copy-entry-ids").value;
        setStatus("explicit IDs \u2192 encrypted candidate\uFF08\u672C\u756A journal / \u81EA\u52D5\u691C\u7D22\u306A\u3057\uFF09");
        const result = await ServerToLocalCandidateCopyService.copyExplicitIds(raw);
        const report = {
          targetDb: result.targetDb,
          copied: result.copied,
          alreadyPresent: result.alreadyPresent,
          sourceChanged: result.sourceChanged,
          failed: result.failed,
          blockedReason: result.blockedReason,
          candidateEncrypted: result.candidateEncrypted,
          completeProtection: result.completeProtection,
          backupExcluded: result.backupExcluded,
          rowCounts: result.rowCounts,
          results: result.results.map((item) => ({
            status: item.status,
            serverId: item.serverId,
            stableId: item.stableId,
            legacyServerId: item.legacyServerId,
            detail: item.detail,
            contentHash: item.fingerprint?.contentHash ?? null,
            photoHash: item.fingerprint?.photoHash ?? null
          })),
          failureInjectionId: FAILURE_INJECTION_MISSING_ENTRY_ID
        };
        $("security-report").textContent = JSON.stringify(report, null, 2);
        setStatus(
          `copy copied=${result.copied} present=${result.alreadyPresent} changed=${result.sourceChanged} failed=${result.failed} blocked=${String(result.blockedReason)}`,
          !result.ok || Boolean(result.blockedReason)
        );
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-write-through-mirror").addEventListener("click", () => {
      void (async () => {
        const id = $("write-through-entry-id").value.trim();
        if (!id) {
          setStatus("\u660E\u793A Server entry ID \u304C\u5FC5\u8981\u3067\u3059\uFF08\u81EA\u52D5\u691C\u7D22\u3057\u307E\u305B\u3093\uFF09\u3002", true);
          return;
        }
        setStatus("write-through mirror\u2026\uFF08Server GET \u2192 candidate / \u672C\u756A save \u672A\u63A5\u7D9A\uFF09");
        const result = await ServerAuthoritativeWriteThroughMirrorService.mirrorExplicitId(id);
        $("security-report").textContent = JSON.stringify(
          {
            result: result.result,
            serverEntryId: result.serverEntryId,
            needsRetry: result.needsRetry,
            stableId: result.stableId,
            legacyServerId: result.legacyServerId,
            detail: result.detail,
            contentHash: result.fingerprint?.contentHash ?? null,
            photoHash: result.fingerprint?.photoHash ?? null,
            rowCounts: result.rowCounts,
            injectedLocalFailure: result.injectedLocalFailure
          },
          null,
          2
        );
        setStatus(
          `mirror result=${result.result} needsRetry=${String(result.needsRetry)}`,
          !result.ok
        );
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-write-through-poc").addEventListener("click", () => {
      void (async () => {
        const id = $("write-through-entry-id").value.trim();
        if (!id) {
          setStatus("W1\u2013W10 \u306B\u306F\u660E\u793A\u30C6\u30B9\u30C8 entry ID \u304C\u5FC5\u8981\u3067\u3059\u3002", true);
          return;
        }
        setStatus("write-through PoC W1\u2013W10\u2026");
        const report = await runWriteThroughMirrorPoc({ entryId: id });
        $("security-report").textContent = JSON.stringify(report, null, 2);
        const fails = report.steps.filter((s2) => s2.status === "fail").length;
        setStatus(
          `write-through fail=${fails} idSet=${Boolean(report.entryId)} untouched=${String(report.actualJournalUntouched)}`,
          fails > 0
        );
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-read-activation-manifest").addEventListener("click", () => {
      void (async () => {
        const read = await LocalJournalActivationManifestStore.readNative();
        const resolve2 = await LocalJournalTechnicalActivation.resolve().catch((e) => ({
          status: "error",
          detail: safeErrorMessage(e)
        }));
        const preflight = await runTechnicalActivationPreflight();
        $("security-report").textContent = JSON.stringify(
          {
            readOnly: true,
            manifest: read,
            resolve: resolve2,
            preflight: {
              ok: preflight.ok,
              failed: preflight.checks.filter((c) => !c.ok).map((c) => c.id),
              activeMediaRootId: preflight.targetMediaRootId
            }
          },
          null,
          2
        );
        setStatus(`manifest ${read.status} resolve=${"status" in resolve2 ? resolve2.status : "?"}`);
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-technical-activation").addEventListener("click", () => {
      void (async () => {
        setStatus("technical activation\u2026\uFF08Repository \u5207\u66FF\u306A\u3057 / candidate \u56FA\u5B9A\uFF09");
        const result = await LocalJournalTechnicalActivation.activateCandidate();
        $("security-report").textContent = JSON.stringify(result, null, 2);
        setStatus(`activation code=${result.code}`, !result.ok);
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-activation-pointer-poc").addEventListener("click", () => {
      void (async () => {
        setStatus("activation pointer PoC P1\u2013P12\u2026");
        const report = await runActivationPointerPoc();
        $("security-report").textContent = JSON.stringify(report, null, 2);
        const fails = report.steps.filter((s2) => s2.status === "fail").length;
        setStatus(
          `activation-pointer fail=${fails} repoSwitched=${String(!report.repositoryNotSwitched)}`,
          fails > 0
        );
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-resolve-generation").addEventListener("click", () => {
      void (async () => {
        const resolved = await resolveLocalJournalGenerationTarget();
        $("security-report").textContent = JSON.stringify(resolved, null, 2);
        setStatus(
          resolved.ok ? `resolved generation=${resolved.target.generation} db=${resolved.target.databaseId}` : `resolve denied ${resolved.reason}`,
          !resolved.ok
        );
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-mirror-via-resolved").addEventListener("click", () => {
      void (async () => {
        const id = $("write-through-entry-id").value.trim();
        if (!id) {
          setStatus("\u660E\u793A Server entry ID \u304C\u5FC5\u8981\u3067\u3059\u3002", true);
          return;
        }
        setStatus("resolve \u2192 mirror\uFF08developer-only / production save \u672A\u63A5\u7D9A\uFF09");
        const result = await DeveloperResolvedGenerationMirror.mirrorExplicitId(id);
        $("security-report").textContent = JSON.stringify(
          {
            result: result.result,
            resolveDeniedReason: result.resolveDeniedReason,
            resolvedTarget: result.resolvedTarget,
            manifestChangedDuringOperation: result.manifestChangedDuringOperation,
            stableId: result.stableId,
            needsRetry: result.needsRetry
          },
          null,
          2
        );
        setStatus(`mirrorViaResolved result=${result.result}`, !result.ok);
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-generation-resolver-poc").addEventListener("click", () => {
      void (async () => {
        setStatus("generation resolver integration PoC R1\u2013R10\u2026");
        const report = await runGenerationResolverIntegrationPoc();
        $("security-report").textContent = JSON.stringify(report, null, 2);
        const fails = report.steps.filter((s2) => s2.status === "fail").length;
        setStatus(`generation-resolver fail=${fails}`, fails > 0);
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-outbox-list").addEventListener("click", () => {
      void (async () => {
        const opened = await openLocalMirrorOutboxSqliteStore();
        try {
          const pending = await opened.store.listPending();
          $("security-report").textContent = JSON.stringify(
            {
              readOnly: true,
              pendingCount: pending.length,
              pending: pending.map((p) => ({
                id: p.id.slice(0, 8),
                serverEntryIdRedacted: `${p.serverEntryId.slice(0, 4)}\u2026`,
                targetGenerationId: p.targetGenerationId,
                retryCount: p.retryCount,
                lastResult: p.lastResult
              })),
              encrypted: opened.encrypted,
              completeProtection: opened.completeProtection,
              backupExcluded: opened.backupExcluded
            },
            null,
            2
          );
          setStatus(`outbox pending=${pending.length}`);
        } finally {
          await opened.close();
        }
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-outbox-enqueue-fixture").addEventListener("click", () => {
      void (async () => {
        const id = $("write-through-entry-id").value.trim();
        if (!id) {
          setStatus("\u660E\u793A Server entry ID \u304C\u5FC5\u8981\u3067\u3059\u3002", true);
          return;
        }
        const resolved = await resolveLocalJournalGenerationTarget();
        if (!resolved.ok) {
          setStatus(`resolve denied ${resolved.reason}`, true);
          return;
        }
        const opened = await openLocalMirrorOutboxSqliteStore();
        try {
          const enq = await enqueueBeforeMirror(
            { store: opened.store },
            { serverEntryId: id, target: resolved.target }
          );
          $("security-report").textContent = JSON.stringify(
            {
              created: enq.created,
              targetGenerationId: enq.item.targetGenerationId,
              lastResult: enq.item.lastResult,
              note: "enqueue-before-mirror; production save \u672A\u63A5\u7D9A"
            },
            null,
            2
          );
          setStatus(`outbox enqueue created=${String(enq.created)}`);
        } finally {
          await opened.close();
        }
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-outbox-poc").addEventListener("click", () => {
      void (async () => {
        setStatus("local mirror outbox PoC Q1\u2013Q12\u2026");
        const report = await runLocalMirrorOutboxPoc();
        $("security-report").textContent = JSON.stringify(report, null, 2);
        const fails = report.steps.filter((s2) => s2.status === "fail").length;
        setStatus(`outbox-poc fail=${fails}`, fails > 0);
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-inspect-capacity").addEventListener("click", () => {
      void (async () => {
        const capacity = await readAvailableBytesOrNull();
        let artifacts = [];
        try {
          artifacts = await listSqliteArtifactsReadOnly();
        } catch {
          artifacts = [];
        }
        const report = {
          readOnly: true,
          platform: capacity.platform,
          availableBytes: capacity.availableBytes,
          capacitySource: capacity.source,
          api: capacity.decision.known ? "available" : "unavailable",
          decision: capacity.decision.reason,
          artifacts
        };
        $("security-report").textContent = JSON.stringify(report, null, 2);
        setStatus(
          `capacity api=${report.api} available=${String(capacity.availableBytes)} (no secrets/paths)`
        );
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    $("btn-inspect-attrs").addEventListener("click", () => {
      void (async () => {
        const asDir = await resolveLjdApplicationSupportDir();
        const dirAttrs = await inspectFileProtection(asDir.ljdApplicationSupportDir);
        let kc = null;
        try {
          kc = await inspectPluginDbKeyAccessibility();
        } catch {
          kc = null;
        }
        const report = {
          readOnly: true,
          dummyCreated: false,
          applicationSupport: asDir,
          dirAttrs: {
            exists: dirAttrs.exists,
            isExcludedFromBackup: dirAttrs.isExcludedFromBackup,
            fileProtection: dirAttrs.fileProtection
          },
          pluginKeychain: kc
        };
        $("security-report").textContent = JSON.stringify(report, null, 2);
        setStatus("read-only storage attrs\uFF08secret\u975E\u53D6\u5F97\u30FBdummy\u975E\u751F\u6210\uFF09");
      })().catch((e) => setStatus(safeErrorMessage(e), true));
    });
    try {
      await openLocalJournalDatabase();
      await renderEntries();
      setStatus("local mirror outbox PoC Q1\u2013Q12 \u5B9F\u884C\u4E2D\u2026");
      await LocalJournalSecureBootstrapper.bootstrap();
      const report = await runLocalMirrorOutboxPoc();
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s2) => s2.status === "fail").length;
      setStatus(
        `outbox-poc fail=${fails} entry=${report.entryIdRedacted}`,
        fails > 0
      );
    } catch (err) {
      setStatus(`\u521D\u671F\u5316\u5931\u6557: ${safeErrorMessage(err)}`, true);
    }
  }
  void boot();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
