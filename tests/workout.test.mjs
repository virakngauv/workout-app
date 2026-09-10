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
const { prescription, workouts, energies, getWeek } = await import(pathToFileURL(join(folder, 'plan.mjs')));
const { startSession, sessionReducer } = await import(pathToFileURL(join(folder, 'session.mjs')));

test('energy presets stay within source rep ranges, retain load, and reduce only Gentle sets', () => {
  for (const workout of Object.values(workouts)) for (const item of workout.exercises) {
    assert.equal(prescription(item, 'Gentle').sets, Math.max(1, item.sets - 1));
    assert.equal(prescription(item, 'Steady').sets, item.sets);
    assert.equal(prescription(item, 'Energized').sets, item.sets);
    assert.ok(prescription(item, 'Gentle').target.startsWith(String(item.min)));
    assert.ok(prescription(item, 'Energized').target.startsWith(String(item.max)));
  }
  assert.equal(workouts.A.exercises[0].load, '15 lb kettlebell');
  assert.equal(getWeek(1).filter(day => day.workout).length, 2);
  assert.equal(getWeek(2)[5].workout, 'A');
  assert.match(getWeek(2)[5].note, /Optional/);
  assert.deepEqual(getWeek(4), getWeek(3));
});

test('each complete session traverses every prescribed set once and ends on the last set', () => {
  for (const id of ['A', 'B', 'C']) for (const energy of energies) {
    let state = startSession(id, energy);
    const total = workouts[id].exercises.reduce((sum, item) => sum + prescription(item, energy).sets, 0);
    for (let completed = 1; completed <= total; completed++) {
      assert.equal(state.phase, 'exercise');
      state = sessionReducer(state, { type: 'complete-set' });
      assert.equal(state.completedSets, completed);
      assert.equal(state.phase, completed === total ? 'complete' : 'rest');
      if (completed < total) {
        assert.equal(state.remaining, 45);
        state = sessionReducer(state, { type: 'continue' });
      }
    }
    assert.equal(state.exercise, 6);
    assert.deepEqual(sessionReducer(state, { type: 'complete-set' }), state);
  }
});

test('rest timer freezes when paused, never goes negative, and never auto-starts a set', () => {
  let state = sessionReducer(startSession('A', 'Gentle'), { type: 'complete-set' });
  assert.equal(state.remaining, 45);
  state = sessionReducer(state, { type: 'pause' });
  assert.deepEqual(sessionReducer(state, { type: 'tick' }), state);
  assert.deepEqual(sessionReducer(state, { type: 'continue' }), state);
  state = sessionReducer(state, { type: 'resume' });
  for (let i = 0; i < 100; i++) state = sessionReducer(state, { type: 'tick' });
  assert.equal(state.remaining, 0);
  assert.equal(state.phase, 'rest');
  state = sessionReducer(state, { type: 'continue' });
  assert.equal(state.exercise, 1);
  assert.equal(state.set, 1);
});
