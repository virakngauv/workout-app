import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const pkg = readJson('package.json');
const app = readJson('app.json').expo;
const eas = readJson('eas.json');

test('the app uses the TV fork, Router, and a consistent npm lockfile', () => {
  assert.equal(pkg.private, true);
  assert.equal(pkg.main, 'expo-router/entry');
  assert.match(pkg.dependencies['react-native'], /^npm:react-native-tvos@/);
  const lock = readJson('package-lock.json');
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies);
  assert.equal(lock.packages['node_modules/react-native'].name, 'react-native-tvos');
  assert.equal(readJson('tsconfig.json').compilerOptions.strict, true);
});

test('TV configuration does not require television hardware for mobile builds', () => {
  const tvPlugin = app.plugins.find((plugin) =>
    Array.isArray(plugin) && plugin[0] === '@react-native-tvos/config-tv',
  );
  assert.ok(tvPlugin, 'TV config plugin must be configured');
  assert.equal(tvPlugin[1].androidTVRequired, false);
  assert.notEqual(tvPlugin[1].isTV, true, 'TV mode must remain environment-driven');
  assert.deepEqual(app.platforms, ['android', 'ios', 'web']);
  const banner = readFileSync(tvPlugin[1].androidTVBanner);
  assert.equal(banner.subarray(1, 4).toString(), 'PNG');
  assert.equal(banner.readUInt32BE(16), 320);
  assert.equal(banner.readUInt32BE(20), 180);
});

test('TV/mobile scripts and APK profiles select their targets explicitly', () => {
  for (const suffix of ['tv', 'mobile']) {
    const expected = suffix === 'tv' ? '1' : '0';
    for (const prefix of ['start', 'android', 'prebuild']) {
      assert.ok(pkg.scripts[`${prefix}:${suffix}`].includes(`EXPO_TV=${expected}`));
    }
    assert.ok(pkg.scripts[`start:${suffix}`].includes('--dev-client'));
    assert.ok(pkg.scripts[`prebuild:${suffix}`].includes('--clean'));
  }
  assert.equal(eas.build.development.developmentClient, true);
  assert.equal(eas.build.preview.android.buildType, 'apk');
  assert.equal(eas.build.preview.developmentClient, undefined);
  assert.equal(eas.build.preview.env.EXPO_TV, '0');
  assert.equal(eas.build.preview_tv.extends, 'preview');
  assert.equal(eas.build.preview_tv.env.EXPO_TV, '1');
  assert.equal(eas.build.development_tv.extends, 'development');
  assert.equal(eas.build.development_tv.env.EXPO_TV, '1');
});

test('gitignore protects local output/secrets without hiding source or the lockfile', () => {
  const ignored = [
    'node_modules/example/index.js', '.expo/devices.json', 'expo-env.d.ts',
    'android/app/build.gradle', 'ios/Podfile', 'dist/index.html',
    '.env', '.env.local', '.env.production', 'credentials.json',
    'release.jks', 'release.keystore', 'signing.p8', 'app.apk',
  ];
  const tracked = [
    'package-lock.json', 'package.json', 'README.md', 'AGENTS.md', 'app.json',
    'src/app/index.tsx', 'assets/tv-banner.png', '.env.example', '.env.production.example',
  ];
  const result = spawnSync('git', ['check-ignore', '--no-index', '--stdin'], {
    input: [...ignored, ...tracked].join('\n') + '\n',
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.deepEqual(result.stdout.trim().split('\n').sort(), ignored.sort());
});
