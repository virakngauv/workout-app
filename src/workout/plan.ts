// Transcribed from the user's 4-Week Full-Body Strength Restart Plan.
export type Energy = 'Gentle' | 'Steady' | 'Energized';
export type WorkoutId = 'A' | 'B' | 'C';
export type Exercise = {
  id: string;
  name: string;
  sets: number;
  min: number;
  max: number;
  unit?: 'side' | 'leg' | 'seconds' | 'seconds/side';
  load: string;
  cues: string[];
};
const exercise = (id: string, name: string, sets: number, min: number, max: number, load: string, cues: string[], unit?: Exercise['unit']): Exercise => ({ id, name, sets, min, max, load, cues, unit });
const squat = ['Chest up', 'Knees track over toes', 'Drive through heels'];
const hinge = ['Hinge at hips', 'Back flat', 'Feel hamstrings'];
const row = ['Back flat', 'Pull elbow back', 'Keep neck neutral'];
const press = ['Wrists stacked', 'Press straight up', 'Control the lowering'];
const shoulder = ['Brace core', 'Press overhead', 'Ribs down'];
const bridge = ['Push through heels', 'Squeeze glutes', 'Avoid arching back'];
export const workouts: Record<WorkoutId, { duration: string; exercises: Exercise[] }> = {
  A: { duration: '20–25 min', exercises: [
    exercise('goblet-squat', 'Goblet squat', 2, 8, 10, '15 lb kettlebell', squat),
    exercise('romanian-deadlift', 'Romanian deadlift', 2, 10, 10, '15 lb kettlebell', hinge),
    exercise('one-arm-row', 'One-arm dumbbell row', 2, 10, 10, '10 lb dumbbell', row, 'side'),
    exercise('floor-press', 'Floor chest press', 2, 10, 10, '5–10 lb each', press),
    exercise('shoulder-press', 'Standing shoulder press', 2, 8, 10, '3–5 lb each', shoulder),
    exercise('glute-bridge', 'Glute bridge', 2, 12, 12, 'Bodyweight or 15 lb kettlebell', bridge),
    exercise('dead-bug', 'Dead bug', 2, 6, 8, 'Bodyweight', ['Lower back stays down', 'Move slowly', 'Reach opposite arm and leg'], 'side'),
  ] },
  B: { duration: '20–30 min', exercises: [
    exercise('reverse-lunge', 'Reverse lunge', 2, 8, 8, 'Bodyweight or 5 lb each', ['Step back', 'Torso tall', 'Push through front foot'], 'leg'),
    exercise('kb-deadlift', 'Kettlebell deadlift', 2, 10, 12, '2 × 8 kg kettlebells', ['Push hips back', 'Neutral spine', 'Stand tall']),
    exercise('bent-over-row', 'Bent-over row', 2, 10, 12, '10 lb each', ['Hinge at hips', 'Squeeze shoulder blades', 'Elbows close']),
    exercise('wall-push-up', 'Incline / wall push-up', 2, 8, 12, 'Bodyweight', ['Body straight', 'Hands under shoulders', 'Push away']),
    exercise('lateral-raise', 'Lateral raise', 2, 10, 12, '1–3 lb each', ['Soft elbows', 'Lift to shoulder height', 'Lower slowly']),
    exercise('glute-bridge', 'Glute bridge / hip thrust', 2, 12, 15, '15 lb kettlebell', bridge),
    exercise('plank', 'Plank', 2, 20, 30, 'Bodyweight', ['Brace core', 'Hips level', 'Do not sag'], 'seconds'),
  ] },
  C: { duration: '25–35 min', exercises: [
    exercise('goblet-squat', 'Goblet squat', 3, 8, 10, '15 lb or 8 kg kettlebell', squat),
    exercise('romanian-deadlift', 'Romanian deadlift', 3, 8, 10, '2 × 8 kg kettlebells', hinge),
    exercise('one-arm-row', 'One-arm row', 3, 8, 10, '10 lb or 8 kg', row, 'side'),
    exercise('floor-press', 'Floor chest press', 2, 10, 12, '5–10 lb each', press),
    exercise('split-squat', 'Split squat', 2, 8, 8, 'Bodyweight or 5 lb each', ['Stay balanced', 'Torso tall', 'Lower straight down'], 'leg'),
    exercise('shoulder-press', 'Standing shoulder press', 2, 8, 10, '5 lb each', shoulder),
    exercise('side-plank', 'Side plank', 2, 15, 30, 'Bodyweight', ['Lift hips', 'Body in a line', 'Keep neck neutral'], 'seconds/side'),
  ] },
};
export const energies: Energy[] = ['Gentle', 'Steady', 'Energized'];
export const energyDetails: Record<Energy, string> = {
  Gentle: 'One fewer set · lower rep target · 45 sec rest',
  Steady: 'Your original plan · 45 sec rest',
  Energized: 'Upper rep target · same sets & weight · 45 sec rest',
};
export function prescription(item: Exercise, energy: Energy) {
  const sets = energy === 'Gentle' ? Math.max(1, item.sets - 1) : item.sets;
  const amount = energy === 'Steady' && item.min !== item.max ? `${item.min}–${item.max}` : String(energy === 'Energized' ? item.max : item.min);
  const unit = item.unit === 'seconds' ? 'sec' : item.unit === 'seconds/side' ? 'sec / side' : item.unit ? `reps / ${item.unit}` : 'reps';
  return { sets, target: `${amount} ${unit}`, rest: 45 };
}
export type PlanDay = { label: string; workout?: WorkoutId; note?: string };
export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const weeks: PlanDay[][] = [
  [{ label: 'Workout A', workout: 'A' }, { label: 'Easy cardio', note: '20–25 min · incline walk, easy jog, or dancing' }, { label: 'Rest / walk' }, { label: 'Workout A', workout: 'A' }, { label: 'Rest or easy cardio' }, { label: 'Optional Pilates / walk' }, { label: 'Rest' }],
  [{ label: 'Workout A', workout: 'A' }, { label: 'Cardio', note: '20–30 min' }, { label: 'Rest / Pilates' }, { label: 'Workout B', workout: 'B' }, { label: 'Rest or easy cardio' }, { label: 'Optional A / Pilates', workout: 'A', note: 'Optional strength only if fully recovered and not unusually sore or fatigued.' }, { label: 'Rest' }],
  [{ label: 'Workout A', workout: 'A' }, { label: 'Cardio', note: '20–30 min' }, { label: 'Workout B', workout: 'B' }, { label: 'Rest / Pilates' }, { label: 'Cardio', note: '20–30 min' }, { label: 'Workout C', workout: 'C' }, { label: 'Rest' }],
  // The source plan repeats Week 3 for Week 4 and beyond.
  [{ label: 'Workout A', workout: 'A' }, { label: 'Cardio', note: '20–30 min' }, { label: 'Workout B', workout: 'B' }, { label: 'Rest / Pilates' }, { label: 'Cardio', note: '20–30 min' }, { label: 'Workout C', workout: 'C' }, { label: 'Rest' }],
];
export const getWeek = (week: number) => weeks[Math.min(weeks.length - 1, Math.max(0, week - 1))]!;
