# Startup experience validation

Issue #5 replaces the unfinished startup handoff with a native splash and first frame that share the GetFit palette and artwork.

## Visual evidence

- Before: `design/evidence/startup-before.png`
- After: `design/evidence/startup-after.png`

The screenshots use the 1280 × 720 web preview to document responsive layout and the visible first rendered screen. Web preview is supporting evidence only; it does not validate native splash timing or television focus behavior.

## Launch behavior

- Native splash background and the first rendered screen both use `#FFF9F1`.
- The transparent smiling-kettlebell mark avoids a mismatched image rectangle on phone and TV aspect ratios.
- The native splash remains mounted while bundled Baloo 2, Nunito, and Ionicons fonts load, then fades after the root view has laid out.
- The welcome screen keeps **Start workout** as the preferred TV focus and retains visible focus styling on every interactive control.

## Validation record

| Target | Result |
| --- | --- |
| Web, 1280 × 720 | Captured before/after welcome-screen screenshots; checked for clipping and overlap. |
| Web, 390 × 844 | Checked the narrow stacked layout with an exact browser viewport: document width remained 390 px and all interactive controls stayed within the viewport. |
| Android TV native configuration | Clean prebuild generated the splash resources; Android export completed. |
| Android TV emulator | Not run in this environment. Native splash timing and D-pad behavior still require emulator validation. |
| Physical Android TV | Installed and launched the release APK on a 1920 × 1080 Android 10 TV (960 × 540 logical viewport); verified the home screen rendered, initial focus, the plan screen, and a launch recording showing the splash artwork fully visible. Native splash timing and the complete real-remote workout flow remain outstanding. |
| Android/iOS phone | Narrow web layout checked; native devices were not available. |

Automated exports and prebuilds are not compiled APKs or device tests.
