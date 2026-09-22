import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthRedirectUrl } from '../src/services/authRedirectService.js';
import { consumeAuthCallback, isAuthCallbackUrl } from '../src/services/authCallbackService.js';
const native = { native: true };
const web = { origin: 'https://farm.example' };
const success = { data: { session: { user: { id: 'test' } } }, error: null };
const client = (result = success) => ({ auth: {
  exchangeCodeForSession: async code => { assert.equal(code, 'test-code'); return result; },
  setSession: async tokens => { assert.deepEqual(tokens, { access_token: 'access', refresh_token: 'refresh' }); return result; },
} });
for (const flow of ['confirmation', 'recovery', 'oauth']) {
  test('native redirect ' + flow, () => assert.equal(getAuthRedirectUrl(flow, {native:true}), 'meuagro://auth/' + (flow === 'recovery' ? 'recovery' : 'callback')));
  test('web redirect ' + flow, () => assert.equal(getAuthRedirectUrl(flow, {native:false, origin:web.origin}), web.origin + '/auth/' + (flow === 'recovery' ? 'recovery' : 'callback')));
}
test('production rejects localhost', () => assert.throws(() => getAuthRedirectUrl('recovery', {native:false, origin:'https://localhost', development:false})));
test('production rejects HTTP', () => assert.throws(() => getAuthRedirectUrl('recovery', {native:false, origin:'http://farm.example', development:false})));
test('explicit public URL replaces local origin', () => assert.equal(getAuthRedirectUrl('recovery', {native:false, origin:'http://localhost', webUrl:web.origin}), web.origin+'/auth/recovery'));
test('development keeps local web usable', () => assert.equal(getAuthRedirectUrl('recovery', {native:false, origin:'http://localhost:5173', development:true}), 'http://localhost:5173/auth/recovery'));
for (const value of ['meuagro://auth.evil/callback', 'meuagro://auth@evil/callback', 'meuagro://auth:42/callback', 'meuagro://auth/other', 'https://auth/callback', 'invalid']) {
  test('reject invalid native URL ' + value, () => assert.equal(isAuthCallbackUrl(value,native),false));
}
test('reject foreign web origin', () => assert.equal(isAuthCallbackUrl('https://evil.example/auth/callback',web),false));
for (const [url, options, route] of [
  ['meuagro://auth/callback',native,'/dashboard'],
  ['meuagro://auth/recovery',native,'/reset-password'],
  ['meuagro://auth/reset-password',native,'/reset-password'],
  ['meuagro://auth/login?confirmed=1',native,'/dashboard'],
  [web.origin+'/auth/callback',web,'/dashboard'],
  [web.origin+'/auth/recovery',web,'/reset-password'],
  [web.origin+'/reset-password',web,'/reset-password'],
]) {
  test('token callback ' + url, async () => assert.equal(await consumeAuthCallback(url+'#access_token=access&refresh_token=refresh',client(),options),route));
  test('code callback ' + url, async () => assert.equal(await consumeAuthCallback(url+(url.includes('?')?'&':'?')+'code=test-code',client(),options),route));
}
test('recovery type on shared callback', async () => assert.equal(await consumeAuthCallback('meuagro://auth/callback#access_token=access&refresh_token=refresh&type=recovery',client(),native),'/reset-password'));
test('SDK recovery type on code callback', async () => assert.equal(await consumeAuthCallback('meuagro://auth/callback?code=test-code',client({data:{...success.data,redirectType:'recovery'}}),native),'/reset-password'));
for(const suffix of ['', '#access_token=access', '?error=access_denied', '#error_description=expired%25']) {
  test('incomplete/expired callback '+suffix, async () => assert.rejects(consumeAuthCallback('meuagro://auth/recovery'+suffix,client(),native)));
}
test('failed exchange never navigates to reset', async () => assert.rejects(consumeAuthCallback('meuagro://auth/recovery?code=test-code',client({error:new Error('expired')}),native)));
test('missing session is rejected', async () => assert.rejects(consumeAuthCallback('meuagro://auth/recovery?code=test-code',client({data:{session:null}}),native)));
