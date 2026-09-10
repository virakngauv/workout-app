# Contributor and coding-agent instructions

## Scope
This repository uses Expo, TypeScript, React Native TV, and Expo Router. Android TV is the primary target; Android/iOS phones are secondary; web is a development preview.

The repository is currently scaffolding only. Do not infer workout features, data models, authentication, navigation flows, visual branding, or a backend from the repository name. Implement only the issue/task being worked on. Do not add a design system, state-management library, database, or native dependency speculatively.

## Architecture
- Keep TypeScript strict. Import React Native APIs from `react-native`; its package is intentionally aliased to `react-native-tvos`.
- Keep Expo SDK and React Native TV versions compatible. Do not replace the TV fork with upstream React Native when fixing dependency warnings.
- Use npm and commit changes to `package-lock.json` with dependency changes. Use `npm ci` for an existing checkout.
- Use Expo Router in `src/app`. Share business logic when features exist; split TV/mobile presentation only when requirements justify it.
- `Platform.isTV` is a runtime check, not a substitute for generating the correct native target.
- Native projects are generated and ignored. Express changes in app configuration/config plugins, not hand-edited `android/` or `ios/` files.
- Changing targets requires a clean prebuild. This deletes generated native files; never store irreplaceable work there.
- Keep secrets and signing keys out of source, prompts, logs, and the client bundle. `EXPO_PUBLIC_*` values are public, not secret storage.

## Future TV UI
- Every interactive feature must support D-pad Up/Down/Left/Right, Select, and Back without a mouse or touch.
- Provide an obvious focused state. Avoid focus traps and restore focus sensibly after navigation.
- Prefer normal `Pressable` focus/press behavior before custom remote-event handling.
- Validate focus on a TV emulator and real hardware; browser navigation is not a TV focus test.
- Use readable text at couch distance and avoid unnecessary TV text entry.
- Do not build these components preemptively in the scaffolding task.

## Workflow and validation
- Before running npm or Expo commands, select the Node version declared in `.nvmrc` and verify it with `node --version`. With fnm, use `fnm use`; for non-interactive commands, use `fnm exec --using=24 <command>`.
- Work in focused branches/PRs. Do not let multiple agents modify overlapping files concurrently.
- Run `npm run check` and `npx expo install --check` before submitting.
- For configuration/dependency changes, also run `npm run export:web`, `npm run export:android`, and the applicable prebuild command.
- Update README commands when tooling changes.
- State exactly what was tested. A TypeScript check, Metro export, or successful prebuild is not a compiled APK or a successful device test.
- Never merge, publish, provision cloud resources, or create signing credentials unless explicitly requested.
