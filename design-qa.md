# Peach TV design QA — all exercise artwork integrated

final result: blocked

## Comparison target and evidence

- Source visual truth: `design/selected-direction.png` (first displayed option selected by the user).
- Implementation: `http://localhost:8081`, Week 1 / Workout A / Steady, Start workout focused.
- Source dimensions: 1672 × 941 pixels.
- Browser viewport and screenshot: 1672 × 941 CSS/pixel dimensions; no density normalization needed.
- Implementation screenshot: `design/evidence/home-with-squat.png`.
- Combined full-view comparison: `design/evidence/comparison-with-squat.jpg` (source left, implementation right).
- Focused examination: original full-resolution home screenshot and selected mockup inspected; the full view makes the missing illustration and control labels unambiguous. Both full-resolution user artwork and the rendered panel were inspected for pose, clipping, label alignment, and sharpness. The opaque background is preserved; no artwork alterations were made.
- Secondary browser check: 390 × 844; stacked layout and scroll allow access to controls without horizontal overflow.

## Findings

- **Resolved: exercise illustration.** The user supplied a 1415 × 1112 image, stored unchanged at `assets/exercises/goblet-squat.png`. Both full figures, kettlebells, and shoes remain visible. Native text supplies Start/Lower labels and two form cues.
- **Resolved: image sizing.** Initial integration allowed the image's intrinsic size to expand the scroll content and hide controls. A bounded flex frame with an absolutely positioned contain image fixes this. Recaptured home and session show the full footer and buttons.
- **[P2] Supporting visual detail incomplete.** Floral sprigs, the hand-drawn accent, and the organic backdrop from the selected direction remain absent. These were not generated because the user is supplying artwork. The full-design fidelity gate remains blocked; the supplied squat image integration is verified.
- **Intentional asset accommodation:** the new supplied illustration has an opaque ivory background. An ivory image surface preserves it without image editing or stretching; labels and cues sit below it. The supplied art is the updated source for the figures.

## Required fidelity surfaces

- **Fonts/typography:** local Baloo 2 ExtraBold and Nunito create a close rounded match. Home headline remains two lines at the target viewport. Main button copy is darker than the mockup for readable contrast against coral. Keep the dark focused outline distinct from the lighter selected energy state.
- **Spacing/layout:** two-column composition, generous margins, coral primary button, centered weekly-plan button, and bottom remote legend follow the target. First browser inspection showed footer overflow; reduced vertical gaps and helper-text reserve, then recaptured with the full footer visible. Native TV layout remains unverified.
- **Colors/tokens:** cream, peach, coral, and brown palette implemented. Flat native surfaces currently lack the source's illustrated backdrop texture; evaluate with the user-supplied art.
- **Image quality:** supplied squat image is sharp, undistorted, and fully visible in home and active-session screenshots. All 15 movements now have distinct supplied artwork and movement-specific labels. No AI generation calls were made during implementation and no squat art is reused for unrelated movements.
- **Copy/content:** reference home copy retained, PDF workouts and schedule transcribed. Energy behavior is an app proposal, explicitly documented rather than attributed to the source. Footer describes actual navigation. No saved workout history or adaptive progression implied.

## Interaction verification

Browser:
- Initial Start focus; Up/Left/Right energy changes and visible prescription explanation.
- Gentle starts at one set and the lower rep target.
- Set completion opens rest; Back/Escape pauses, resumes, and restores control focus.
- Completed a full seven-exercise Gentle Workout A, reaching the completion screen with seven sets.
- Returned home, opened the plan, switched to Week 2 with arrows/Enter, selected Thursday's Workout B and returned to its home state.
- Browser error/warning log check returned no entries.

Automated:
- TypeScript and ESLint pass.
- Seven tests pass, including traversal of all routines at all energy presets, pause/rest behavior, no negative rest, and optional-week structure.
- Expo dependency compatibility check passes with host network access.
- Web and Android Metro exports pass.
- Android TV clean prebuild with `--no-install` passes.

Not verified: native compilation/APK installation, emulator D-pad focus, real TV/couch-distance use, or professional review of exercise illustrations. ADB reported no connected devices. These are explicit remaining checks, not implied by web testing or exports.

## Comparison history

1. Initial browser inspection: footer overflow and energy selection background hidden by a later style override. Fixed layout spacing and selected-style order.
2. Recaptured home at the source dimensions: footer and selected state visible. Saved combined source/implementation comparison. P1/P2 image-dependent findings remain unresolved.

## Implementation checklist

1. Completed: received and inspected the user's squat image.
2. Completed: stored the unmodified file, registered the exercise-specific asset, and fitted the right panel.
3. Add/approve remaining decorative artwork and refine visual spacing against the selected image.
4. Capture and compare again; do not mark visual QA passed while the required assets are missing.
5. Validate native D-pad Up/Down/Left/Right, Select, Back and focus restoration on the existing TV AVD, then on real hardware.
6. Completed: all 15 distinct exercise illustrations supplied and registered.

## Latest integration verification

- Compared `design/evidence/comparison-with-squat.jpg` at identical source/implementation dimensions.
- Inspected `design/evidence/squat-session.png`; the source art is correctly reused for the same movement during a session.
- At 390 × 844, scrolled to the entire illustration, labels, cues, and footer; no horizontal clipping.
- Start workout and Back-to-pause still function.
- TypeScript, ESLint, and all seven tests pass after the integration.
- Image is included in both web and Android asset exports.
- Decorative fidelity and native TV/device validation remain pending.


## Full artwork integration
- Copied all 14 remaining supplied PNGs unchanged into assets/exercises.
- Mapped labels to each movement; plank and side plank have one centered Hold label.
- Checked active Workout B at 1672 × 941, traversing all seven exercises with Gentle energy, rest/continue and pause controls.
- Captured deadlift-session.png, bridge-session.png, and plank-session.png in design/evidence.
- All figures fit without cropping. Two-pose floor illustrations appear smaller because of their wide composition and source whitespace; couch-distance readability remains a device check.
- Artwork shows representative variants: the bridge is bodyweight, the RDL uses one kettlebell, and the push-up uses a wall. Session loads remain the source prescriptions.
- TypeScript, ESLint, seven tests, Expo compatibility check, and Android export pass.
- ADB reports no connected devices. Native compilation, emulator D-pad validation, and hardware use remain unverified.

## Subsequent device and rest-time updates

- Built and installed the standalone APK on a physical Android 10 TV. Confirmed the home screen and initial Start workout focus; full remote workout traversal remains unverified.
- Renamed the launcher entry GetFit and installed its smiling kettlebell icon/banner; verified the Favorite Apps tile on the physical TV.
- Changed all energy presets to 45-second rest. Session tests assert 45 seconds between every set across all routines and energy levels. Earlier screenshots and timing notes above document previous builds, not the current prescription.
- The installed TV APK predates the 45-second change; the new rest time requires another build/install. Decorative fidelity remains optional follow-up work.
