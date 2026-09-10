import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

// Advisory only: physical TVs and machines without local AVDs are supported.
const androidHome = process.env.ANDROID_USER_HOME || join(homedir(), '.android');
const avdHome = process.env.ANDROID_AVD_HOME || join(androidHome, 'avd');
const parseIni = (text) => Object.fromEntries(
  text.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([^#;=]+?)\s*=\s*(.*?)\s*$/);
    return match ? [[match[1], match[2]]] : [];
  }),
);

try {
  const configs = new Set();
  for (const entry of readdirSync(avdHome, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.endsWith('.avd')) {
      configs.add(join(avdHome, entry.name, 'config.ini'));
    } else if (entry.isFile() && entry.name.endsWith('.ini')) {
      try {
        const metadata = parseIni(readFileSync(join(avdHome, entry.name), 'utf8'));
        const directory = metadata.path || (metadata['path.rel'] && resolve(androidHome, metadata['path.rel']));
        if (directory && isAbsolute(directory)) configs.add(join(directory, 'config.ini'));
      } catch (error) {
        console.warn(`[TV readiness] Cannot read ${entry.name}: ${error.message}`);
      }
    }
  }

  let count = 0;
  for (const file of configs) {
    try {
      const config = parseIni(readFileSync(file, 'utf8'));
      if (config['tag.id'] !== 'android-tv' && !config['tag.id']?.startsWith('google-tv')) continue;
      count++;
      if (config['hw.keyboard'] === 'yes') {
        console.log(`[TV readiness] OK: ${file} has hw.keyboard=yes.`);
      } else {
        console.warn(`[TV readiness] WARNING: ${file} has hw.keyboard=${config['hw.keyboard'] ?? '(unset)'}.`);
        console.warn('Toolbar Home/Back may not reach Android. Stop this emulator, set hw.keyboard=yes, then cold boot it. No data wipe is needed.');
      }
    } catch (error) {
      console.warn(`[TV readiness] Cannot inspect ${file}: ${error.message}`);
    }
  }
  if (!count) console.log('[TV readiness] No local TV AVD configuration found; emulator readiness is unverified. Physical TVs do not need this setting.');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('[TV readiness] No local AVD directory found; skipping emulator check (physical TVs are supported).');
  } else {
    console.warn(`[TV readiness] Cannot inspect ${avdHome}: ${error.message}`);
  }
}
