import { registerPlugin } from '@capacitor/core';
const LjdLocalSecurity = registerPlugin('LjdLocalSecurity', {
    web: () => import('./web').then((m) => new m.LjdLocalSecurityWeb()),
});
export { LjdLocalSecurity };
