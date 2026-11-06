// Offline contract checks: real payload/API utilities with mocked fetch; no server.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function compile(relative) {
  return ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  }).outputText;
}
const http = moduleUrl(compile('src/shared/api/http.ts'));
const zod = pathToFileURL(path.join(root, 'node_modules/zod/index.js')).href;
function api(relative, httpSpecifier) {
  return moduleUrl(compile(relative).replace(`from '${httpSpecifier}'`, `from '${http}'`).replace("from 'zod'", `from '${zod}'`));
}
const { activityPayload } = await import(moduleUrl(compile('src/features/admin/validation/activity.validation.ts')));
const { adminApi } = await import(api('src/features/admin/api/admin.api.ts', '../../../shared/api/http'));
const { activityFormTemplateApi } = await import(api('src/shared/activity-forms/activity-form-template.api.ts', '../api/http'));
const form = {
  name: ' Workshop ', activityType: 'Workshop', startAt: '2027-01-10T09:00', endAt: '2027-01-10T12:00',
  location: 'Venue', institution: 'Institution', description: 'Description', points: '5',
  specialistId: '2', latitude: '33.1234567', longitude: '',
};
const fields = [
  { name: 'note', label: 'Note', type: 'text', required: true },
  { name: 'details', label: 'Details', type: 'textarea', required: false },
  { name: 'count', label: 'Count', type: 'number', required: true },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'mode', label: 'Mode', type: 'select', required: true, options: ['Online', 'On site'] },
  { name: 'confirmed', label: 'Confirmed', type: 'checkbox', required: true },
  { name: 'optional', label: 'Optional', type: 'checkbox', required: false },
];
const template = { id: '1', templateKey: 'shared-activity', version: 2, supervisorId: '1', formName: 'Shared Activity Form', fieldsSchema: { fields }, createdAt: '2026-11-01T00:00:00Z', updatedAt: '2026-11-01T00:00:00Z' };
const options = [{ id: '2', name: 'Specialty' }];
const values = { note: 'Note', details: '', count: '0', date: '2028-02-29', mode: 'Online', confirmed: true, optional: false, removed_old_key: 'Must not be sent' };
const payload = activityPayload(form, template, values, options);
assert.equal(payload.name, 'Workshop');
assert.equal(payload.expectedFormVersion, 2);
assert.equal(payload.latitude, 33.1234567);
assert.equal(payload.longitude, null);
assert.equal(payload.customFields.count, 0);
assert.equal(payload.customFields.optional, false);
assert.ok(!('details' in payload.customFields));
assert.ok(!('removed_old_key' in payload.customFields));
assert.ok(!('formSchemaSnapshot' in payload));
assert.ok(!('formConfigId' in payload));
assert.ok(payload.startAt.endsWith('Z'));
for (const changes of [{ points: '-1' }, { points: '2147483648' }, { specialistId: 'missing' }, { name: ' ' }, { latitude: '91' }, { latitude: '1.12345678' }, { endAt: form.startAt }]) assert.throws(() => activityPayload({ ...form, ...changes }, template, values, options));
for (const changes of [{ confirmed: false }, { date: '2027-02-29' }, { mode: 'Unknown' }, { count: 'Infinity' }, { note: '' }]) assert.throws(() => activityPayload(form, template, { ...values, ...changes }, options));
assert.deepEqual(activityPayload(form, { ...template, fieldsSchema: { fields: [] } }, {}, options).customFields, {});
let calls = [];
globalThis.fetch = async (url, init) => {
  calls.push({ url, init });
  const body = url === '/specialists' ? options : url === '/activity-form-template' ? template : { id: '50', ...payload };
  return new Response(JSON.stringify(body), { status: url === '/activities' && init.method === 'POST' ? 201 : 200 });
};
assert.equal((await activityFormTemplateApi.get()).version, 2);
assert.deepEqual(await adminApi.specialists(), options);
assert.equal((await adminApi.createActivity(payload)).id, '50');
const call = calls.at(-1);
assert.equal(call.url, '/activities');
assert.equal(call.init.credentials, 'include');
assert.equal(call.init.method, 'POST');
assert.deepEqual(JSON.parse(call.init.body), payload);
for (const status of [400,401,403,404,409,503]) {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Failure' }), { status });
  await assert.rejects(adminApi.createActivity(payload), (error) => error.status === status);
}
globalThis.fetch = async () => new Response('{}');
await assert.rejects(activityFormTemplateApi.get());
await assert.rejects(adminApi.specialists());
console.log('PASS: Activity payload validation, six field types, zero/false values, cookie-authenticated GET/POST, version payload, error propagation, malformed response rejection. No network/database access.');
