import { prescription, workouts, type Energy, type WorkoutId } from './plan';

export type Session = {
  workout: WorkoutId;
  energy: Energy;
  exercise: number;
  set: number;
  completedSets: number;
  phase: 'exercise' | 'rest' | 'complete';
  remaining: number;
  paused: boolean;
};
export type SessionAction = { type: 'complete-set' } | { type: 'continue' } | { type: 'tick' } | { type: 'pause' } | { type: 'resume' };
export const startSession = (workout: WorkoutId, energy: Energy): Session => ({ workout, energy, exercise: 0, set: 1, completedSets: 0, phase: 'exercise', remaining: 0, paused: false });
export function sessionReducer(state: Session, action: SessionAction): Session {
  if (action.type === 'pause') return state.phase === 'complete' ? state : { ...state, paused: true };
  if (action.type === 'resume') return { ...state, paused: false };
  if (state.paused || state.phase === 'complete') return state;
  if (action.type === 'tick') return state.phase === 'rest' ? { ...state, remaining: Math.max(0, state.remaining - 1) } : state;
  const list = workouts[state.workout].exercises;
  const item = list[state.exercise]!;
  const target = prescription(item, state.energy);
  if (action.type === 'complete-set' && state.phase === 'exercise') {
    const isLast = state.exercise === list.length - 1 && state.set === target.sets;
    return { ...state, completedSets: state.completedSets + 1, phase: isLast ? 'complete' : 'rest', remaining: isLast ? 0 : target.rest };
  }
  if (action.type === 'continue' && state.phase === 'rest') {
    const nextExercise = state.set === target.sets;
    return { ...state, exercise: state.exercise + (nextExercise ? 1 : 0), set: nextExercise ? 1 : state.set + 1, phase: 'exercise', remaining: 0 };
  }
  return state;
}
