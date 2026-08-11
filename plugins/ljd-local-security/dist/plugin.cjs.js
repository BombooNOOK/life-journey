'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const core_1 = require('@capacitor/core');
const LjdLocalSecurity = core_1.registerPlugin('LjdLocalSecurity', {
  web: () => Promise.resolve().then(() => require('./esm/web')).then((m) => new m.LjdLocalSecurityWeb()),
});
exports.LjdLocalSecurity = LjdLocalSecurity;
