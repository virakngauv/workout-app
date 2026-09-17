// Transcribed from the user's 6-Week Return-to-Fitness Strength + Cardio Plan.
export type Energy = 'Gentle' | 'Steady' | 'Energized';
export type WorkoutId = 'A' | 'B' | 'C' | 'Core1' | 'Core2';
export type Exercise = {
  id: string;
  name: string;
  sets: number;
  min: number;
  max: number;
  unit?: 'side' | 'leg' | 'seconds' | 'seconds/side';
  load: string;
  cues: string[];
  progressionMax?: number;
};
const exercise = (id: string, name: string, sets: number, min: number, max: number, load: string, cues: string[], unit?: Exercise['unit'], progressionMax?: number): Exercise => ({ id, name, sets, min, max, load, cues, unit, progressionMax });
const squat = ['Chest up', 'Knees track over toes', 'Drive through heels'];
const hinge = ['Hinge at hips', 'Back flat', 'Feel hamstrings'];
const row = ['Back flat', 'Pull elbow back', 'Keep neck neutral'];
const press = ['Wrists stacked', 'Press straight up', 'Control the lowering'];
const shoulder = ['Brace core', 'Press overhead', 'Ribs down'];
const bridge = ['Push through heels', 'Squeeze glutes', 'Avoid arching back'];
export type Workout = {
  title: string;
  duration: string;
  durationMinutes?: readonly [number, number];
  note?: string;
  exercises: Exercise[];
};
export const workouts: Record<WorkoutId, Workout> = {
  A: { title: 'Workout A', duration: '~22–28 min', durationMinutes: [22, 28], exercises: [
    exercise('goblet-squat', 'Goblet squat', 2, 8, 10, '15 lb KB; progress to 8 kg if controlled', squat),
    exercise('romanian-deadlift', 'Romanian deadlift', 2, 8, 10, '15 lb KB or 8 kg KB', hinge),
    exercise('one-arm-row', '1-arm dumbbell row', 2, 10, 10, '10 lb; progress as form allows', row, 'side'),
    exercise('floor-press', 'Floor chest press', 2, 10, 10, '5–10 lb each, if paired', press),
    exercise('shoulder-press', 'Standing shoulder press', 2, 8, 10, '3–5 lb each, if paired', shoulder),
    exercise('glute-bridge', 'Glute bridge', 2, 10, 12, 'Bodyweight or 15 lb KB', bridge),
  ] },
  B: { title: 'Workout B', duration: '~20–25 min', durationMinutes: [20, 25], exercises: [
    exercise('reverse-lunge', 'Reverse lunge', 2, 8, 8, 'Bodyweight or 5 lb each', ['Step back', 'Torso tall', 'Push through front foot'], 'leg'),
    exercise('kb-deadlift', 'Kettlebell deadlift', 2, 8, 10, '15 lb or 8 kg KB; heavier only with solid form', ['Push hips back', 'Neutral spine', 'Stand tall']),
    exercise('one-arm-row', '1-arm dumbbell row', 2, 10, 10, '10 lb', row, 'side'),
    exercise('wall-push-up', 'Incline / wall push-up', 2, 8, 12, 'Bodyweight', ['Body straight', 'Hands under shoulders', 'Push away']),
    exercise('lateral-raise', 'Lateral raise', 2, 10, 12, '1–3 lb each', ['Soft elbows', 'Lift to shoulder height', 'Lower slowly']),
  ] },
  C: { title: 'Workout C', duration: '~22–28 min', durationMinutes: [22, 28], note: 'C is optional — a bonus day, never a requirement.', exercises: [
    exercise('split-squat', 'Split squat', 2, 8, 8, 'Bodyweight or 5 lb each', ['Stay balanced', 'Torso tall', 'Lower straight down'], 'leg'),
    exercise('romanian-deadlift', 'Romanian deadlift or KB deadlift', 2, 8, 10, '15 lb or 8 kg KB', hinge),
    exercise('one-arm-row', '1-arm row', 2, 10, 10, '10 lb or 8 kg KB', row, 'side'),
    exercise('floor-press', 'Floor chest press', 2, 10, 10, '5–10 lb each, if paired', press),
    exercise('shoulder-press', 'Standing shoulder press', 2, 8, 10, '3–5 lb each, if paired', shoulder),
  ] },
  Core1: { title: 'Core 1', duration: '1–2 rounds', note: 'Build the side plank toward 30 sec.', exercises: [
    exercise('dead-bug', 'Dead bug', 2, 6, 8, 'Bodyweight', ['Lower back stays down', 'Move slowly', 'Reach opposite arm and leg'], 'side'),
    exercise('side-plank', 'Side plank', 2, 15, 20, 'Bodyweight', ['Lift hips', 'Body in a line', 'Keep neck neutral'], 'seconds/side', 30),
  ] },
  Core2: { title: 'Core 2', duration: '1–2 rounds', note: 'Add once Week 4 feels comfortable. Use 15 lb or 8 kg KB only if you can stay upright without leaning.', exercises: [
    exercise('plank', 'Forearm plank', 2, 20, 40, 'Bodyweight', ['Brace core', 'Hips level', 'Do not sag'], 'seconds'),
    exercise('suitcase-carry', 'Suitcase carry', 2, 30, 45, '15 lb or 8 kg KB only if you can stay upright without leaning', ['Stand tall', 'Do not lean', 'Slow, steady steps'], 'seconds/side'),
  ] },
};
export const energies: Energy[] = ['Gentle', 'Steady', 'Energized'];
export const recoverySeconds = 45;
export const energyDetails: Record<Energy, string> = {
  Gentle: 'Lower rep/time target · 2 strength sets · 45 sec recovery',
  Steady: 'As-written range · 2 strength sets · 45 sec recovery',
  Energized: 'Upper or progression target · 2 strength sets · 45 sec recovery',
};
export function prescription(item: Exercise, energy: Energy, sets = item.sets) {
  const targetAmount = energy === 'Energized' ? item.progressionMax ?? item.max : item.min;
  const amount = energy === 'Steady' && item.min !== item.max ? `${item.min}–${item.max}` : String(targetAmount);
  const unit = item.unit === 'seconds' ? 'sec' : item.unit === 'seconds/side' ? 'sec / side' : item.unit ? `reps / ${item.unit}` : 'reps';
  const durationSeconds = item.unit === 'seconds' || item.unit === 'seconds/side' ? targetAmount : null;
  return { sets, target: `${amount} ${unit}`, rest: recoverySeconds, durationSeconds };
}
export type PlanDay = { label: string; workout?: WorkoutId; core?: WorkoutId; note?: string };
export type CoreRounds = 1 | 2;
export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const getCurrentWeekdayIndex = (date = new Date()) => (date.getDay() + 6) % 7;
export const cardioOptions = [
  'Dance: 20–30 min; keep moving. Moderate effort means you can talk, but singing would be difficult.',
  'Incline walk: 20–30 min at incline 10–11, speed 2.8. If too hard, use incline 8–10 or speed 2.6–2.8.',
  'Jog/walk: 20–25 min; 3 min jog at 5.0 + 2 min walk at 3.0, repeated 4–5 rounds. Easier: 2 min jog + 2 min walk.',
  'Easy/recovery walk: 20–30 min comfortable pace. You do not need to run continuously.',
];
export const planGuidance = {
  intro: 'Week 1 reflects what you are doing now. Progress only when the prior week feels manageable and you feel fully recovered.',
  progress: 'Do not make up missed exercise. Move to the next week only if energy and recovery are good; repeating a week is fine. Keep most strength work at 2 sets. Add reps before weight.',
  goals: 'For your goals: keep arm/thigh volume moderate; cardio and everyday movement support overall fat loss, while strength helps preserve/build muscle. Core work strengthens the trunk but does not selectively burn belly fat.',
  metrics: 'Use actual active minutes and how the effort feels rather than chasing a proprietary cardio-load score.',
  safety: 'Pause progression for unusual fatigue, dizziness, chest symptoms, or disproportionate shortness of breath.',
};
const cardioDay = (duration: string) => `${duration} · Choose one option from Plan guidance.`;
const easyWalk = cardioOptions[3];
export const weekGoals: string[] = [
  'Finish the return week. No need to add core yet.',
  'Add Workout B + one short core session.',
  'Build consistency. C is optional, not required.',
  'Move toward 3 strength days only if you feel good.',
  'Aim for ~100–130 min moderate movement, including brisk walks/dance.',
  'Maintenance: 2–3 strength days + gradually work toward ~150 min moderate activity/week.',
];
export const weeks: PlanDay[][] = [
  [
    { label: 'Workout A', workout: 'A' },
    { label: 'Dance', note: '20 min · Keep moving. Moderate effort means you can talk, but singing would be difficult.' },
    { label: 'Rest / easy walk', note: easyWalk },
    { label: 'Workout A', workout: 'A' },
    { label: 'Dance', note: '20 min · Keep moving. Moderate effort means you can talk, but singing would be difficult.' },
    { label: 'Optional easy walk / Pilates' },
    { label: 'Rest' },
  ],
  [
    { label: 'Workout A', workout: 'A' },
    { label: 'Cardio option', note: cardioDay('20–25 min') },
    { label: 'Rest / easy walk', note: easyWalk },
    { label: 'Workout B + Core 1', workout: 'B', core: 'Core1' },
    { label: 'Rest / easy Pilates' },
    { label: 'Cardio option', note: cardioDay('20–25 min') },
    { label: 'Rest' },
  ],
  [
    { label: 'Workout A + Core 1', workout: 'A', core: 'Core1' },
    { label: 'Cardio option', note: cardioDay('25–30 min') },
    { label: 'Workout B', workout: 'B' },
    { label: 'Easy walk / Pilates', note: '20–30 min' },
    { label: 'Cardio option', note: cardioDay('25–30 min') },
    { label: 'Optional Workout C or easy walk', workout: 'C', note: 'C is optional, not required. Or take an easy/recovery walk for 20–30 min at a comfortable pace.' },
    { label: 'Rest' },
  ],
  [
    { label: 'Workout A + Core 1', workout: 'A', core: 'Core1' },
    { label: 'Cardio option', note: cardioDay('30 min') },
    { label: 'Workout B', workout: 'B' },
    { label: 'Brisk walk / Pilates', note: '25–30 min' },
    { label: 'Cardio option', note: cardioDay('30 min') },
    { label: 'Workout C + Core 2', workout: 'C', core: 'Core2', note: 'Only if recovery is good.' },
    { label: 'Rest' },
  ],
  [
    { label: 'Workout A + Core 1', workout: 'A', core: 'Core1' },
    { label: 'Cardio option', note: cardioDay('30–35 min') },
    { label: 'Workout B', workout: 'B' },
    { label: 'Brisk walk / Pilates', note: '30 min' },
    { label: 'Cardio option', note: cardioDay('30–35 min') },
    { label: 'Workout C + Core 2', workout: 'C', core: 'Core2', note: 'Or cardio 30 min.' },
    { label: 'Rest' },
  ],
  [
    { label: 'Workout A + Core 1', workout: 'A', core: 'Core1' },
    { label: 'Cardio option', note: cardioDay('30–40 min') },
    { label: 'Workout B', workout: 'B' },
    { label: 'Brisk walk / Pilates', note: '30 min' },
    { label: 'Cardio option', note: cardioDay('30–40 min') },
    { label: 'Optional Workout C + Core 2', workout: 'C', core: 'Core2', note: 'Or cardio 30–40 min.' },
    { label: 'Rest' },
  ],
];
export const getWeek = (week: number) => weeks[Math.min(weeks.length - 1, Math.max(0, week - 1))]!;
