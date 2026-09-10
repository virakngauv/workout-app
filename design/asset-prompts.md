# Artwork for the peach TV design

The user will generate artwork. Do not call ImageGen without a new explicit request.

## Received: goblet squat

Integrated unchanged at `assets/exercises/goblet-squat.png` (1415 × 1112 pixels). Both complete figures are retained with contain sizing.

Original prompt:

Attach `design/selected-direction.png` as the style reference, then use this prompt:

> Create a clean exercise illustration for the right half of a cozy TV workout app. Landscape canvas, 1400 × 1100 pixels, solid warm ivory background (#FFF9F1). Show the same adult woman twice, full body including shoes: on the left standing upright holding a kettlebell at her chest; on the right lowered into a goblet squat, heels grounded, knees following the direction of her toes. Use realistic adult human proportions and clearly readable joint positions, a brown ponytail, dusty rose fitted workout top, dark brown leggings, and cream sneakers. Soft pastel coloring, warm dark brown outlines, gentle friendly expression, matching the supplied UI reference. Keep the figures separate with generous whitespace and no overlap. No text, labels, arrows, UI, flowers, logos, or other characters. This is an instructional illustration, so prioritize clear anatomy and pose over cuteness.

Inspect the returned asset before placing it in `assets/exercises/` and registering it in `src/workout/ExerciseArt.tsx`. Do not stretch it, use it for unrelated movements, or claim generated anatomy is professionally validated.

## Supporting decoration (after the first asset)

Optional separate asset, same attached reference:

> Create one small hand-drawn sprig of three peach flowers with muted sage green leaves, in the soft pastel storybook style of the attached TV interface. 500 × 700 pixels. Warm dark brown pencil outlines, minimal detail, generous clear space around the sprig. Solid warm ivory background #FFF9F1. No text, shadows, frame, characters, or UI.

## Remaining instructional artwork

Each movement needs its own inspected illustration, with pose-specific labels. Keep the same adult model, proportions, outfit, palette, and uncluttered framing. Do not generate a sprite sheet or reuse the squat drawing to illustrate other movements.

Workout A still needs Romanian deadlift, one-arm dumbbell row, floor chest press, standing shoulder press, glute bridge, and dead bug.

Workouts B/C additionally need reverse lunge, kettlebell deadlift, bent-over row, incline/wall push-up, lateral raise, plank, split squat, and side plank. The source plan includes a glute bridge/hip thrust choice; the bridge can use its existing appropriate illustration.

Text form reminders are currently shown for every exercise until its own art is supplied. The visual implementation is not complete until the selected home-screen artwork is integrated and compared again.


## Exercise artwork received
All 15 exercise illustrations are now supplied and integrated unchanged. No further exercise image generation is needed. Decorative artwork remains optional and pending.
