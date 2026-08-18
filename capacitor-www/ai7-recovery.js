var process={env:{NODE_ENV:"development",NEXT_PUBLIC_AI7_DEVICE_HARNESS:"YES"}};
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

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/core/dist/index.js"() {
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

  // ../life-journey-release-server-idempotency-off-prep/plugins/ljd-local-security/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    LjdLocalSecurityWeb: () => LjdLocalSecurityWeb
  });
  var LjdLocalSecurityWeb;
  var init_web = __esm({
    "../life-journey-release-server-idempotency-off-prep/plugins/ljd-local-security/dist/esm/web.js"() {
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

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor-community/sqlite/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    CapacitorSQLiteWeb: () => CapacitorSQLiteWeb
  });
  var CapacitorSQLiteWeb;
  var init_web2 = __esm({
    "../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor-community/sqlite/dist/esm/web.js"() {
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

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/filesystem/dist/esm/definitions.js
  var Directory, Encoding;
  var init_definitions = __esm({
    "../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
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

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/filesystem/dist/esm/web.js
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
    "../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/filesystem/dist/esm/web.js"() {
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
          const db = eventTarget.result;
          switch (event.oldVersion) {
            case 0:
            case 1:
            default: {
              if (db.objectStoreNames.contains("FileStorage")) {
                db.deleteObjectStore("FileStorage");
              }
              const store = db.createObjectStore("FileStorage", { keyPath: "path" });
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

  // src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/deviceUi.ts
  init_dist();

  // src/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap.ts
  init_dist();

  // src/lib/local-first/security/backupInclusion.ts
  init_dist();

  // ../life-journey-release-server-idempotency-off-prep/plugins/ljd-local-security/dist/esm/index.js
  init_dist();
  var LjdLocalSecurity = registerPlugin("LjdLocalSecurity", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.LjdLocalSecurityWeb())
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
  async function ensurePathExcludedFromBackup(path) {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "backup exclusion helper is native-only"
      );
    }
    if (!path) {
      throw new LocalFirstSecurityError("path_required", "path required");
    }
    try {
      const current = await LjdLocalSecurity.inspectPath({ path });
      if (!shouldExcludeFromBackup(current.isExcludedFromBackup)) {
        return current;
      }
      return await LjdLocalSecurity.setExcludedFromBackup({
        path,
        excluded: true
      });
    } catch (error) {
      throw mapSecurityError(error);
    }
  }
  function shouldExcludeFromBackup(current) {
    return current !== true;
  }

  // src/lib/local-first/security/encryptedDatabase.ts
  init_dist();

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor-community/sqlite/dist/esm/index.js
  init_dist();

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor-community/sqlite/dist/esm/definitions.js
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

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor-community/sqlite/dist/esm/index.js
  var CapacitorSQLite = registerPlugin("CapacitorSQLite", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.CapacitorSQLiteWeb()),
    electron: () => window.CapacitorCustomPlatform.plugins.CapacitorSQLite
  });

  // src/lib/local-first/journal/types.ts
  var LOCAL_JOURNAL_DB_NAME = "ljd_local_journal";

  // src/lib/local-first/security/encryptedDatabase.ts
  var PluginSecretConfigurationError = class extends Error {
    constructor(reason) {
      super(`plugin_secret_configuration_${reason}`);
      this.name = "PluginSecretConfigurationError";
      this.reason = reason;
    }
  };
  function classifyPluginSecretConfigurationFailure(error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not implemented|unimplemented|method.*not.*found/i.test(message)) {
      return "api_unavailable";
    }
    if (/no encryption set/i.test(message)) return "encryption_not_configured";
    if (/no database folder|getdatabasesurl|database location/i.test(message)) {
      return "database_location_unavailable";
    }
    if (/keychain|secitem|security service|errsec/i.test(message)) {
      return "keychain_write_failed";
    }
    return "unknown";
  }
  function assertNotProductionJournal(name) {
    if (name === LOCAL_JOURNAL_DB_NAME) {
      throw new LocalFirstSecurityError(
        "journal_encryption_forbidden",
        "ljd_local_journal must not be opened encrypted in 4B-3E; plaintext\u2192encrypted migration is a later phase"
      );
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
      throw new PluginSecretConfigurationError(classifyPluginSecretConfigurationFailure(error));
    }
  }
  async function isPluginEncryptionSecretStored() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "encryption secret inspection is native-only"
      );
    }
    try {
      return (await CapacitorSQLite.isSecretStored()).result === true;
    } catch (error) {
      throw mapSecurityError(error);
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
      const db = await sqlite.createConnection(
        name,
        true,
        LJD_SQLITE_ENCRYPTION_MODE,
        version,
        false
      );
      await db.open();
      return db;
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

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/filesystem/dist/esm/index.js
  init_dist();

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/synapse/dist/synapse.mjs
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

  // ../life-journey-release-server-idempotency-off-prep/node_modules/@capacitor/filesystem/dist/esm/index.js
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

  // src/lib/local-first/security/storageInspection.ts
  init_dist();

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

  // src/lib/journal/clientSaveIntent/NativeClientSaveOperationIntentStore.ts
  init_dist();

  // src/lib/journal/clientSaveIntent/types.ts
  var CLIENT_SAVE_OPERATION_INTENT_DB_NAME = "ljd_client_save_operation_intent";
  var CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION = 3;
  var CLIENT_SAVE_EXACT_PAYLOAD_VERSION = 1;

  // src/lib/journal/clientSaveIntent/lifecycle.ts
  var ALLOWED_TRANSITIONS = {
    prepared: [
      "prepared",
      "awaiting_result",
      "server_completed",
      "completed",
      "recovery_required",
      "failed_final"
    ],
    awaiting_result: [
      "awaiting_result",
      "server_completed",
      "completed",
      "recovery_required",
      "failed_final"
    ],
    server_completed: ["server_completed", "completed"],
    completed: ["completed"],
    // A recovery-required intent can still learn that the server finished the
    // operation, so it must be able to move forward without a new attempt.
    recovery_required: [
      "recovery_required",
      "awaiting_result",
      "server_completed",
      "failed_final"
    ],
    failed_final: ["failed_final"]
  };
  function isClientSaveOperationIntentTransitionAllowed(from, to) {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }
  function assertClientSaveOperationIntentTransition(from, to) {
    if (!isClientSaveOperationIntentTransitionAllowed(from, to)) {
      throw new Error(`intent_transition_invalid:${from}->${to}`);
    }
  }

  // src/lib/journal/clientSaveIntent/saveOperationId.ts
  var MIN_LENGTH = 16;
  var MAX_LENGTH = 64;
  var PATTERN = /^[0-9A-Za-z_-]+$/;
  function normalizeClientActorKey(viewerEmail) {
    return viewerEmail.trim().toLowerCase();
  }
  function isValidClientSaveOperationId(value) {
    return value.length >= MIN_LENGTH && value.length <= MAX_LENGTH && PATTERN.test(value);
  }

  // src/lib/journal/contentFontMode.ts
  var CONTENT_FONT_MODES = ["relaxed", "standard", "generous", "compact"];
  var DEFAULT_CONTENT_FONT_MODE = "standard";
  function isContentFontMode(value) {
    return CONTENT_FONT_MODES.includes(value);
  }

  // src/lib/journal/meta.ts
  var companionTypes = [
    "owl",
    "hedgehog",
    "squirrel",
    "sloth",
    "frog"
  ];
  function isCompanionType(value) {
    return companionTypes.includes(value);
  }
  var diaryDesignOptions = [
    { id: "simple_plain", label: "\u30B7\u30F3\u30D7\u30EB\u7CFB\uFF08\u7F6B\u7DDA\u306A\u3057\uFF09" }
  ];
  var diaryDesignIds = diaryDesignOptions.map((d) => d.id);
  function normalizeDiaryDesignTheme(value) {
    const t = value.trim();
    if (t === "simple_plain") return "simple_plain";
    if (t === "simple" || t === "cute" || t === "cute_plain") return "simple_plain";
    return "simple_plain";
  }
  function isAllowedDiaryDesignThemeRaw(raw) {
    const t = raw.trim();
    return t === "" || t === "simple_plain" || t === "simple" || t === "cute" || t === "cute_plain";
  }
  var moodOptions = [
    { id: "happy", label: "\u3046\u308C\u3057\u3044", emoji: "\u{1F60A}" },
    { id: "calm", label: "\u304A\u3060\u3084\u304B", emoji: "\u{1F642}" },
    { id: "normal", label: "\u3075\u3064\u3046", emoji: "\u{1F60C}" },
    { id: "tired", label: "\u3064\u304B\u308C\u305F", emoji: "\u{1F62E}\u200D\u{1F4A8}" },
    { id: "moody", label: "\u3082\u3084\u3082\u3084", emoji: "\u{1F614}" }
  ];
  var moodOptionIds = moodOptions.map((m) => m.id);
  var activityOptions = [
    { id: "work_study", label: "\u4ED5\u4E8B\u30FB\u52C9\u5F37\u3092\u304C\u3093\u3070\u3063\u305F" },
    { id: "family_friends", label: "\u5BB6\u65CF\u30FB\u53CB\u4EBA\u3068\u904E\u3054\u3057\u305F" },
    { id: "new_challenge", label: "\u65B0\u3057\u3044\u3053\u3068\u3092\u3057\u305F" },
    { id: "rest", label: "\u3086\u3063\u304F\u308A\u4F11\u3093\u3060" },
    { id: "organize", label: "\u6574\u7406\u30FB\u7247\u3065\u3051\u3092\u3057\u305F" },
    { id: "enjoyed", label: "\u597D\u304D\u306A\u3053\u3068\u3092\u697D\u3057\u3093\u3060" },
    { id: "outing", label: "\u79FB\u52D5\u30FB\u304A\u3067\u304B\u3051\u3092\u3057\u305F" },
    { id: "health_care", label: "\u4F53\u8ABF\u3092\u6574\u3048\u305F" },
    { id: "very_happy", label: "\u3068\u3066\u3082\u5B09\u3057\u3044\u3053\u3068\u304C\u3042\u3063\u305F" },
    { id: "emotional_wave", label: "\u5FC3\u304C\u3056\u308F\u3064\u3044\u305F" },
    { id: "hard_day", label: "\u3057\u3093\u3069\u304B\u3063\u305F" },
    { id: "sad", label: "\u60B2\u3057\u3044\u6C17\u6301\u3061\u304C\u3042\u3063\u305F" },
    { id: "anxious", label: "\u4E0D\u5B89\u304C\u5F37\u304B\u3063\u305F" },
    { id: "irritated", label: "\u30A4\u30E9\u30A4\u30E9\u3057\u305F" },
    { id: "lost_confidence", label: "\u81EA\u4FE1\u3092\u306A\u304F\u3057\u305F" },
    { id: "no_energy", label: "\u4F55\u3082\u3057\u305F\u304F\u306A\u3044\u65E5\u3060\u3063\u305F" },
    { id: "down", label: "\u3046\u307E\u304F\u3044\u304B\u305A\u843D\u3061\u8FBC\u3093\u3060" },
    { id: "record_anyway", label: "\u7279\u5225\u306A\u3053\u3068\u306F\u306A\u3044\u3051\u308C\u3069\u3001\u8A18\u9332\u3057\u305F\u3044" }
  ];
  var activityOptionIds = activityOptions.map((a) => a.id);
  function isMoodId(value) {
    return moodOptionIds.includes(value);
  }
  function isActivityId(value) {
    return activityOptionIds.includes(value);
  }

  // scripts/ai7-local-assets-node-crypto-shim.js
  var K = new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  function rotr(value, bits) {
    return value >>> bits | value << 32 - bits;
  }
  function sha256Bytes(message) {
    const bitLen = message.length * 8;
    const paddedLen = message.length + 9 + 63 >> 6 << 6;
    const padded = new Uint8Array(paddedLen);
    padded.set(message);
    padded[message.length] = 128;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 4, bitLen >>> 0, false);
    let h0 = 1779033703;
    let h1 = 3144134277;
    let h2 = 1013904242;
    let h3 = 2773480762;
    let h4 = 1359893119;
    let h5 = 2600822924;
    let h6 = 528734635;
    let h7 = 1541459225;
    const w = new Uint32Array(64);
    for (let offset = 0; offset < paddedLen; offset += 64) {
      for (let i = 0; i < 16; i += 1) {
        w[i] = view.getUint32(offset + i * 4, false);
      }
      for (let i = 16; i < 64; i += 1) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ w[i - 15] >>> 3;
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ w[i - 2] >>> 10;
        w[i] = w[i - 16] + s0 + w[i - 7] + s1 >>> 0;
      }
      let a = h0;
      let b = h1;
      let c = h2;
      let d = h3;
      let e = h4;
      let f2 = h5;
      let g = h6;
      let h = h7;
      for (let i = 0; i < 64; i += 1) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = e & f2 ^ ~e & g;
        const temp1 = h + S1 + ch + K[i] + w[i] >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = a & b ^ a & c ^ b & c;
        const temp2 = S0 + maj >>> 0;
        h = g;
        g = f2;
        f2 = e;
        e = d + temp1 >>> 0;
        d = c;
        c = b;
        b = a;
        a = temp1 + temp2 >>> 0;
      }
      h0 = h0 + a >>> 0;
      h1 = h1 + b >>> 0;
      h2 = h2 + c >>> 0;
      h3 = h3 + d >>> 0;
      h4 = h4 + e >>> 0;
      h5 = h5 + f2 >>> 0;
      h6 = h6 + g >>> 0;
      h7 = h7 + h >>> 0;
    }
    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, h0, false);
    outView.setUint32(4, h1, false);
    outView.setUint32(8, h2, false);
    outView.setUint32(12, h3, false);
    outView.setUint32(16, h4, false);
    outView.setUint32(20, h5, false);
    outView.setUint32(24, h6, false);
    outView.setUint32(28, h7, false);
    return out;
  }
  function toBytes(data, encoding) {
    if (typeof data === "string") {
      if (encoding && encoding !== "utf8" && encoding !== "utf-8") {
        throw new Error(`unsupported hash encoding: ${encoding}`);
      }
      return new TextEncoder().encode(data);
    }
    if (data instanceof Uint8Array) return data;
    if (ArrayBuffer.isView(data)) {
      return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    throw new Error("unsupported hash input");
  }
  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function createHash(algorithm) {
    const alg = String(algorithm).toLowerCase();
    if (alg !== "sha256") {
      throw new Error(`local-assets crypto shim supports sha256 only: ${algorithm}`);
    }
    const chunks = [];
    return {
      update(data, encoding) {
        chunks.push(toBytes(data, encoding));
        return this;
      },
      digest(encoding) {
        let total = 0;
        for (const chunk of chunks) total += chunk.length;
        const message = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          message.set(chunk, offset);
          offset += chunk.length;
        }
        const digest = sha256Bytes(message);
        if (encoding === "hex" || encoding === void 0) return bytesToHex(digest);
        if (encoding === "bytes") return digest;
        throw new Error(`unsupported digest encoding: ${encoding}`);
      }
    };
  }

  // src/lib/journal/saveIdempotency/requestFingerprint.ts
  function buildJournalSaveRequestFingerprint(input) {
    const contentHash = input.contentHash.trim().toLowerCase();
    const entryDate = input.entryDate.trim();
    const photoIdentity = input.photoIdentity.trim() || "none";
    return `v1|${contentHash}|${entryDate}|${photoIdentity}`;
  }

  // src/lib/journal/saveIdempotency/productionRequestFingerprint.ts
  function sha256Hex(text) {
    return createHash("sha256").update(text, "utf8").digest("hex");
  }
  function photoIdentityFromPatch(input) {
    if (input.kind === "remove") return "remove";
    if (input.kind === "set" && input.dataUrl) {
      return `photo:${sha256Hex(input.dataUrl)}`;
    }
    return "none";
  }
  function buildProductionJournalSaveFingerprint(input) {
    const contentHash = sha256Hex(input.content);
    const base = buildJournalSaveRequestFingerprint({
      contentHash,
      entryDate: input.entryDate,
      photoIdentity: input.photoIdentity
    });
    const meta = [
      `profile:${input.profileId.trim()}`,
      `mood:${input.mood}`,
      `activity:${input.activity}`,
      `companion:${input.companionType}`,
      `theme:${input.designTheme}`,
      `font:${input.contentFontMode}`,
      `book:${input.includeInBook ? "1" : "0"}`
    ].join("|");
    return `${base}|${meta}`;
  }

  // src/lib/journal/clientSaveIntent/exactPayloadCanonical.ts
  var JOURNAL_PHOTO_DATA_URL_MAX_CHARS = 2e6;
  var JOURNAL_CONTENT_MAX_CHARS = 2e3;
  var REQUEST_JSON_MAX_BYTES = 21e5;
  var FORBIDDEN_REQUEST_KEYS = [
    "email",
    "viewerEmail",
    "actorKey",
    "cookie",
    "cookies",
    "token",
    "authorization",
    "secret",
    "password",
    "passphrase"
  ];
  function asRecord(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
    return value;
  }
  function parseEntryDate(raw) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mon = Number(m[2]);
    const d = Number(m[3]);
    const probe = new Date(Date.UTC(y, mon - 1, d, 12, 0, 0));
    if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mon - 1 || probe.getUTCDate() !== d) {
      return null;
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  function utf8ByteLength(text) {
    return new TextEncoder().encode(text).length;
  }
  function stringifyCanonicalJournalSaveRequest(request) {
    const ordered = {
      saveOperationId: request.saveOperationId,
      content: request.content,
      entryDate: request.entryDate,
      profileId: request.profileId,
      mood: request.mood,
      activity: request.activity,
      companionType: request.companionType,
      designTheme: request.designTheme,
      contentFontMode: request.contentFontMode,
      includeInBook: request.includeInBook
    };
    if (typeof request.photoDataUrl === "string") {
      ordered.photoDataUrl = request.photoDataUrl;
    }
    if (request.photoRemoved === true) {
      ordered.photoRemoved = true;
    }
    return JSON.stringify(ordered);
  }
  function fingerprintCanonicalJournalSaveRequest(request) {
    const photoIdentity = request.photoRemoved ? photoIdentityFromPatch({ kind: "remove" }) : request.photoDataUrl ? photoIdentityFromPatch({ kind: "set", dataUrl: request.photoDataUrl }) : photoIdentityFromPatch({ kind: "unchanged" });
    return buildProductionJournalSaveFingerprint({
      content: request.content,
      entryDate: request.entryDate,
      profileId: request.profileId,
      mood: request.mood,
      activity: request.activity,
      companionType: request.companionType,
      designTheme: request.designTheme,
      contentFontMode: request.contentFontMode,
      includeInBook: request.includeInBook,
      photoIdentity
    });
  }
  function canonicalizeExactJournalSavePayload(input) {
    const body = asRecord(input.payload);
    if (!body) {
      return { ok: false, code: "content_invalid" };
    }
    for (const key of FORBIDDEN_REQUEST_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        return { ok: false, code: "forbidden_key" };
      }
    }
    const saveOperationId = input.saveOperationId.trim();
    if (!isValidClientSaveOperationId(saveOperationId)) {
      return { ok: false, code: "save_operation_id_invalid" };
    }
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content || content.length > JOURNAL_CONTENT_MAX_CHARS) {
      return { ok: false, code: "content_invalid" };
    }
    const entryDate = parseEntryDate(
      typeof body.entryDate === "string" ? body.entryDate : ""
    );
    if (!entryDate) return { ok: false, code: "entry_date_invalid" };
    const profileId = typeof body.profileId === "string" ? body.profileId.trim() : typeof body.effectiveProfileId === "string" ? body.effectiveProfileId.trim() : "";
    if (!profileId) return { ok: false, code: "profile_id_required" };
    const moodRaw = typeof body.mood === "string" && body.mood.trim() ? body.mood.trim() : "calm";
    if (!isMoodId(moodRaw)) return { ok: false, code: "mood_invalid" };
    const activityRaw = typeof body.activity === "string" && body.activity.trim() ? body.activity.trim() : "record_anyway";
    if (!isActivityId(activityRaw)) return { ok: false, code: "activity_invalid" };
    const companionRaw = typeof body.companionType === "string" && body.companionType.trim() ? body.companionType.trim() : "owl";
    if (!isCompanionType(companionRaw)) {
      return { ok: false, code: "companion_invalid" };
    }
    const themeRaw = typeof body.designTheme === "string" ? body.designTheme : "simple";
    if (!isAllowedDiaryDesignThemeRaw(themeRaw)) {
      return { ok: false, code: "design_theme_invalid" };
    }
    const designTheme = normalizeDiaryDesignTheme(themeRaw.trim() || "simple");
    let contentFontMode = DEFAULT_CONTENT_FONT_MODE;
    if ("contentFontMode" in body && body.contentFontMode != null && body.contentFontMode !== "") {
      if (typeof body.contentFontMode !== "string" || !isContentFontMode(body.contentFontMode.trim())) {
        return { ok: false, code: "content_font_mode_invalid" };
      }
      contentFontMode = body.contentFontMode.trim();
    }
    const includeInBook = typeof body.includeInBook === "boolean" ? body.includeInBook : true;
    const hasPhotoDataUrl = Object.prototype.hasOwnProperty.call(body, "photoDataUrl");
    const photoRemoved = body.photoRemoved === true;
    if (photoRemoved && hasPhotoDataUrl) {
      return { ok: false, code: "photo_ambiguous" };
    }
    const request = {
      saveOperationId,
      content,
      entryDate,
      profileId,
      mood: moodRaw,
      activity: activityRaw,
      companionType: companionRaw,
      designTheme,
      contentFontMode,
      includeInBook
    };
    if (photoRemoved) {
      request.photoRemoved = true;
    } else if (hasPhotoDataUrl) {
      const raw = String(body.photoDataUrl ?? "").trim();
      if (!raw) return { ok: false, code: "photo_ambiguous" };
      if (raw.length > JOURNAL_PHOTO_DATA_URL_MAX_CHARS) {
        return { ok: false, code: "photo_too_large" };
      }
      request.photoDataUrl = raw;
    }
    const requestJson = stringifyCanonicalJournalSaveRequest(request);
    const requestByteLength = utf8ByteLength(requestJson);
    if (requestByteLength > REQUEST_JSON_MAX_BYTES) {
      return { ok: false, code: "payload_too_large" };
    }
    return {
      ok: true,
      request,
      requestJson,
      requestFingerprint: fingerprintCanonicalJournalSaveRequest(request),
      requestByteLength
    };
  }
  function parseStoredRequestJson(requestJson) {
    try {
      const parsed = JSON.parse(requestJson);
      const recanon = canonicalizeExactJournalSavePayload({
        saveOperationId: typeof parsed?.saveOperationId === "string" ? parsed.saveOperationId : "",
        payload: parsed
      });
      if (!recanon.ok) return null;
      if (recanon.requestJson !== requestJson) return null;
      return recanon.request;
    } catch {
      return null;
    }
  }

  // src/lib/journal/clientSaveIntent/durableExactPayload.ts
  async function applyPersistPreparedIntentWithExactPayload(tx, input) {
    if (input.payload === null || typeof input.payload !== "object" || Array.isArray(input.payload)) {
      return { kind: "rejected", code: "content_invalid" };
    }
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: input.intent.saveOperationId,
      payload: {
        ...input.payload,
        saveOperationId: input.intent.saveOperationId
      }
    });
    if (!canonical.ok) return { kind: "rejected", code: canonical.code };
    if (input.intent.requestFingerprint !== canonical.requestFingerprint) {
      return { kind: "rejected", code: "fingerprint_mismatch" };
    }
    const existingIntent = await tx.findIntent(input.intent.saveOperationId);
    const existingPayload = existingIntent ? await tx.findPayload(input.intent.saveOperationId) : null;
    if (existingIntent && !existingPayload) {
      return { kind: "intent_without_payload", intent: existingIntent };
    }
    if (existingIntent && existingPayload) {
      if (existingPayload.requestJson === canonical.requestJson && existingPayload.requestFingerprint === canonical.requestFingerprint && existingIntent.requestFingerprint === canonical.requestFingerprint) {
        return {
          kind: "already_exists",
          intent: existingIntent,
          payload: existingPayload
        };
      }
      return { kind: "payload_conflict", intent: existingIntent };
    }
    const payloadRow = {
      saveOperationId: input.intent.saveOperationId,
      payloadVersion: CLIENT_SAVE_EXACT_PAYLOAD_VERSION,
      requestJson: canonical.requestJson,
      requestFingerprint: canonical.requestFingerprint,
      requestByteLength: canonical.requestByteLength,
      createdAt: input.intent.createdAt
    };
    await tx.insertIntent(input.intent);
    await tx.insertPayload(payloadRow);
    return { kind: "created", intent: input.intent, payload: payloadRow };
  }
  function verifyLoadedExactPayload(record, intentFingerprint) {
    const request = parseStoredRequestJson(record.requestJson);
    if (!request) return { kind: "corrupt" };
    const recomputed = fingerprintCanonicalJournalSaveRequest(request);
    if (recomputed !== record.requestFingerprint || intentFingerprint !== void 0 && intentFingerprint !== recomputed) {
      return { kind: "fingerprint_mismatch", payload: record };
    }
    return { kind: "ok", payload: record, request };
  }
  async function applyDeleteExactPayloadIfCompleted(tx, input) {
    const intent = await tx.findIntent(input.saveOperationId);
    if (!intent) {
      return { kind: "blocked", reason: "intent_missing", saveOperationId: input.saveOperationId };
    }
    if (intent.actorKey !== input.actorKey) {
      return {
        kind: "blocked",
        reason: "actor_mismatch",
        saveOperationId: input.saveOperationId,
        status: intent.status
      };
    }
    if (intent.status !== "completed" || !intent.serverEntryId) {
      return {
        kind: "blocked",
        reason: "intent_not_completed",
        saveOperationId: input.saveOperationId,
        status: intent.status
      };
    }
    const payload = await tx.findPayload(input.saveOperationId);
    if (!payload) {
      return { kind: "already_absent", saveOperationId: input.saveOperationId };
    }
    await tx.deletePayload(input.saveOperationId);
    return { kind: "deleted", saveOperationId: input.saveOperationId };
  }

  // src/lib/journal/clientSaveIntent/clientSaveIntentSqlStore.ts
  var CREATE_INTENT_SQL = `
CREATE TABLE IF NOT EXISTS client_save_operation_intent (
  intent_id TEXT PRIMARY KEY NOT NULL,
  save_operation_id TEXT NOT NULL UNIQUE,
  actor_key TEXT NOT NULL,
  draft_ref TEXT,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL,
  server_entry_id TEXT,
  failure_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_attempt_at TEXT,
  completed_at TEXT
);`;
  var CREATE_TOMBSTONE_SQL = `
CREATE TABLE IF NOT EXISTS client_save_operation_deletion_tombstone (
  actor_key TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`;
  var CREATE_PAYLOAD_SQL = `
CREATE TABLE IF NOT EXISTS client_save_operation_payload (
  save_operation_id TEXT PRIMARY KEY NOT NULL,
  payload_version INTEGER NOT NULL,
  request_json TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  request_byte_length INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (save_operation_id) REFERENCES client_save_operation_intent(save_operation_id)
);`;
  var REQUIRED_COLUMNS = [
    "intent_id",
    "save_operation_id",
    "actor_key",
    "draft_ref",
    "request_fingerprint",
    "status",
    "server_entry_id",
    "failure_code",
    "created_at",
    "updated_at",
    "last_attempt_at",
    "completed_at"
  ];
  var REQUIRED_PAYLOAD_COLUMNS = [
    "save_operation_id",
    "payload_version",
    "request_json",
    "request_fingerprint",
    "request_byte_length",
    "created_at"
  ];
  async function ensureClientSaveIntentSchema(db) {
    const versionResult = await db.query("PRAGMA user_version");
    const version = Number(versionResult.values?.[0]?.user_version ?? -1);
    if (version === 0) {
      const existing = await db.query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
        ["client_save_operation_intent"]
      );
      if (existing.values?.length) {
        throw new Error("intent_schema_partial_or_unversioned");
      }
      await db.execute(CREATE_INTENT_SQL);
      await db.execute(CREATE_TOMBSTONE_SQL);
      await db.execute(CREATE_PAYLOAD_SQL);
      await db.execute(`PRAGMA user_version = ${CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION}`);
      return;
    }
    if (version === 1) {
      await db.execute(CREATE_TOMBSTONE_SQL);
      await db.execute(CREATE_PAYLOAD_SQL);
      await db.execute(`PRAGMA user_version = ${CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION}`);
    } else if (version === 2) {
      await db.execute(CREATE_PAYLOAD_SQL);
      await db.execute(`PRAGMA user_version = ${CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION}`);
    } else if (version !== CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION) {
      throw new Error("intent_schema_version_unsupported");
    }
    const columns = await db.query("PRAGMA table_info(client_save_operation_intent)");
    const names = new Set(
      (columns.values ?? []).map((column) => String(column.name))
    );
    if (REQUIRED_COLUMNS.some((column) => !names.has(column))) {
      throw new Error("intent_schema_columns_invalid");
    }
    const payloadColumns = await db.query("PRAGMA table_info(client_save_operation_payload)");
    const payloadNames = new Set(
      (payloadColumns.values ?? []).map(
        (column) => String(column.name)
      )
    );
    if (REQUIRED_PAYLOAD_COLUMNS.some((column) => !payloadNames.has(column))) {
      throw new Error("intent_schema_columns_invalid");
    }
  }
  async function withTransaction(db, fn) {
    await db.execute("BEGIN");
    try {
      const result = await fn();
      await db.execute("COMMIT");
      return result;
    } catch (error) {
      try {
        await db.execute("ROLLBACK");
      } catch {
      }
      throw error;
    }
  }
  function mapRow(row) {
    return {
      intentId: String(row.intent_id),
      saveOperationId: String(row.save_operation_id),
      actorKey: String(row.actor_key),
      draftRef: row.draft_ref == null ? null : String(row.draft_ref),
      requestFingerprint: String(row.request_fingerprint),
      status: String(row.status),
      serverEntryId: row.server_entry_id == null ? null : String(row.server_entry_id),
      failureCode: row.failure_code == null ? null : String(row.failure_code),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      lastAttemptAt: row.last_attempt_at == null ? null : String(row.last_attempt_at),
      completedAt: row.completed_at == null ? null : String(row.completed_at)
    };
  }
  function mapPayloadRow(row) {
    return {
      saveOperationId: String(row.save_operation_id),
      payloadVersion: 1,
      requestJson: String(row.request_json),
      requestFingerprint: String(row.request_fingerprint),
      requestByteLength: Number(row.request_byte_length),
      createdAt: String(row.created_at)
    };
  }
  async function findIntent(db, saveOperationId) {
    const result = await db.query(
      "SELECT * FROM client_save_operation_intent WHERE save_operation_id = ? LIMIT 1",
      [saveOperationId]
    );
    const row = result.values?.[0];
    return row ? mapRow(row) : null;
  }
  async function findPayload(db, saveOperationId) {
    const result = await db.query(
      "SELECT * FROM client_save_operation_payload WHERE save_operation_id = ? LIMIT 1",
      [saveOperationId]
    );
    const row = result.values?.[0];
    return row ? mapPayloadRow(row) : null;
  }
  async function insertIntentRow(db, intent) {
    await db.run(
      `INSERT INTO client_save_operation_intent (
      intent_id, save_operation_id, actor_key, draft_ref, request_fingerprint,
      status, server_entry_id, failure_code, created_at, updated_at,
      last_attempt_at, completed_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        intent.intentId,
        intent.saveOperationId,
        intent.actorKey,
        intent.draftRef,
        intent.requestFingerprint,
        intent.status,
        intent.serverEntryId,
        intent.failureCode,
        intent.createdAt,
        intent.updatedAt,
        intent.lastAttemptAt,
        intent.completedAt
      ]
    );
  }
  async function insertPayloadRow(db, row) {
    await db.run(
      `INSERT INTO client_save_operation_payload (
      save_operation_id, payload_version, request_json, request_fingerprint,
      request_byte_length, created_at
    ) VALUES (?,?,?,?,?,?)`,
      [
        row.saveOperationId,
        row.payloadVersion,
        row.requestJson,
        row.requestFingerprint,
        row.requestByteLength,
        row.createdAt
      ]
    );
  }
  async function deletePayloadRow(db, saveOperationId) {
    await db.run("DELETE FROM client_save_operation_payload WHERE save_operation_id = ?", [
      saveOperationId
    ]);
  }
  function createClientSaveDurableStoreFromSql(session) {
    const store = {
      async findByActorAndSaveOperationId(actorKey, saveOperationId) {
        return session.withDb(async (db) => {
          const row = await findIntent(db, saveOperationId);
          return row?.actorKey === actorKey ? row : null;
        });
      },
      async tryInsert(intent) {
        return session.withDb(async (db) => {
          const existing = await findIntent(db, intent.saveOperationId);
          if (existing) return { created: false, intent: existing };
          await insertIntentRow(db, intent);
          return { created: true, intent };
        });
      },
      async update(intent) {
        return session.withDb(async (db) => {
          const existing = await findIntent(db, intent.saveOperationId);
          if (!existing || existing.actorKey !== intent.actorKey) throw new Error("intent_missing");
          assertClientSaveOperationIntentTransition(existing.status, intent.status);
          await db.run(
            `UPDATE client_save_operation_intent SET
            draft_ref=?, request_fingerprint=?, status=?, server_entry_id=?,
            failure_code=?, updated_at=?, last_attempt_at=?, completed_at=?
           WHERE save_operation_id=? AND actor_key=?`,
            [
              intent.draftRef,
              intent.requestFingerprint,
              intent.status,
              intent.serverEntryId,
              intent.failureCode,
              intent.updatedAt,
              intent.lastAttemptAt,
              intent.completedAt,
              intent.saveOperationId,
              intent.actorKey
            ]
          );
          const updated = await findIntent(db, intent.saveOperationId);
          if (!updated || updated.actorKey !== intent.actorKey) throw new Error("intent_missing");
          return updated;
        });
      },
      async listRecoverableByActor(actorKey) {
        return session.withDb(async (db) => {
          const result = await db.query(
            `SELECT * FROM client_save_operation_intent
           WHERE actor_key = ? AND status IN ('prepared','awaiting_result','server_completed','recovery_required')
           ORDER BY created_at ASC`,
            [actorKey]
          );
          return (result.values ?? []).map((row) => mapRow(row));
        });
      },
      async deleteByActor(actorKey) {
        return session.withDb(async (db) => {
          return withTransaction(db, async () => {
            await db.run(
              `DELETE FROM client_save_operation_payload
             WHERE save_operation_id IN (
               SELECT save_operation_id FROM client_save_operation_intent WHERE actor_key = ?
             )`,
              [actorKey]
            );
            const result = await db.run(
              "DELETE FROM client_save_operation_intent WHERE actor_key = ?",
              [actorKey]
            );
            return result.changes?.changes ?? 0;
          });
        });
      },
      async getDeletionTombstone(actorKey) {
        return session.withDb(async (db) => {
          const result = await db.query(
            "SELECT actor_key, created_at, updated_at FROM client_save_operation_deletion_tombstone WHERE actor_key = ? LIMIT 1",
            [actorKey]
          );
          const row = result.values?.[0];
          return row ? {
            actorKey: String(row.actor_key),
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at)
          } : null;
        });
      },
      async writeDeletionTombstone(actorKey, now) {
        await session.withDb(async (db) => {
          await db.run(
            `INSERT INTO client_save_operation_deletion_tombstone (actor_key, created_at, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(actor_key) DO UPDATE SET updated_at=excluded.updated_at`,
            [actorKey, now, now]
          );
        });
      },
      async clearDeletionTombstone(actorKey) {
        await session.withDb(async (db) => {
          await db.run("DELETE FROM client_save_operation_deletion_tombstone WHERE actor_key = ?", [
            actorKey
          ]);
        });
      },
      async persistPreparedIntentWithExactPayload(input) {
        return session.withDb(async (db) => {
          return withTransaction(
            db,
            async () => applyPersistPreparedIntentWithExactPayload(
              {
                findIntent: (id) => findIntent(db, id),
                insertIntent: (intent) => insertIntentRow(db, intent),
                findPayload: (id) => findPayload(db, id),
                insertPayload: (row) => insertPayloadRow(db, row)
              },
              input
            )
          );
        });
      },
      async loadExactPayloadBySaveOperationId(saveOperationId) {
        return session.withDb(async (db) => {
          const payload = await findPayload(db, saveOperationId);
          if (!payload) return { kind: "missing" };
          const intent = await findIntent(db, saveOperationId);
          return verifyLoadedExactPayload(payload, intent?.requestFingerprint);
        });
      },
      async deleteExactPayloadBySaveOperationId(input) {
        return session.withDb(async (db) => {
          return withTransaction(
            db,
            async () => applyDeleteExactPayloadIfCompleted(
              {
                findIntent: (id) => findIntent(db, id),
                findPayload: (id) => findPayload(db, id),
                deletePayload: (id) => deletePayloadRow(db, id)
              },
              input
            )
          );
        });
      },
      async cleanupCompletedExactPayloadsForActor(actorKey) {
        const ids = await session.withDb(async (db) => {
          const result = await db.query(
            `SELECT p.save_operation_id AS save_operation_id
           FROM client_save_operation_payload p
           INNER JOIN client_save_operation_intent i
             ON i.save_operation_id = p.save_operation_id
           WHERE i.actor_key = ? AND i.status = 'completed' AND i.server_entry_id IS NOT NULL`,
            [actorKey]
          );
          return (result.values ?? []).map((row) => String(row.save_operation_id));
        });
        let deleted = 0;
        const results = [];
        for (const saveOperationId of ids) {
          const result = await store.deleteExactPayloadBySaveOperationId({
            actorKey,
            saveOperationId
          });
          results.push(result);
          if (result.kind === "deleted") deleted += 1;
        }
        return { attempted: ids.length, deleted, results };
      }
    };
    return store;
  }

  // src/lib/journal/clientSaveIntent/NativeClientSaveOperationIntentStore.ts
  function assertNative() {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "client save intent storage has no browser fallback"
      );
    }
  }
  function adaptNativeConnection(db) {
    return {
      query: (sql, params) => db.query(sql, params),
      run: (sql, params) => db.run(sql, params),
      execute: (statements) => db.execute(statements)
    };
  }
  async function withNativeEncryptedDb(fn) {
    const native = await openNamedEncryptedDatabase(
      CLIENT_SAVE_OPERATION_INTENT_DB_NAME,
      CLIENT_SAVE_OPERATION_INTENT_SCHEMA_VERSION
    );
    try {
      const db = adaptNativeConnection(native);
      await ensureClientSaveIntentSchema(db);
      await db.execute("PRAGMA foreign_keys = ON");
      return await fn(db);
    } finally {
      await native.close();
    }
  }
  async function initializeNativeClientSaveOperationIntentStore() {
    assertNative();
    await withNativeEncryptedDb(async () => void 0);
  }
  function createNativeClientSaveOperationIntentStore() {
    assertNative();
    return createClientSaveDurableStoreFromSql({
      withDb: withNativeEncryptedDb
    });
  }

  // src/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap.ts
  function generateEphemeralBootstrapSecret() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  function nativeDatabasePath(databasesDir) {
    return `${databasesDir.replace(/\/$/, "")}/${CLIENT_SAVE_OPERATION_INTENT_DB_NAME}SQLite.db`;
  }
  var productionDependencies = {
    isNativePlatform: () => Capacitor.isNativePlatform(),
    isPluginSecretStored: isPluginEncryptionSecretStored,
    inspectKeychain: inspectPluginDbKeyAccessibility,
    configureSecret: configurePluginEncryptionSecret,
    initializeDatabase: initializeNativeClientSaveOperationIntentStore,
    createStore: createNativeClientSaveOperationIntentStore,
    resolveApplicationSupport: resolveLjdApplicationSupportDir,
    excludeFromBackup: ensurePathExcludedFromBackup,
    applyCompleteProtection: applyCompleteFileProtection,
    inspectProtection: inspectFileProtection,
    isCompleteProtection,
    generateSecret: generateEphemeralBootstrapSecret
  };
  async function initializeWithDependencies(deps) {
    if (!deps.isNativePlatform()) {
      return { result: { status: "unsupported_platform" }, diagnosticStage: "platform" };
    }
    let secretStored;
    try {
      secretStored = await deps.isPluginSecretStored();
    } catch {
      return {
        result: { status: "secure_store_unavailable" },
        diagnosticStage: "plugin_secret_read_initial"
      };
    }
    if (!secretStored) {
      try {
        await deps.configureSecret(deps.generateSecret());
        secretStored = await deps.isPluginSecretStored();
      } catch (error) {
        return {
          result: { status: "secure_store_unavailable" },
          diagnosticStage: error instanceof PluginSecretConfigurationError ? `plugin_secret_create_${error.reason}` : "plugin_secret_create_unknown"
        };
      }
    }
    if (!secretStored) {
      return {
        result: { status: "secure_store_unavailable" },
        diagnosticStage: "plugin_secret_read_after_create"
      };
    }
    try {
      const keychain = await deps.inspectKeychain();
      if (!keychain.found || !keychain.matchesWhenUnlocked) {
        return {
          result: { status: "secure_store_unavailable" },
          diagnosticStage: "keychain_accessibility"
        };
      }
    } catch {
      return {
        result: { status: "secure_store_unavailable" },
        diagnosticStage: "keychain_accessibility"
      };
    }
    try {
      await deps.initializeDatabase();
    } catch (error) {
      return {
        result: {
          status: /intent_schema_(?:partial_or_unversioned|version_unsupported|columns_invalid)/.test(
            error instanceof Error ? error.message : ""
          ) ? "schema_error" : "database_unavailable"
        },
        diagnosticStage: "database_open"
      };
    }
    try {
      const databasePath = nativeDatabasePath(
        (await deps.resolveApplicationSupport()).ljdApplicationSupportDir
      );
      const backup = await deps.excludeFromBackup(databasePath);
      const protectedPath = await deps.applyCompleteProtection(databasePath);
      const inspected = await deps.inspectProtection(databasePath);
      if (backup.isExcludedFromBackup !== true || protectedPath.fileProtection !== "NSFileProtectionComplete" || !deps.isCompleteProtection(inspected.fileProtection)) {
        return { result: { status: "database_unavailable" }, diagnosticStage: "storage_attributes" };
      }
    } catch {
      return { result: { status: "database_unavailable" }, diagnosticStage: "storage_attributes" };
    }
    try {
      return { result: { status: "ready", store: deps.createStore() }, diagnosticStage: "ready" };
    } catch {
      return { result: { status: "database_unavailable" }, diagnosticStage: "database_open" };
    }
  }
  var initialization = null;
  var readiness = { status: "unsupported_platform" };
  var diagnosticStage = "not_started";
  async function initializeSaveIntentStore() {
    if (!initialization) {
      initialization = initializeWithDependencies(productionDependencies).then((attempt) => {
        diagnosticStage = attempt.diagnosticStage;
        readiness = { status: attempt.result.status };
        return attempt.result;
      });
    }
    return initialization;
  }

  // src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/constants.ts
  var AI7_DEVICE_RECOVERY_TEST_ACTOR = "ai7-device-recovery-test@ljd.invalid";
  var AI7_DEVICE_HARNESS_FLAG = "NEXT_PUBLIC_AI7_DEVICE_HARNESS";
  var AI7_DEVICE_HARNESS_FLAG_VALUE = "YES";
  var AI7_TEXT_SAVE_OPERATION_ID = "ai7dev_text_testop_000001";
  var AI7_PHOTO_SAVE_OPERATION_ID = "ai7dev_photo_testop_00001";
  var AI7_TEST_PROFILE_ID = "ai7_test_profile_isolated";
  var AI7_TEST_DRAFT_REF = "ai7_device_recovery_harness";

  // src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/gate.ts
  function evaluateAi7DeviceRecoveryHarnessGate(input = {}) {
    const nodeEnv = (input.nodeEnv ?? "development" ?? "").trim();
    const flag = (input.flag ?? process.env[AI7_DEVICE_HARNESS_FLAG] ?? "").trim();
    const isNative = input.isNativePlatform === true;
    const nodeEnvOk = nodeEnv !== "production";
    const flagOk = flag === AI7_DEVICE_HARNESS_FLAG_VALUE;
    if (!nodeEnvOk) {
      return {
        ok: false,
        reason: "production_build",
        pageAllowed: false,
        operationsAllowed: false
      };
    }
    if (!flagOk) {
      return {
        ok: false,
        reason: "flag_off",
        pageAllowed: false,
        operationsAllowed: false
      };
    }
    if (!isNative) {
      return {
        ok: false,
        reason: "not_native",
        pageAllowed: true,
        operationsAllowed: false
      };
    }
    return {
      ok: true,
      reason: "ok",
      pageAllowed: true,
      operationsAllowed: true
    };
  }

  // src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/fakeTransport.ts
  function parseBody(input) {
    const requestJson = typeof input === "string" ? input : JSON.stringify(input);
    let saveOperationId = "";
    try {
      const parsed = JSON.parse(requestJson);
      saveOperationId = typeof parsed.saveOperationId === "string" ? parsed.saveOperationId : "";
    } catch {
      saveOperationId = "";
    }
    return {
      saveOperationId,
      requestFingerprint: `ai7-fake:${saveOperationId}`,
      requestJson
    };
  }
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }
  function createAi7FakeJournalTransport() {
    const byOperation = /* @__PURE__ */ new Map();
    const transport = {
      postCalls: 0,
      lookupCalls: 0,
      posts: [],
      capability: async () => ({ kind: "enabled" }),
      async post(payload) {
        return transport.postExactJson(JSON.stringify(payload));
      },
      async postExactJson(requestJson) {
        transport.postCalls += 1;
        const parsed = parseBody(requestJson);
        const existing = byOperation.get(parsed.saveOperationId);
        if (existing) {
          transport.posts.push(existing);
          return jsonResponse({ entry: { id: existing.entryId } });
        }
        const record = {
          ...parsed,
          entryId: `ai7_sim_entry_${byOperation.size + 1}`
        };
        byOperation.set(parsed.saveOperationId, record);
        transport.posts.push(record);
        return jsonResponse({ entry: { id: record.entryId } });
      },
      async lookup(input) {
        transport.lookupCalls += 1;
        const found = byOperation.get(input.saveOperationId);
        if (!found) {
          return jsonResponse({ state: "not_found" });
        }
        return jsonResponse({
          state: "completed",
          entryId: found.entryId
        });
      }
    };
    return transport;
  }
  function createAi7FakeOrchestratorDeps(bootstrap, transport = createAi7FakeJournalTransport()) {
    return {
      bootstrap,
      capability: transport.capability,
      post: transport.post,
      postExactJson: transport.postExactJson,
      lookup: transport.lookup,
      fake: transport
    };
  }

  // src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/payloads.ts
  var AI7_TEST_PHOTO_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  var baseFields = {
    mood: "calm",
    activity: "record_anyway",
    companionType: "owl",
    designTheme: "simple_plain",
    contentFontMode: "standard",
    entryDate: "2026-08-18",
    profileId: AI7_TEST_PROFILE_ID,
    includeInBook: true
  };
  function ai7TextTestPayload() {
    return {
      ...baseFields,
      content: "AI7 isolated recovery text",
      saveOperationId: AI7_TEXT_SAVE_OPERATION_ID
    };
  }
  function ai7PhotoTestPayload() {
    return {
      ...baseFields,
      content: "AI7 isolated recovery photo",
      photoDataUrl: AI7_TEST_PHOTO_DATA_URL,
      saveOperationId: AI7_PHOTO_SAVE_OPERATION_ID
    };
  }

  // src/lib/localE2eHarness/faultStore.ts
  var armed = /* @__PURE__ */ new Map();
  function matchesScope(fault, actorKey, saveOperationId) {
    if (fault.actorKey !== actorKey.trim().toLowerCase()) return false;
    if (!fault.saveOperationId) return true;
    return fault.saveOperationId === (saveOperationId ?? "").trim();
  }
  function consumeLocalE2eFault(mode, actorKey, saveOperationId) {
    const fault = armed.get(mode);
    if (!fault) return false;
    if (!matchesScope(fault, actorKey, saveOperationId)) return false;
    armed.delete(mode);
    return true;
  }

  // src/lib/account/accountDeleteSaveIntentTeardown.ts
  var deletionInFlightActors = /* @__PURE__ */ new Set();
  var deletedActors = /* @__PURE__ */ new Set();
  function isSaveIntentActivityBlockedForActor(actorKey) {
    return deletionInFlightActors.has(actorKey) || deletedActors.has(actorKey);
  }
  async function resumeAccountDeleteSaveIntentCleanup(actorKey, store) {
    const tombstone = await store.getDeletionTombstone(actorKey);
    if (!tombstone) return false;
    deletedActors.add(actorKey);
    try {
      await store.deleteByActor(actorKey);
      if ((await store.listRecoverableByActor(actorKey)).length !== 0) return true;
      await store.clearDeletionTombstone(actorKey);
      return false;
    } catch {
      return true;
    }
  }

  // src/lib/localE2eHarness/transportAdapters.ts
  function lookupJson(state) {
    return new Response(JSON.stringify({ state }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  async function maybeDropSuccessfulResponse(actorKey, saveOperationId, response) {
    if (actorKey && response.ok && response.status === 200 && consumeLocalE2eFault("response_loss_after_server_success", actorKey, saveOperationId)) {
      throw new Error("local_e2e_response_loss_after_server_success");
    }
    return response;
  }
  function wrapJournalCreateDepsWithLocalE2eFaults(deps, viewerEmailForScope) {
    return {
      ...deps,
      async post(payload) {
        const actorKey = normalizeClientActorKey(viewerEmailForScope() ?? "") ?? "";
        const saveOperationId = typeof payload.saveOperationId === "string" ? payload.saveOperationId : null;
        const response = await deps.post(payload);
        return maybeDropSuccessfulResponse(actorKey, saveOperationId, response);
      },
      async postExactJson(requestJson) {
        const actorKey = normalizeClientActorKey(viewerEmailForScope() ?? "") ?? "";
        let saveOperationId = null;
        try {
          const parsed = JSON.parse(requestJson);
          saveOperationId = typeof parsed.saveOperationId === "string" ? parsed.saveOperationId : null;
        } catch {
          saveOperationId = null;
        }
        const response = await (deps.postExactJson ? deps.postExactJson(requestJson) : deps.post(JSON.parse(requestJson)));
        return maybeDropSuccessfulResponse(actorKey, saveOperationId, response);
      },
      async lookup(input) {
        const actorKey = normalizeClientActorKey(viewerEmailForScope() ?? "") ?? "";
        if (actorKey && consumeLocalE2eFault("lookup_processing_once", actorKey, input.saveOperationId)) {
          return lookupJson("processing");
        }
        if (actorKey && consumeLocalE2eFault("lookup_not_found_once", actorKey, input.saveOperationId)) {
          return lookupJson("not_found");
        }
        return deps.lookup(input);
      }
    };
  }

  // src/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator.ts
  function isDurableStore(store) {
    return typeof store.persistPreparedIntentWithExactPayload === "function" && typeof store.loadExactPayloadBySaveOperationId === "function";
  }
  async function responseJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }
  async function serverCapability() {
    try {
      const response = await fetch("/api/journal/save-capability", { credentials: "same-origin" });
      if (!response.ok) return { kind: "unavailable" };
      const data = await response.json();
      if (data.protocolVersion !== 1) return { kind: "unknown_protocol" };
      return data.idempotentSaveEnabled === true ? { kind: "enabled" } : { kind: "disabled" };
    } catch {
      return { kind: "unavailable" };
    }
  }
  var productionDeps = {
    bootstrap: initializeSaveIntentStore,
    capability: serverCapability,
    post: (payload) => fetch("/api/journal", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
    postExactJson: (requestJson) => fetch("/api/journal", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: requestJson
    }),
    lookup: ({ saveOperationId, requestFingerprint }) => fetch(
      `/api/journal/save-operations/${encodeURIComponent(saveOperationId)}?requestFingerprint=${encodeURIComponent(requestFingerprint)}`,
      { credentials: "same-origin" }
    )
  };
  function resolveDeps(viewerEmail, deps) {
    if (deps !== productionDeps) return deps;
    return wrapJournalCreateDepsWithLocalE2eFaults(productionDeps, () => viewerEmail);
  }
  var continuationFlights = /* @__PURE__ */ new Map();
  var foregroundExactReplayOnce = /* @__PURE__ */ new Set();
  function sessionPayloadKey(actorKey, saveOperationId) {
    return `${actorKey}:${saveOperationId}`;
  }
  function claimForegroundExactReplay(actorKey, saveOperationId) {
    const key = sessionPayloadKey(actorKey, saveOperationId);
    if (foregroundExactReplayOnce.has(key)) return false;
    foregroundExactReplayOnce.add(key);
    return true;
  }
  function clearCurrentSessionJournalCreatePayloadsForTest() {
    continuationFlights.clear();
    foregroundExactReplayOnce.clear();
  }
  function hasPayloadCleanup(store) {
    return isDurableStore(store) && typeof store.deleteExactPayloadBySaveOperationId === "function";
  }
  async function cleanupPayloadAfterCompleted(store, intent) {
    if (intent.status !== "completed" || !intent.serverEntryId) return;
    if (!hasPayloadCleanup(store)) return;
    try {
      await store.deleteExactPayloadBySaveOperationId({
        actorKey: intent.actorKey,
        saveOperationId: intent.saveOperationId
      });
    } catch {
    }
  }
  async function retryCompletedPayloadCleanup(store, actorKey) {
    if (!hasPayloadCleanup(store)) return;
    try {
      await store.cleanupCompletedExactPayloadsForActor(actorKey);
    } catch {
    }
  }
  async function update(store, intent, patch) {
    return store.update({ ...intent, ...patch, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  }
  async function postStoredRequestJson(deps, requestJson) {
    if (deps.postExactJson) {
      return deps.postExactJson(requestJson);
    }
    return deps.post(JSON.parse(requestJson));
  }
  function saveOperationIdFromRequestJson(requestJson) {
    try {
      const parsed = JSON.parse(requestJson);
      return typeof parsed.saveOperationId === "string" ? parsed.saveOperationId : null;
    } catch {
      return null;
    }
  }
  async function applyPostedProtocolResponse(input) {
    const data = await responseJson(input.response);
    const entryId = typeof data.entry === "object" && data.entry && typeof data.entry.id === "string" ? data.entry.id : null;
    if (input.response.status === 200 && entryId) {
      let intent = await update(input.store, input.intent, {
        status: "server_completed",
        serverEntryId: entryId
      });
      try {
        await input.afterServerCompleted?.(entryId);
      } catch {
        return {
          kind: "recovery_required",
          recoveryState: "recovery_required",
          intent,
          reason: "local_post_save_failed"
        };
      }
      intent = await update(input.store, intent, {
        status: "completed",
        completedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await cleanupPayloadAfterCompleted(input.store, intent);
      return { kind: "completed", recoveryState: "completed", entryId, data, intent };
    }
    if (input.response.status === 202) {
      return { kind: "processing", recoveryState: "processing", intent: input.intent };
    }
    if (input.response.status === 409) {
      return {
        kind: "recovery_required",
        recoveryState: "recovery_required",
        intent: await update(input.store, input.intent, {
          status: "recovery_required",
          failureCode: "IDEMPOTENCY_CONFLICT"
        }),
        reason: "fingerprint_mismatch"
      };
    }
    if (input.response.status === 402 || input.response.status === 500 && data.saveOperation?.status === "failed_final") {
      const code = input.response.status === 402 ? "ACORN_INSUFFICIENT" : "SERVER_FAILED_FINAL";
      return {
        kind: "failed_final",
        recoveryState: "failed_final",
        intent: await update(input.store, input.intent, {
          status: "failed_final",
          failureCode: code,
          completedAt: (/* @__PURE__ */ new Date()).toISOString()
        }),
        code
      };
    }
    return {
      kind: "recovery_required",
      recoveryState: "recovery_required",
      intent: input.intent,
      reason: "ambiguous_response"
    };
  }
  function failClosedPayload(intent, reason) {
    return {
      kind: "recovery_required",
      recoveryState: "recovery_required",
      intent,
      reason
    };
  }
  async function replayExactStoredPayload(input) {
    const loaded = await input.store.loadExactPayloadBySaveOperationId(input.intent.saveOperationId);
    if (loaded.kind === "missing") {
      const intent = await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "PAYLOAD_UNAVAILABLE"
      });
      return failClosedPayload(intent, "PAYLOAD_UNAVAILABLE");
    }
    if (loaded.kind === "corrupt") {
      const intent = await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "PAYLOAD_UNAVAILABLE"
      });
      return failClosedPayload(intent, "payload_corrupt");
    }
    if (loaded.kind === "fingerprint_mismatch") {
      const intent = await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "IDEMPOTENCY_CONFLICT"
      });
      return failClosedPayload(intent, "fingerprint_mismatch");
    }
    const requestJson = loaded.payload.requestJson;
    const jsonId = saveOperationIdFromRequestJson(requestJson);
    if (jsonId !== input.intent.saveOperationId) {
      const intent = await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "PAYLOAD_UNAVAILABLE"
      });
      return failClosedPayload(intent, "save_operation_id_mismatch");
    }
    const recanon = canonicalizeExactJournalSavePayload({
      saveOperationId: input.intent.saveOperationId,
      payload: loaded.request
    });
    if (!recanon.ok) {
      const intent = await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "PAYLOAD_UNAVAILABLE"
      });
      return failClosedPayload(intent, "payload_immutable_mismatch");
    }
    if (recanon.requestFingerprint !== input.intent.requestFingerprint) {
      const intent = await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "IDEMPOTENCY_CONFLICT"
      });
      return failClosedPayload(intent, "fingerprint_mismatch");
    }
    if (recanon.requestJson !== requestJson) {
      const intent = await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "PAYLOAD_UNAVAILABLE"
      });
      return failClosedPayload(intent, "payload_immutable_mismatch");
    }
    const awaiting = await update(input.store, input.intent, {
      status: "awaiting_result",
      lastAttemptAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      const response = await postStoredRequestJson(input.deps, requestJson);
      return applyPostedProtocolResponse({
        store: input.store,
        intent: awaiting,
        response,
        afterServerCompleted: input.afterServerCompleted
      });
    } catch {
      return { kind: "pending", recoveryState: "pending", intent: awaiting };
    }
  }
  async function recoverJournalCreateSaves(input, deps = productionDeps) {
    const effectiveDeps = resolveDeps(input.viewerEmail, deps);
    const bootstrap = await effectiveDeps.bootstrap();
    const actorKey = normalizeClientActorKey(input.viewerEmail);
    if (bootstrap.status !== "ready" || !actorKey) return [];
    if (isSaveIntentActivityBlockedForActor(actorKey)) return [];
    if (await resumeAccountDeleteSaveIntentCleanup(actorKey, bootstrap.store)) return [];
    await retryCompletedPayloadCleanup(bootstrap.store, actorKey);
    const recovered = [];
    const replayedThisCycle = /* @__PURE__ */ new Set();
    for (let intent of await bootstrap.store.listRecoverableByActor(actorKey)) {
      if (intent.actorKey !== actorKey) {
        recovered.push({
          kind: "recovery_required",
          recoveryState: "recovery_required",
          intent,
          reason: "actor_mismatch"
        });
        continue;
      }
      if (intent.status === "server_completed" && intent.serverEntryId) {
        const entryId = intent.serverEntryId;
        try {
          await input.afterServerCompleted?.(entryId);
          intent = await update(bootstrap.store, intent, {
            status: "completed",
            completedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          await cleanupPayloadAfterCompleted(bootstrap.store, intent);
          recovered.push({
            kind: "completed",
            recoveryState: "completed",
            entryId,
            data: {},
            intent
          });
        } catch {
          recovered.push({
            kind: "recovery_required",
            recoveryState: "recovery_required",
            intent,
            reason: "local_post_save_failed"
          });
        }
        continue;
      }
      let response;
      try {
        response = await effectiveDeps.lookup({
          saveOperationId: intent.saveOperationId,
          requestFingerprint: intent.requestFingerprint
        });
      } catch {
        recovered.push({
          kind: "recovery_required",
          recoveryState: "recovery_required",
          intent,
          reason: "lookup_unavailable"
        });
        continue;
      }
      const lookup = await responseJson(response);
      switch (lookup.state) {
        case "completed": {
          const entryId = typeof lookup.entryId === "string" ? lookup.entryId : "";
          if (!entryId) {
            recovered.push({
              kind: "recovery_required",
              recoveryState: "recovery_required",
              intent,
              reason: "invalid_lookup_completed"
            });
            continue;
          }
          intent = await update(bootstrap.store, intent, {
            status: "server_completed",
            serverEntryId: entryId
          });
          try {
            await input.afterServerCompleted?.(entryId);
            intent = await update(bootstrap.store, intent, {
              status: "completed",
              completedAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            await cleanupPayloadAfterCompleted(bootstrap.store, intent);
            recovered.push({
              kind: "completed",
              recoveryState: "completed",
              entryId,
              data: {},
              intent
            });
          } catch {
            recovered.push({
              kind: "recovery_required",
              recoveryState: "recovery_required",
              intent,
              reason: "local_post_save_failed"
            });
          }
          continue;
        }
        case "processing":
          recovered.push({ kind: "processing", recoveryState: "processing", intent });
          continue;
        case "failed_final":
          intent = await update(bootstrap.store, intent, {
            status: "failed_final",
            failureCode: "SERVER_FAILED_FINAL",
            completedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
          recovered.push({
            kind: "failed_final",
            recoveryState: "failed_final",
            intent,
            code: "SERVER_FAILED_FINAL"
          });
          continue;
        case "fingerprint_mismatch":
          intent = await update(bootstrap.store, intent, {
            status: "recovery_required",
            failureCode: "IDEMPOTENCY_CONFLICT"
          });
          recovered.push({
            kind: "recovery_required",
            recoveryState: "recovery_required",
            intent,
            reason: "fingerprint_mismatch"
          });
          continue;
        case "not_found":
          break;
        default:
          recovered.push({
            kind: "recovery_required",
            recoveryState: "recovery_required",
            intent,
            reason: "invalid_lookup_response"
          });
          continue;
      }
      if (!isDurableStore(bootstrap.store)) {
        intent = await update(bootstrap.store, intent, {
          status: "recovery_required",
          failureCode: "PAYLOAD_UNAVAILABLE"
        });
        recovered.push(failClosedPayload(intent, "PAYLOAD_UNAVAILABLE"));
        continue;
      }
      if (replayedThisCycle.has(intent.saveOperationId)) {
        recovered.push({ kind: "pending", recoveryState: "pending", intent });
        continue;
      }
      if (!claimForegroundExactReplay(actorKey, intent.saveOperationId)) {
        recovered.push({ kind: "pending", recoveryState: "pending", intent });
        continue;
      }
      replayedThisCycle.add(intent.saveOperationId);
      recovered.push(
        await replayExactStoredPayload({
          store: bootstrap.store,
          intent,
          deps: effectiveDeps,
          afterServerCompleted: input.afterServerCompleted
        })
      );
    }
    return recovered;
  }

  // src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/controller.ts
  function requireOperations(gate) {
    const result = evaluateAi7DeviceRecoveryHarnessGate({
      isNativePlatform: true,
      ...gate
    });
    if (!result.operationsAllowed) {
      return result;
    }
    return result;
  }
  function isDurableStore2(store) {
    return typeof store.persistPreparedIntentWithExactPayload === "function" && typeof store.loadExactPayloadBySaveOperationId === "function";
  }
  function newIntentId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return `intent_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  function isAi7DeviceRecoveryTestActor(actorKey) {
    return normalizeClientActorKey(actorKey) === AI7_DEVICE_RECOVERY_TEST_ACTOR;
  }
  function operationIdFor(kind) {
    return kind === "photo" ? AI7_PHOTO_SAVE_OPERATION_ID : AI7_TEXT_SAVE_OPERATION_ID;
  }
  function payloadFor(kind) {
    return kind === "photo" ? ai7PhotoTestPayload() : ai7TextTestPayload();
  }
  async function persistAi7DeviceRecoveryTestOperation(kind, deps) {
    const gate = requireOperations(deps.gate);
    if (!gate.operationsAllowed) {
      return { kind: "unavailable", reason: gate.reason };
    }
    if (!isDurableStore2(deps.store)) {
      return { kind: "rejected", reason: "store_not_durable" };
    }
    const saveOperationId = operationIdFor(kind);
    const payload = payloadFor(kind);
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId,
      payload
    });
    if (!canonical.ok) {
      return { kind: "rejected", reason: `payload_rejected:${canonical.code}` };
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const prepared = {
      intentId: newIntentId(),
      saveOperationId,
      actorKey: AI7_DEVICE_RECOVERY_TEST_ACTOR,
      draftRef: AI7_TEST_DRAFT_REF,
      requestFingerprint: canonical.requestFingerprint,
      status: "prepared",
      serverEntryId: null,
      failureCode: null,
      createdAt: now,
      updatedAt: now,
      lastAttemptAt: null,
      completedAt: null
    };
    const persisted = await deps.store.persistPreparedIntentWithExactPayload({
      intent: prepared,
      payload
    });
    if (persisted.kind !== "created" && persisted.kind !== "already_exists") {
      return { kind: "rejected", reason: persisted.kind };
    }
    let intent = persisted.intent;
    if (intent.status === "prepared") {
      intent = await deps.store.update({
        ...intent,
        status: "awaiting_result",
        lastAttemptAt: now,
        updatedAt: now
      });
    }
    return { kind: "persisted", harnessKind: kind, status: intent.status };
  }
  async function inspectAi7DeviceRecoveryTestOperations(deps) {
    const gate = requireOperations(deps.gate);
    if (!gate.operationsAllowed) {
      return { kind: "unavailable", reason: gate.reason };
    }
    const operations = [];
    for (const kind of ["text", "photo"]) {
      const saveOperationId = operationIdFor(kind);
      const intent = await deps.store.findByActorAndSaveOperationId(
        AI7_DEVICE_RECOVERY_TEST_ACTOR,
        saveOperationId
      );
      if (!intent) {
        operations.push({
          kind,
          present: false,
          status: "absent",
          payloadPresent: false,
          fingerprintVerified: false,
          payloadExact: false,
          pending: false,
          completed: false
        });
        continue;
      }
      const loaded = await deps.store.loadExactPayloadBySaveOperationId(saveOperationId);
      const payloadPresent = loaded.kind === "ok";
      const fingerprintVerified = loaded.kind === "ok" && loaded.payload.requestFingerprint === intent.requestFingerprint;
      const payloadExact = loaded.kind === "ok" && loaded.request.saveOperationId === saveOperationId && loaded.payload.requestJson.length > 0;
      operations.push({
        kind,
        present: true,
        status: intent.status,
        payloadPresent,
        fingerprintVerified,
        payloadExact,
        pending: intent.status === "prepared" || intent.status === "awaiting_result" || intent.status === "server_completed" || intent.status === "recovery_required",
        completed: intent.status === "completed"
      });
    }
    return {
      pendingTestOperationExists: operations.some((row) => row.pending),
      operations
    };
  }
  async function recoverAi7DeviceRecoveryTestOperations(deps) {
    const gate = requireOperations(deps.gate);
    if (!gate.operationsAllowed) {
      return { kind: "unavailable", reason: gate.reason };
    }
    const orchestratorDeps = createAi7FakeOrchestratorDeps(
      async () => ({ status: "ready", store: deps.store }),
      deps.fake
    );
    const results = await recoverJournalCreateSaves(
      { viewerEmail: AI7_DEVICE_RECOVERY_TEST_ACTOR },
      orchestratorDeps
    );
    return {
      kind: "recovered",
      results,
      postCalls: orchestratorDeps.fake.postCalls,
      lookupCalls: orchestratorDeps.fake.lookupCalls
    };
  }
  async function cleanupAi7DeviceRecoveryTestOperations(deps) {
    const gate = requireOperations(deps.gate);
    if (!gate.operationsAllowed) {
      return { kind: "unavailable", reason: gate.reason };
    }
    const requested = normalizeClientActorKey(
      deps.actorKey ?? AI7_DEVICE_RECOVERY_TEST_ACTOR
    );
    if (!isAi7DeviceRecoveryTestActor(requested)) {
      return { kind: "rejected", reason: "actor_not_test_namespace" };
    }
    const deletedIntentCount = await deps.store.deleteByActor(AI7_DEVICE_RECOVERY_TEST_ACTOR);
    clearCurrentSessionJournalCreatePayloadsForTest();
    return { kind: "cleaned", deletedIntentCount };
  }

  // src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/deviceUi.ts
  function $(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing #${id}`);
    return el;
  }
  function asDurable(store) {
    if (store && typeof store === "object" && "persistPreparedIntentWithExactPayload" in store) {
      return store;
    }
    return null;
  }
  function formatInspect(snapshot) {
    const pending = snapshot.pendingTestOperationExists ? "yes" : "no";
    const lines = snapshot.operations.map((row) => {
      return [
        row.kind,
        `status=${row.status}`,
        row.pending ? "pending" : null,
        row.completed ? "completed" : null,
        row.payloadPresent ? "payload_present" : "payload_absent",
        row.fingerprintVerified ? "fingerprint_verified" : "fingerprint_unverified",
        row.payloadExact ? "payload_exact" : "payload_not_exact"
      ].filter(Boolean).join(" ");
    });
    return `pending test operation exists: ${pending}
${lines.join("\n")}`;
  }
  async function boot() {
    const native = Capacitor.isNativePlatform();
    const gate = evaluateAi7DeviceRecoveryHarnessGate({ isNativePlatform: native });
    $("platform").textContent = `platform=${Capacitor.getPlatform()} native=${String(native)} gate=${gate.reason}`;
    const setStatus = (text, isError = false) => {
      const el = $("status");
      el.textContent = text;
      el.className = isError ? "status err" : "status ok";
    };
    if (!gate.pageAllowed) {
      setStatus("harness unavailable", true);
      return;
    }
    if (!gate.operationsAllowed) {
      setStatus(`operations unavailable: ${gate.reason}`, true);
      return;
    }
    const storeFromBootstrap = async () => {
      const bootstrap = await initializeSaveIntentStore();
      if (bootstrap.status !== "ready") {
        throw new Error(`store:${bootstrap.status}`);
      }
      const store = asDurable(bootstrap.store);
      if (!store) throw new Error("store_not_durable");
      return store;
    };
    const refresh = async () => {
      const snapshot = await inspectAi7DeviceRecoveryTestOperations({
        store: await storeFromBootstrap()
      });
      if ("kind" in snapshot && snapshot.kind === "unavailable") {
        setStatus(`unavailable:${snapshot.reason}`, true);
        return;
      }
      $("inspect").textContent = formatInspect(snapshot);
      const view = snapshot;
      setStatus(
        view.pendingTestOperationExists ? "pending test operation exists" : view.operations.some((row) => row.completed) ? "completed" : "no test operation"
      );
    };
    $("btn-text").addEventListener("click", () => {
      void (async () => {
        const result = await persistAi7DeviceRecoveryTestOperation("text", {
          store: await storeFromBootstrap()
        });
        setStatus(JSON.stringify(result), result.kind !== "persisted");
        await refresh();
      })().catch((error) => setStatus(String(error), true));
    });
    $("btn-photo").addEventListener("click", () => {
      void (async () => {
        const result = await persistAi7DeviceRecoveryTestOperation("photo", {
          store: await storeFromBootstrap()
        });
        setStatus(JSON.stringify(result), result.kind !== "persisted");
        await refresh();
      })().catch((error) => setStatus(String(error), true));
    });
    $("btn-inspect").addEventListener("click", () => {
      void refresh().catch((error) => setStatus(String(error), true));
    });
    $("btn-recover").addEventListener("click", () => {
      void (async () => {
        const result = await recoverAi7DeviceRecoveryTestOperations({
          store: await storeFromBootstrap()
        });
        if (result.kind === "recovered") {
          setStatus(
            `fake_recover posts=${result.postCalls} lookups=${result.lookupCalls}`
          );
        } else {
          setStatus(JSON.stringify(result), true);
        }
        await refresh();
      })().catch((error) => setStatus(String(error), true));
    });
    $("btn-cleanup").addEventListener("click", () => {
      void (async () => {
        const result = await cleanupAi7DeviceRecoveryTestOperations({
          store: await storeFromBootstrap()
        });
        setStatus(JSON.stringify(result), result.kind !== "cleaned");
        await refresh();
      })().catch((error) => setStatus(String(error), true));
    });
    await refresh();
  }
  void boot();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
