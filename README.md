# GetFit

An **Android TV-first** workout interface using **Expo, TypeScript, React Native TV, and Expo Router**. Android/iOS phone compatibility is retained, with a web preview for development.

**Status:** the selected peach design is in progress. The app includes an energy selector, a four-week schedule, routines A/B/C, set completion, rest countdown, pause/resume, and a completion screen. All 15 user-supplied exercise illustrations are integrated with movement-specific labels and form cues. Artwork depicts representative equipment variants; the session prescription specifies the planned load. Session state is in memory and resets when the app reloads. No accounts, backend, or workout-history storage are implemented. See `design/asset-prompts.md` and `design-qa.md` for remaining work.

## Stack

| Area | Choice |
| --- | --- |
| Runtime/tooling | Expo SDK 57 and a compatible React Native TV 0.86 release |
| UI runtime | `react-native` aliased to `react-native-tvos` |
| Language | Strict TypeScript |
| Routing | Expo Router, starting with one placeholder route |
| Native configuration | `@react-native-tvos/config-tv` and Expo prebuild |
| Local feedback | An installed development build plus Metro/Fast Refresh |
| Dependencies | npm and the committed `package-lock.json` |
| Checks | TypeScript, Expo ESLint configuration, Node scaffold tests, GitHub Actions |

This follows the dependency/configuration approach in the [official Expo TV guide](https://docs.expo.dev/guides/building-for-tv/) and [Router TV example](https://github.com/expo/examples/tree/master/with-router-tv), without their demo UI or app-feature dependencies. The [Router installation guide](https://docs.expo.dev/router/installation/) describes the routing dependencies.

The React Native TV fork is intentional. Do not replace it with upstream `react-native` to silence a dependency warning. Upgrade Expo and the TV fork together.

Reanimated 4.5.1 and Worklets 0.10.1 are pinned to Expo-compatible versions for Router's native peer dependency graph; no animation features are implemented. The targeted npm override `"react-native": "$react-native"` keeps transitive React Native requests on the same TV fork. This avoids installing an upstream runtime alongside it and does not disable peer checks globally. Keep this override when updating the compatible dependency set; do not use `--force` or `--legacy-peer-deps` as a general dependency fix.

## Prerequisites

Install **Node.js 24 LTS** (see `.nvmrc`), npm, and Git. For native Android development, install Android Studio, the Android SDK/Platform-Tools, the JDK required by the generated Android project, and an Android TV emulator image compatible with the generated app's minimum SDK. Set `ANDROID_HOME` and put the SDK's `platform-tools` on your PATH if your installation does not do that automatically. Follow [Expo's Android environment setup](https://docs.expo.dev/get-started/set-up-your-environment/).

For local iOS builds, use macOS with Xcode and its iOS simulator/toolchain. Windows users can use the included cross-platform npm scripts with a correctly configured Android toolchain; iOS native builds cannot run locally on Windows/Linux.

No Expo account, API keys, Google Play developer account, or backend is required for the local development loop. Optional EAS cloud builds have separate account/signing setup described below.

## Install

```sh
git clone https://github.com/virakngauv/workout-app.git
cd workout-app
# With fnm installed: fnm install && fnm use
# Alternatively, with nvm: nvm install && nvm use
node --version # Must be v24.x
npm ci
npm run check
```

Use `npm ci` for an existing checkout. Use `npm install` or `npx expo install <package>` deliberately when changing dependencies, and commit the resulting lockfile. Do not commit `node_modules/`.

The project declares Node 24 in `.nvmrc` and `package.json`. If you use fnm with zsh, add the following to `~/.zshrc` (replace any existing fnm initialization rather than duplicating it):

```sh
eval "$(fnm env --use-on-cd --shell zsh)"
```

Open a new terminal after changing shell configuration. fnm will select the version from `.nvmrc` when you enter the project directory; install it once with `fnm install` if needed. Verify with `node --version`. Non-interactive automation may not load shell hooks; use `fnm exec --using=24 npm run check` or explicitly select Node 24 in that environment. See the [fnm shell setup](https://github.com/Schniz/fnm#shell-setup).

## First Android TV run

Create/start an Android TV AVD in Android Studio's Device Manager. Then:

```sh
npm run prebuild:tv
npm run android:tv
```

`prebuild:tv` generates only the Android native project, enabling TV configuration. `android:tv` compiles, installs, launches the app, and starts Metro. The first native compilation is different from the normal edit/refresh loop.

With multiple emulators/devices connected:

```sh
npm run android:tv -- --device
```

**Use this custom development build, not Expo Go.** Expo Go is not the native TV runtime used by this project. See [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/) and the [TV guide](https://docs.expo.dev/guides/building-for-tv/).

### Emulator Home/Back readiness

Enable **hardware keyboard input** for each new or recreated TV AVD. Its `config.ini` must contain `hw.keyboard=yes`; keep the TV D-pad enabled. We observed toolbar Home/Back producing no hardware key events with `hw.keyboard=no`, even though `adb shell input keyevent` worked. Enabling the keyboard and restarting restored toolbar input.

```sh
npm run check:tv
```

This read-only, advisory check runs automatically before `npm run start:tv` and `npm run android:tv` (including their default aliases). It inspects local Android TV/Google TV AVDs and warns when keyboard input is disabled or unspecified. It uses `ANDROID_AVD_HOME`, or `ANDROID_USER_HOME/avd`, or the default `~/.android/avd`, and follows AVD metadata paths for relocated devices. It does not block physical-TV development, change emulator settings, or verify SDK/JDK installation. Direct Expo commands bypass the npm checks. Warnings for an unused AVD do not imply the selected device is broken.

If toolbar Home/Back do nothing:

1. Fully stop the affected emulator.
2. Open its `config.ini` (normally `~/.android/avd/<name>.avd/config.ini`) and set `hw.keyboard=yes`.
3. Cold boot the AVD from Device Manager, or run `emulator -avd <name> -no-snapshot-load`. Do not wipe its data.
4. Run `npm run check:tv`, then test the actual toolbar Home/Back buttons. A passing configuration check or working adb input alone does not prove toolbar input works.

The setting persists for that AVD. Check it again if you recreate the device. This is emulator configuration, so it belongs outside the generated project's `android/` directory.

## Daily development loop

After the app is installed, open it on the emulator/TV and run:

```sh
npm run start:tv
# Equivalent default: npm start
```

Edit `src/app/index.tsx` and save. Ordinary JavaScript/TypeScript component changes use [React Native Fast Refresh](https://reactnative.dev/docs/fast-refresh); they do not require a new APK. Some edits reset state or reload the app.

After changing native dependencies, permissions, app/plugin configuration, or launcher assets, regenerate and rebuild with `npm run prebuild:tv` followed by `npm run android:tv` (or the matching phone commands). A JavaScript reload alone does not apply native changes. Stop an old Metro process before changing targets. Use `npm run start:tv -- --clear` if Metro has stale cache state.

Browser preview is optional:

```sh
npm run web
```

A browser preview is not a TV focus/navigation test. Exercise the interface using D-pad directions, Select, and Back on an Android TV emulator and real device. The web preview also supports arrows, Enter, and Escape. Browser keyboard checks are not proof of native TV focus behavior.

## Use a physical TV

An APK needs an Android-compatible device. Confirm the actual operating system/model rather than assuming every Hisense TV runs Android. For this project, target a **Hisense running Google TV/Android TV**, or a **Chromecast with Google TV**. Do not assume a VIDAA/Roku television or a classic casting-only Chromecast can install this APK. Start with the emulator while hardware details are unconfirmed.

Enable developer options/debugging on the compatible device. The exact menus and available debugging modes depend on its firmware. Follow [Android's device/debugging instructions](https://developer.android.com/studio/run/device) and use the IP/ports the device actually exposes.

### Wi-Fi debugging on older Android TVs

Verified on a physical Hisense Android 10 TV: enabling **USB debugging** also exposed ADB over the local network, without a USB cable or a separate Wireless debugging menu. This is firmware-dependent; an Android 13 upgrade was not needed on the tested TV.

1. Put the TV and computer on the same trusted network, with the TV awake. Avoid guest-network/client isolation.
2. Open Settings → Device Preferences (or System) → About, then select Build seven times to enable developer options.
3. Open Developer options and enable **USB debugging**.
4. Find the TV's current IP address in Network settings or About → Status.
5. Try the following, replacing `TV_IP` with that address:

```sh
adb connect TV_IP:5555
adb devices
```

Accept **Allow USB debugging?** on the TV for your computer, even though the connection is wireless. `adb devices` should then show `device`, rather than `unauthorized`. If `adb` is not on your Mac's PATH, Android Studio's usual SDK location is `~/Library/Android/sdk/platform-tools/adb`.

Troubleshooting:

- **Failed to authenticate / unauthorized:** check for the authorization prompt on the TV. If none appears, toggle USB debugging off and on, then reconnect.
- **No route to host / timeout:** verify the IP, network, and that the TV is awake. On macOS, check Privacy & Security → Local Network for the terminal or app running ADB. A successful ping alone does not prove ADB access; try the connection from your normal Terminal and accept any permission prompts. This resolved access during the physical-device setup, though the exact cause was not established.
- **Connection refused:** the TV may not expose network ADB through USB debugging. Port 5555 is a firmware-dependent option, not a universal Android TV feature.

See [Google's Android TV debugging guide](https://developers.google.com/cast/docs/android_tv_receiver/debugging) for network ADB and [Android's ADB documentation](https://developer.android.com/tools/adb) for connection and authorization details.

### TVs with a Wireless debugging menu

For devices offering wireless pairing:

```sh
adb pair TV_IP:PAIRING_PORT
adb connect TV_IP:DEBUG_PORT
adb devices
npm run android:tv -- --device
```

Replace all placeholders. Pairing and connection ports can differ. Some TV firmware exposes legacy network ADB instead of pairing; others restrict debugging. Do not assume port 5555 or wireless pairing is universally available. Never connect two USB host ports with a USB-A-to-A cable.

The computer and TV must be able to communicate over your trusted LAN. If the development app cannot reach Metro, check the firewall/network and, once ADB is connected, try:

```sh
adb reverse tcp:8081 tcp:8081
```

ADB reverse requires a working ADB connection; it does not repair an unreachable device. Disable debugging when no longer needed, and do not expose ADB to the internet.

## Android phone and iOS development

The dependency is shared, but generated native projects are target-specific. **Always clean-prebuild when switching between TV and phone.** Setting `EXPO_TV` for a run command alone does not necessarily regenerate an existing native project.

Android phone:

```sh
npm run prebuild:mobile
npm run android:mobile
# Later sessions:
npm run start:mobile
```

Return to TV with `npm run prebuild:tv` followed by `npm run android:tv`.

iOS phone/simulator, on macOS:

```sh
npm run prebuild:ios
npm run ios:mobile
# Later sessions:
npm run start:mobile
```

Every script sets `EXPO_TV` explicitly, so an inherited shell setting does not silently turn a phone command into a TV command. `cross-env` makes this portable across supported shells.

**`--clean` deletes/regenerates the targeted native directory.** Treat `android/` and `ios/` as disposable output. Keep native customizations in app configuration/config plugins, not manual edits to generated files. See [Continuous Native Generation](https://docs.expo.dev/workflow/continuous-native-generation/).

## Validation

```sh
npm run check                 # strict types, lint, scaffold tests
npx expo install --check       # SDK dependency compatibility
npm run export:web            # production web bundle
npm run export:android        # production Android TV JS/assets bundle
npm run prebuild:tv -- --no-install
```

GitHub Actions performs these checks and verifies generated TV/mobile Android manifests. Its actions are pinned to commit SHAs. The workflow is read-only and does not publish, deploy, build signed releases, or provision cloud services.

**A Metro export is not an APK. A successful prebuild is not native compilation.** Native compilation, installation, real-remote behavior, and physical-device performance must be verified separately. iOS device testing and store readiness are not implied by these checks.

## Standalone APK / optional EAS

A development client uses Metro. For an app that launches without your computer, build a release/preview APK with JavaScript bundled inside it.

### Local standalone test APK

With the Android SDK and JDK configured, generate the TV target and compile locally:

```sh
npm run prebuild:tv -- --no-install
cd android
./gradlew assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk` relative to the repository root. The generated project's current release build uses its debug signing configuration: this is a standalone test APK, not a production-signed distribution. Prebuild replaces generated native files, so keep configuration in Expo config/plugins.

The first observed local build took **6 minutes 21 seconds**, as reported by Gradle, excluding installation. This is one measurement, not an estimate for every machine; dependency downloads, hardware, and build caches affect timing. The resulting APK was installed and launched successfully on a physical Android 10 TV with a 32-bit ARM processor. Home-screen rendering and initial focus were verified; a full physical-remote workout test remains outstanding.

From the repository root, install and launch it on an authorized TV:

```sh
adb -s TV_IP:5555 install -r android/app/build/outputs/apk/release/app-release.apk
adb -s TV_IP:5555 shell am start -n com.virakngauv.workoutapp/.MainActivity
```

Use the actual device address/port reported by `adb devices`. This build includes the JavaScript and artwork and runs without Metro or the computer remaining online.

### Optional EAS builds

`eas.json` provides these optional profiles:

| Profile | Target | Purpose |
| --- | --- | --- |
| `development_tv` | Android TV | Custom development client; Metro-based loop |
| `preview_tv` | Android TV | Standalone internal-distribution APK |
| `development` | Phone | Custom development client |
| `preview` | Android phone | Standalone internal-distribution APK |

After explicitly choosing to use EAS, sign into your own Expo account, link/create the EAS project, and configure credentials following [EAS APK build documentation](https://docs.expo.dev/build-reference/apk/). Then run, for example:

```sh
npx eas-cli build --platform android --profile preview_tv
```

Cloud build access is subject to Expo's plan/quotas. No EAS project ID, account association, signing material, or publishing configuration has been created by this scaffold. A Google Play publishing account is not part of this local-development setup. Local release signing is also possible via the generated Android project; keep its keystore safe and out of Git.

Install/update a resulting APK on a connected compatible device:

```sh
adb install -r /path/to/workout-app.apk
```

An update requires the same application ID and compatible signing key. Switching from a debug-signed build to a differently signed release can require uninstalling the old app, which removes its local data. Preserve signing keys for future updates.

## Repository layout and conventions

```text
src/app/_layout.tsx         Minimal Router root
src/app/index.tsx           Home, weekly plan, and session screens
src/workout/               Source plan, energy presets, session logic, form cues
src/components/            Shared remote-friendly button
assets/fonts/              Bundled Baloo 2 / Nunito fonts and OFL licenses
design/                    Selected visual target, asset prompts, QA evidence
assets/tv-banner.png        Disposable 320 x 180 development banner
app.json                   App identity and config plugins
metro.config.js            Expo defaults; no custom resolver yet
eas.json                   Optional development/preview build profiles
tests/scaffold.test.mjs     Configuration and gitignore safeguards
.github/workflows/ci.yml    Read-only validation
AGENTS.md                  Codex/Z.ai/contributor guardrails
```

`com.virakngauv.workoutapp`, the app name, and the banner are development placeholders; review identity/signing before distributing broadly. The scaffold does not select a license, production brand, backend, authentication system, analytics, media stack, or component library. Apple TV is not a configured/tested target in this scaffold.

Workout data and session behavior live under `src/workout`; the shared button is under `src/components`. Share business logic between platforms; do not force identical TV and touch layouts. Read `AGENTS.md` before using a coding agent.

Environment files, generated output, native projects, and signing credentials are ignored. `.env.example` and `.env.*.example` remain trackable; none are needed yet. Never place secrets in `EXPO_PUBLIC_*` variables, which are embedded in the client bundle. Keep the npm lockfile and configuration in Git.

## Current energy behavior

- **Gentle:** one fewer set per exercise (minimum one), lower rep/time target, 45-second rest.
- **Steady:** source sets and rep/time ranges, 45-second rest.
- **Energized:** source sets, upper rep/time target, 45-second rest.

These are explicit app presets, not rules from the PDF. Weight choices never change automatically. Routines retain the PDF's starting loads; suggested future load progressions are not automated. Sets are marked complete manually, including timed holds and both sides of unilateral movements. The rest countdown stops at zero and waits for the user to continue. Back pauses an active session; Back again resumes. Ending early returns home without recording a completed workout.

The selected visual direction uses bundled Baloo 2 ExtraBold and Nunito (SIL Open Font License from the Google Fonts repository), plus Expo Ionicons. No AI image generation was used during implementation.

## Launcher artwork

The Android launcher name is **GetFit**. Expo config references the square icon at `assets/icon.png` and TV banner at `assets/tv-banner.png`. The simple smiling kettlebell is rendered locally with `python3 scripts/render-launcher.py` (requires Pillow); no image-generation service is used. After changing these assets, clean-prebuild and rebuild the APK to update the installed launcher entry.
