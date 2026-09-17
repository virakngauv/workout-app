import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import ts from 'typescript';

const folder = mkdtempSync(join(tmpdir(), 'workout-tests-'));
after(() => rmSync(folder, { recursive: true, force: true }));
for (const name of ['plan', 'session']) {
  const source = readFileSync(`src/workout/${name}.ts`, 'utf8').replace("from './plan'", "from './plan.mjs'");
  writeFileSync(join(folder, `${name}.mjs`), ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
}
const { cardioOptions, planGuidance, prescription, recoverySeconds, workouts, energies, getCurrentWeekdayIndex, getWeek, weeks } = await import(pathToFileURL(join(folder, 'plan.mjs')));
const { getSessionExercises, getSessionPrescription, getSessionProgress, startSession, sessionReducer, totalPrescribedSets } = await import(pathToFileURL(join(folder, 'session.mjs')));

test('weekday selection converts JavaScript Sunday-first dates to the Monday-first plan', () => {
  assert.equal(getCurrentWeekdayIndex(new Date(2026, 8, 14)), 0);
  assert.equal(getCurrentWeekdayIndex(new Date(2026, 8, 16)), 2);
  assert.equal(getCurrentWeekdayIndex(new Date(2026, 8, 20)), 6);
});

test('energy presets stay within source targets without changing the prescribed strength sets', () => {
  for (const workout of Object.values(workouts)) for (const item of workout.exercises) {
    assert.equal(prescription(item, 'Gentle').sets, item.sets);
    assert.equal(prescription(item, 'Steady').sets, item.sets);
    assert.equal(prescription(item, 'Energized').sets, item.sets);
    assert.ok(prescription(item, 'Gentle').target.startsWith(String(item.min)));
    assert.ok(prescription(item, 'Energized').target.startsWith(String(item.progressionMax ?? item.max)));
  }
  assert.equal(workouts.A.exercises[0].load, '15 lb KB; progress to 8 kg if controlled');
  assert.equal(getWeek(1).filter(day => day.workout).length, 2);
  assert.equal(getWeek(2)[3].workout, 'B');
  assert.equal(getWeek(2)[3].core, 'Core1');
  assert.deepEqual(workouts.Core1.exercises.map(item => item.id), ['dead-bug', 'side-plank']);
  assert.equal(workouts.B.exercises.some(item => item.id === 'plank'), false);
  assert.equal(prescription(workouts.Core1.exercises[1], 'Steady').durationSeconds, 15);
  assert.equal(prescription(workouts.Core1.exercises[1], 'Energized').durationSeconds, 30);
  assert.equal(prescription(workouts.A.exercises[0], 'Steady').durationSeconds, null);
  assert.equal(weeks.length, 6);
  assert.equal(getWeek(0), weeks[0]);
  assert.equal(getWeek(7), weeks[5]);
});

test('sessions traverse exercises round-by-round before starting the next set', () => {
  const sessions = [
    { workout: 'A' },
    { workout: 'B', core: 'Core1' },
    { workout: 'C', core: 'Core2' },
  ];
  for (const config of sessions) for (const energy of energies) {
    let state = startSession(config.workout, energy, config.core, 2);
    const exercises = getSessionExercises(state);
    const maxSets = Math.max(...exercises.map((_, index) => getSessionPrescription(state, index).sets));
    const expected = [];
    for (let set = 1; set <= maxSets; set += 1) {
      for (const [exercise, item] of exercises.entries()) {
        if (getSessionPrescription(state, exercise).sets >= set) expected.push({ exercise, set, id: item.id });
      }
    }
    assert.equal(expected.length, totalPrescribedSets(config.workout, energy, config.core, 2));
    for (const [completed, position] of expected.entries()) {
      assert.equal(state.phase, 'exercise');
      assert.equal(state.exercise, position.exercise);
      assert.equal(state.set, position.set);
      assert.equal(exercises[state.exercise].id, position.id);
      state = sessionReducer(state, { type: 'complete-set' });
      assert.equal(state.completedSets, completed + 1);
      assert.equal(state.phase, completed === expected.length - 1 ? 'complete' : 'rest');
      if (completed < expected.length - 1) {
        assert.equal(state.remaining, recoverySeconds);
        state = sessionReducer(state, { type: 'continue' });
      }
    }
    assert.deepEqual(sessionReducer(state, { type: 'complete-set' }), state);
  }
});

test('recovery starts at 45 seconds, counts down, and never auto-starts a set', () => {
  let state = sessionReducer(startSession('A', 'Gentle'), { type: 'complete-set' });
  assert.equal(state.remaining, recoverySeconds);
  state = sessionReducer(state, { type: 'tick' });
  assert.equal(state.remaining, recoverySeconds - 1);
  state = sessionReducer(state, { type: 'pause' });
  assert.deepEqual(sessionReducer(state, { type: 'tick' }), state);
  assert.deepEqual(sessionReducer(state, { type: 'continue' }), state);
  state = sessionReducer(state, { type: 'resume' });
  for (let i = 0; i < 100; i++) state = sessionReducer(state, { type: 'tick' });
  assert.equal(state.remaining, 0);
  assert.equal(state.phase, 'rest');
  assert.equal(sessionReducer(state, { type: 'tick' }), state);
  state = sessionReducer(state, { type: 'continue' });
  assert.equal(state.exercise, 1);
  assert.equal(state.set, 1);
});

test('exercise timers start explicitly, pause with the workout, stop at zero, and reset for each timed exercise', () => {
  let state = startSession('Core2', 'Gentle');
  assert.equal(state.exerciseTimerRemaining, 20);
  assert.equal(state.exerciseTimerRunning, false);
  state = sessionReducer(state, { type: 'timer-toggle' });
  assert.equal(state.exerciseTimerRunning, true);
  state = sessionReducer(state, { type: 'tick' });
  assert.equal(state.exerciseTimerRemaining, 19);
  state = sessionReducer(state, { type: 'pause' });
  assert.equal(sessionReducer(state, { type: 'tick' }).exerciseTimerRemaining, 19);
  state = sessionReducer(state, { type: 'resume' });
  for (let second = 19; second > 0; second -= 1) state = sessionReducer(state, { type: 'tick' });
  assert.equal(state.exerciseTimerRemaining, 0);
  assert.equal(state.exerciseTimerRunning, false);
  state = sessionReducer(state, { type: 'timer-toggle' });
  assert.equal(state.exerciseTimerRemaining, 20);
  assert.equal(state.exerciseTimerRunning, true);
  state = sessionReducer(state, { type: 'timer-reset' });
  assert.equal(state.exerciseTimerRemaining, 20);
  assert.equal(state.exerciseTimerRunning, false);
  state = sessionReducer(state, { type: 'complete-set' });
  state = sessionReducer(state, { type: 'continue' });
  assert.equal(state.exercise, 1);
  assert.equal(state.exerciseTimerRemaining, 30);
  assert.equal(state.exerciseTimerRunning, false);
});

test('progress reports total work, time remaining, and completed/current/upcoming sections', () => {
  let state = startSession('A', 'Steady');
  assert.equal(totalPrescribedSets('A', 'Steady'), 12);
  assert.equal(totalPrescribedSets('A', 'Gentle'), 12);
  assert.equal(getSessionProgress(startSession('A', 'Gentle')).remainingMinutes, 25);
  assert.equal(getSessionProgress(startSession('A', 'Steady', 'Core1')).remainingMinutes, 30);
  assert.deepEqual(getSessionProgress(state), {
    completedSets: 0,
    totalSets: 12,
    percent: 0,
    remainingMinutes: 25,
    sectionLabel: 'Set 1 of 2',
    activeExercise: 0,
    activeSet: 1,
    exerciseStatuses: ['current', 'upcoming', 'upcoming', 'upcoming', 'upcoming', 'upcoming'],
  });

  state = sessionReducer(state, { type: 'complete-set' });
  let progress = getSessionProgress(state);
  assert.equal(progress.completedSets, 1);
  assert.equal(progress.percent, 8);
  assert.equal(progress.remainingMinutes, 23);
  assert.equal(progress.sectionLabel, 'Recovery');
  assert.equal(progress.activeExercise, 1);
  assert.deepEqual(progress.exerciseStatuses.slice(0, 3), ['upcoming', 'current', 'upcoming']);

  state = sessionReducer(state, { type: 'continue' });
  assert.equal(getSessionProgress(state).sectionLabel, 'Set 1 of 2');
  for (let exercise = 1; exercise < 6; exercise += 1) {
    assert.equal(state.exercise, exercise);
    state = sessionReducer(state, { type: 'complete-set' });
    if (exercise < 5) state = sessionReducer(state, { type: 'continue' });
  }
  progress = getSessionProgress(state);
  assert.equal(progress.activeExercise, 0);
  assert.equal(progress.activeSet, 2);
  assert.deepEqual(progress.exerciseStatuses.slice(0, 3), ['current', 'upcoming', 'upcoming']);
  state = sessionReducer(state, { type: 'continue' });
  assert.equal(state.exercise, 0);
  assert.equal(state.set, 2);
  state = sessionReducer(state, { type: 'complete-set' });
  progress = getSessionProgress(state);
  assert.deepEqual(progress.exerciseStatuses.slice(0, 3), ['completed', 'current', 'upcoming']);
});

test('week 2 Thursday combines Workout B with the reference Core 1 sequence', () => {
  const day = getWeek(2)[3];
  const state = startSession(day.workout, 'Steady', day.core, 2);
  assert.deepEqual(getSessionExercises(state).map(item => item.id), [
    'reverse-lunge', 'kb-deadlift', 'one-arm-row', 'wall-push-up', 'lateral-raise', 'dead-bug', 'side-plank',
  ]);
  assert.equal(totalPrescribedSets(day.workout, 'Steady', day.core, 1), 12);
  assert.equal(totalPrescribedSets(day.workout, 'Steady', day.core, 2), 14);
});

test('the weekly calendar matches the reference schedule exactly', () => {
  assert.deepEqual(weeks.map(week => week.map(day => day.label)), [
    ['Workout A', 'Dance', 'Rest / easy walk', 'Workout A', 'Dance', 'Optional easy walk / Pilates', 'Rest'],
    ['Workout A', 'Cardio option', 'Rest / easy walk', 'Workout B + Core 1', 'Rest / easy Pilates', 'Cardio option', 'Rest'],
    ['Workout A + Core 1', 'Cardio option', 'Workout B', 'Easy walk / Pilates', 'Cardio option', 'Optional Workout C or easy walk', 'Rest'],
    ['Workout A + Core 1', 'Cardio option', 'Workout B', 'Brisk walk / Pilates', 'Cardio option', 'Workout C + Core 2', 'Rest'],
    ['Workout A + Core 1', 'Cardio option', 'Workout B', 'Brisk walk / Pilates', 'Cardio option', 'Workout C + Core 2', 'Rest'],
    ['Workout A + Core 1', 'Cardio option', 'Workout B', 'Brisk walk / Pilates', 'Cardio option', 'Optional Workout C + Core 2', 'Rest'],
  ]);
  assert.match(getWeek(6)[5].note, /Or cardio 30–40 min/);
});

test('reference cardio, progression, and safety instructions remain available', () => {
  assert.deepEqual(cardioOptions, [
    'Dance: 20–30 min; keep moving. Moderate effort means you can talk, but singing would be difficult.',
    'Incline walk: 20–30 min at incline 10–11, speed 2.8. If too hard, use incline 8–10 or speed 2.6–2.8.',
    'Jog/walk: 20–25 min; 3 min jog at 5.0 + 2 min walk at 3.0, repeated 4–5 rounds. Easier: 2 min jog + 2 min walk.',
    'Easy/recovery walk: 20–30 min comfortable pace. You do not need to run continuously.',
  ]);
  assert.match(planGuidance.progress, /Do not make up missed exercise/);
  assert.match(planGuidance.progress, /Keep most strength work at 2 sets/);
  assert.match(planGuidance.metrics, /actual active minutes/);
  assert.match(planGuidance.safety, /dizziness, chest symptoms/);
});

test('core prescriptions preserve source rounds, progression, and loads', () => {
  const coreOne = startSession('Core1', 'Steady', undefined, 1);
  const coreTwo = startSession('Core1', 'Steady', undefined, 2);
  assert.equal(totalPrescribedSets('Core1', 'Steady', undefined, 1), 2);
  assert.equal(totalPrescribedSets('Core1', 'Steady', undefined, 2), 4);
  assert.equal(getSessionPrescription(coreOne, 1).durationSeconds, 15);
  assert.equal(getSessionPrescription({ ...coreTwo, energy: 'Energized' }, 1).durationSeconds, 30);
  assert.equal(workouts.Core2.exercises[1].load, '15 lb or 8 kg KB only if you can stay upright without leaning');
  assert.equal(prescription(workouts.Core2.exercises[1], 'Gentle').durationSeconds, 30);
  assert.equal(prescription(workouts.Core2.exercises[1], 'Energized').durationSeconds, 45);
});
