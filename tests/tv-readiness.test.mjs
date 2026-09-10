import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

test('TV readiness warns for disabled TV keyboards and ignores phone AVDs', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'tv-readiness-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, tag, keyboard] of [
    ['broken', 'android-tv', 'no'], ['ready', 'google-tv', 'yes'], ['phone', 'google_apis', 'no'],
  ]) {
    const dir = join(root, `${name}.avd`);
    mkdirSync(dir);
    writeFileSync(join(dir, 'config.ini'), `tag.id = ${tag}\r\nhw.keyboard = ${keyboard}\r\n`);
  }
  const result = spawnSync(process.execPath, ['scripts/check-tv-emulator.mjs'], {
    env: { ...process.env, ANDROID_AVD_HOME: root }, encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /broken\.avd.*hw.keyboard=no/);
  assert.match(result.stdout, /OK:.*ready\.avd/);
  assert.doesNotMatch(result.stdout + result.stderr, /phone\.avd/);
});

test('TV readiness follows relocated AVD metadata and flags an unspecified keyboard', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'tv-readiness-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'avd'));
  mkdirSync(join(root, 'relocated'));
  writeFileSync(join(root, 'avd', 'tv.ini'), 'path.rel=relocated\n');
  writeFileSync(join(root, 'relocated', 'config.ini'), 'tag.id=android-tv\n');
  const result = spawnSync(process.execPath, [resolve('scripts/check-tv-emulator.mjs')], {
    env: { ...process.env, ANDROID_AVD_HOME: '', ANDROID_USER_HOME: root }, encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stderr, /relocated.*hw.keyboard=\(unset\)/);
});

test('TV readiness permits machines without local emulators', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'tv-readiness-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, ['scripts/check-tv-emulator.mjs'], {
    env: { ...process.env, ANDROID_AVD_HOME: join(root, 'missing') }, encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /skipping emulator check/);
});
