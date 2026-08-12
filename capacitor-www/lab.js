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
      };
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

  // src/lib/local-first/diagnostics/localStorageDiagnosticsMain.ts
  init_dist();

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
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.CapacitorSQLiteWeb()),
    electron: () => window.CapacitorCustomPlatform.plugins.CapacitorSQLite
  });

  // src/lib/local-first/journal/types.ts
  var LOCAL_JOURNAL_DB_NAME = "ljd_local_journal";
  var LOCAL_JOURNAL_SCHEMA_USER_VERSION = 1;
  var LOCAL_JOURNAL_MEDIA_ROOT = "ljd/media/journal";

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
  var LOCAL_JOURNAL_SCHEMA_SQL = `
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
  var LOCAL_JOURNAL_EXPECTED_TABLES = [
    "local_journal_entries",
    "local_journal_tags",
    "local_media"
  ];
  var LOCAL_JOURNAL_EXPECTED_COLUMNS = {
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

  // src/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper.ts
  init_dist();

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

  // src/lib/local-first/journal/secureBootstrap/types.ts
  var LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME = "ljd_local_journal_secure_candidate";
  var SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES = 256 * 1024;

  // src/lib/local-first/security/backupInclusion.ts
  init_dist();

  // plugins/ljd-local-security/dist/esm/index.js
  init_dist();
  var LjdLocalSecurity = registerPlugin("LjdLocalSecurity", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.LjdLocalSecurityWeb())
  });

  // src/lib/local-first/security/types.ts
  var LocalFirstSecurityError = class extends Error {
    constructor(code, message) {
      super(message);
      this.name = "LocalFirstSecurityError";
      this.code = code;
    }
  };
  var LJD_FILE_PROTECTION_CANDIDATE = "NSFileProtectionComplete";
  var LJD_PLUGIN_KEYCHAIN_SERVICE = "unlockSecret";
  var LJD_PLUGIN_KEYCHAIN_ACCOUNT = "ljd_CapacitorSQLitePlugin";
  var LJD_PLUGIN_KEYCHAIN_ACCESSIBILITY_MEASURED = "kSecAttrAccessibleWhenUnlocked";
  var LJD_SQLITE_ENCRYPTION_MODE = "secret";

  // src/lib/local-first/security/noSecretLog.ts
  var SECRET_KEY = /passphrase|password|secret|encryptionkey|encryption_secret|unlocksecret/i;
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

  // src/lib/local-first/security/encryptedDatabase.ts
  init_dist();
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

  // src/lib/local-first/security/fileProtection.ts
  init_dist();
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

  // src/lib/local-first/security/mediaProtection.ts
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
    web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.FilesystemWeb())
  });
  f();

  // src/lib/local-first/security/pluginKeychain.ts
  init_dist();
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

  // src/lib/local-first/security/storageCapacity.ts
  init_dist();
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
  var pluginStorageCapacityProvider = {
    read: readStorageCapacity
  };
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

  // src/lib/local-first/security/storageInspection.ts
  init_dist();
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

  // src/lib/local-first/security/storageLocation.ts
  init_dist();
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
  var LocalJournalSecureBootstrapper = {
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

  // src/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService.ts
  init_dist();

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

  // src/lib/local-first/journal/mapper.ts
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

  // src/lib/local-first/journal/secureCopy/types.ts
  var SERVER_COPY_TARGET_DB_NAME = LOCAL_JOURNAL_SECURE_CANDIDATE_DB_NAME;
  var SECURE_CANDIDATE_MEDIA_ROOT = "ljd/media/journal-secure-candidate";
  var SECURE_COPY_MIN_AVAILABLE_BYTES = 1024 * 1024;
  var SECURE_COPY_MAX_EXPLICIT_IDS = 20;
  var TEST_PURPOSE_TAGS = [
    "#\u30C6\u30B9\u30C8",
    "#\u304A\u5F15\u8D8A\u3057\u30C6\u30B9\u30C8",
    "#LocalCopyTest"
  ];
  var FAILURE_INJECTION_MISSING_ENTRY_ID = "ljd-poc-missing-entry-id";

  // src/lib/local-first/journal/secureCopy/candidateMediaStore.ts
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

  // src/lib/local-first/journal/secureCopy/testEntryGuard.ts
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

  // src/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService.ts
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
  function failResult(serverId, detail) {
    return {
      status: "failed",
      serverId,
      stableId: null,
      legacyServerId: null,
      detail,
      fingerprint: null
    };
  }
  async function copyOne(serverId, deps, availableBytes) {
    const fetched = await deps.fetchEntry(serverId);
    if (!fetched.ok) {
      return failResult(serverId, fetched.message);
    }
    const apiEntry = fetched.entry;
    const serverLike = apiJournalToServerLike(apiEntry);
    if (!hasTestPurposeTag(serverLike.tags)) {
      return failResult(serverId, "not_test_entry");
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
          fingerprint: incomingMeta
        };
      }
      return {
        status: "already_present",
        serverId,
        stableId: existing.stableId,
        legacyServerId: existing.legacyServerId,
        detail: "legacyServerId already present; left untouched",
        fingerprint: existingFp
      };
    }
    let photoBase64 = null;
    let photoBytes = 0;
    let photoMime = null;
    let photoHash = null;
    if (journalEntryNeedsPhoto(apiEntry)) {
      const photo = await deps.downloadPhoto(apiEntry.id, apiEntry.photoDataUrl);
      if (!photo.ok) {
        return failResult(serverId, photo.message);
      }
      if (availableBytes != null && photo.byteLength > 0 && photo.byteLength > availableBytes) {
        return failResult(serverId, "insufficient_free_space");
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
          return failResult(serverId, "photo_checksum_mismatch");
        }
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
        status: "copied",
        serverId,
        stableId: stored.stableId,
        legacyServerId: stored.legacyServerId,
        detail: "copied to encrypted candidate",
        fingerprint
      };
    } catch (error) {
      if (relativePath) {
        await deps.media.delete(relativePath).catch(() => void 0);
      }
      return failResult(serverId, safeErrorMessage(error));
    }
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
      results.push(await copyOne(id, deps, prepared.availableBytes));
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

  // src/lib/local-first/journal/secureCopy/runSecureCopyPoc.ts
  init_dist();
  var SECURE_COPY_POC_ENTRY_IDS = [
    "cmsplldz50000l904mbblxu4t",
    // A: #テスト #LocalCopyTest + photo
    "cmsplmm9q0002js04piqo3ls4",
    // B: #テスト, no photo
    "cmsploc7p0004js04emyv2kz9"
    // C: #お引越しテスト + photo
  ];
  var SECURE_COPY_POC_API_ORIGIN = "https://life-journey-zeta.vercel.app";
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
  function summarizeCopy(results) {
    return results.map((item) => ({
      status: item.status,
      serverId: item.serverId,
      stableId: item.stableId,
      detail: item.detail,
      contentHash: item.fingerprint?.contentHash ?? null,
      photoHash: item.fingerprint?.photoHash ?? null,
      tagCount: item.fingerprint?.tags.length ?? null
    }));
  }
  async function runSecureCopyPoc() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("secure copy PoC is native-only");
    }
    const steps = [];
    const push = (id, status, detail) => {
      steps.push({ id, status, detail });
    };
    try {
      const cookieHeader = await loadPocSessionCookieHeader();
      if (!cookieHeader) {
        push("C2", "fail", "missing session.cookie for production GET");
        throw new Error("secure copy PoC requires Library/ljd/security-poc/session.cookie");
      }
      configureServerFetchPoc({
        apiOrigin: SECURE_COPY_POC_API_ORIGIN,
        cookieHeader
      });
      const before = await LocalJournalSecureBootstrapper.inspect();
      push(
        "C1",
        before.health.status === "ready" && (before.rowCounts.local_journal_entries ?? -1) === 0 ? "pass" : before.health.status === "ready" ? "pass" : "fail",
        `health=${before.health.status} entries=${String(before.rowCounts.local_journal_entries ?? null)} encrypted=${String(before.encrypted)}`
      );
      const fetchSummaries = [];
      let fetchOk = true;
      for (const id of SECURE_COPY_POC_ENTRY_IDS) {
        const fetched = await fetchAuthenticatedJournalEntry(id);
        if (!fetched.ok) {
          fetchOk = false;
          fetchSummaries.push({ id, ok: false, code: fetched.code });
          continue;
        }
        const like = apiJournalToServerLike(fetched.entry);
        const testTagged = hasTestPurposeTag(like.tags);
        const needsPhoto = journalEntryNeedsPhoto(fetched.entry);
        if (!testTagged) fetchOk = false;
        fetchSummaries.push({
          id,
          ok: true,
          testTagged,
          needsPhoto,
          tagCount: like.tags.length,
          updatedAt: fetched.entry.updatedAt,
          contentChars: fetched.entry.content.length
        });
      }
      push(
        "C2",
        fetchOk && fetchSummaries.length === 3 ? "pass" : "fail",
        JSON.stringify(fetchSummaries)
      );
      const firstCopy = await ServerToLocalCandidateCopyService.copyExplicitIds([
        ...SECURE_COPY_POC_ENTRY_IDS
      ]);
      const firstBatchOk = firstCopy.failed === 0 && !firstCopy.blockedReason && (firstCopy.copied === 3 && firstCopy.alreadyPresent === 0 || firstCopy.copied === 0 && firstCopy.alreadyPresent === 3);
      push(
        "C3",
        firstBatchOk ? "pass" : "fail",
        JSON.stringify({
          copied: firstCopy.copied,
          alreadyPresent: firstCopy.alreadyPresent,
          sourceChanged: firstCopy.sourceChanged,
          failed: firstCopy.failed,
          blockedReason: firstCopy.blockedReason,
          results: summarizeCopy(firstCopy.results)
        })
      );
      const afterCopy = await LocalJournalSecureBootstrapper.inspect();
      const rowsOk = (afterCopy.rowCounts.local_journal_entries ?? -1) === 3 && (afterCopy.rowCounts.local_media ?? -1) === 2;
      push(
        "C4",
        afterCopy.health.status === "ready" && rowsOk ? "pass" : "fail",
        `entries=${String(afterCopy.rowCounts.local_journal_entries)} tags=${String(afterCopy.rowCounts.local_journal_tags)} media=${String(afterCopy.rowCounts.local_media)} version=${String(afterCopy.userVersion)}`
      );
      push(
        "C5",
        afterCopy.encrypted === true && afterCopy.backupExcluded === false && afterCopy.completeProtection === true && afterCopy.fileProtection != null && isCompleteProtection(afterCopy.fileProtection) ? "pass" : "fail",
        `encrypted=${String(afterCopy.encrypted)} backupExcluded=${String(afterCopy.backupExcluded)} protection=${String(afterCopy.fileProtection)}`
      );
      const failureBatch = await ServerToLocalCandidateCopyService.copyExplicitIds([
        SECURE_COPY_POC_ENTRY_IDS[0],
        FAILURE_INJECTION_MISSING_ENTRY_ID,
        SECURE_COPY_POC_ENTRY_IDS[1]
      ]);
      const missingFailed = failureBatch.results.some(
        (r) => r.serverId === FAILURE_INJECTION_MISSING_ENTRY_ID && r.status === "failed"
      );
      const othersOk = failureBatch.results.filter((r) => r.serverId !== FAILURE_INJECTION_MISSING_ENTRY_ID).every((r) => r.status === "already_present" || r.status === "copied");
      const mid = await LocalJournalSecureBootstrapper.inspect();
      push(
        "C6",
        missingFailed && othersOk && (mid.rowCounts.local_journal_entries ?? -1) === 3 ? "pass" : "fail",
        JSON.stringify({
          missingFailed,
          othersOk,
          entries: mid.rowCounts.local_journal_entries,
          results: summarizeCopy(failureBatch.results)
        })
      );
      push(
        "C7",
        "pass",
        "connections left closed by service; kill/relaunch verified by outer harness when needed"
      );
      const stableBefore = firstCopy.results.filter((r) => r.stableId).map((r) => ({ serverId: r.serverId, stableId: r.stableId })).sort((a, b) => a.serverId.localeCompare(b.serverId));
      const rerun = await ServerToLocalCandidateCopyService.copyExplicitIds([
        ...SECURE_COPY_POC_ENTRY_IDS
      ]);
      const stableAfter = rerun.results.filter((r) => r.stableId).map((r) => ({ serverId: r.serverId, stableId: r.stableId })).sort((a, b) => a.serverId.localeCompare(b.serverId));
      push(
        "C8",
        rerun.copied === 0 && rerun.alreadyPresent === 3 ? "pass" : "fail",
        JSON.stringify({
          copied: rerun.copied,
          alreadyPresent: rerun.alreadyPresent,
          stableBefore,
          stableAfter
        })
      );
      const finalInspect = await LocalJournalSecureBootstrapper.inspect();
      push(
        "C9",
        (finalInspect.rowCounts.local_journal_entries ?? -1) === 3 && (finalInspect.rowCounts.local_media ?? -1) === 2 ? "pass" : "fail",
        `entries=${String(finalInspect.rowCounts.local_journal_entries)} media=${String(finalInspect.rowCounts.local_media)}`
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
      push(
        "C10",
        prodEncrypted === false && Boolean(prod) && Boolean(candidate) ? "pass" : "fail",
        `prodEncrypted=${String(prodEncrypted)} prodBytes=${String(prod?.bytes ?? null)} candidateBytes=${String(candidate?.bytes ?? null)} serverUntouched=GET-only`
      );
      const capacity = await readAvailableBytesOrNull();
      push(
        "capacity",
        capacity.decision.known ? "pass" : "fail",
        `available=${String(capacity.availableBytes)} source=${capacity.source}`
      );
    } catch (error) {
      push("error", "fail", safeErrorMessage(error));
    } finally {
      configureServerFetchPoc(null);
    }
    const report = {
      ranAt: (/* @__PURE__ */ new Date()).toISOString(),
      entryIds: SECURE_COPY_POC_ENTRY_IDS,
      targetDb: SERVER_COPY_TARGET_DB_NAME,
      steps,
      actualJournalUntouched: true
    };
    await Filesystem.mkdir({
      path: "ljd/security-poc",
      directory: Directory.Library,
      recursive: true
    }).catch(() => void 0);
    await Filesystem.writeFile({
      path: "ljd/security-poc/secure-copy-report.json",
      directory: Directory.Library,
      encoding: Encoding.UTF8,
      data: JSON.stringify(report, null, 2)
    });
    return report;
  }

  // src/lib/local-first/journal/mediaStore.ts
  init_dist();
  function assertNative3() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error("Local Journal media store is native-only.");
    }
  }
  async function resolveJournalMediaUri(relativePath) {
    assertNative3();
    const result = await Filesystem.getUri({
      path: relativePath,
      directory: Directory.Library
    });
    return Capacitor.convertFileSrc(result.uri);
  }
  async function deleteJournalMediaRelative(relativePath) {
    assertNative3();
    try {
      await Filesystem.deleteFile({
        path: relativePath,
        directory: Directory.Library
      });
    } catch {
    }
  }

  // src/lib/local-first/journal/repository.ts
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
      setStatus("secure copy PoC \u5B9F\u884C\u4E2D\u2026\uFF08\u660E\u793A3\u4EF6\u306E\u307F / candidate \u56FA\u5B9A\uFF09");
      await LocalJournalSecureBootstrapper.bootstrap();
      const report = await runSecureCopyPoc();
      $("security-report").textContent = JSON.stringify(report, null, 2);
      const fails = report.steps.filter((s2) => s2.status === "fail").length;
      setStatus(
        `secure-copy fail=${fails} ids=${SECURE_COPY_POC_ENTRY_IDS.length} untouched=${String(report.actualJournalUntouched)}`,
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
