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

export type ExerciseStatus = 'completed' | 'current' | 'upcoming';
export type SessionProgress = {
  completedSets: number;
  totalSets: number;
  percent: number;
  remainingMinutes: number;
  sectionLabel: string;
  activeExercise: number;
  exerciseStatuses: ExerciseStatus[];
};

export function totalPrescribedSets(workout: WorkoutId, energy: Energy) {
  return workouts[workout].exercises.reduce((total, item) => total + prescription(item, energy).sets, 0);
}

export function getSessionProgress(session: Session): SessionProgress {
  const workout = workouts[session.workout];
  const totalSets = totalPrescribedSets(session.workout, session.energy);
  const completedSets = Math.min(session.completedSets, totalSets);
  const percent = totalSets === 0 ? 100 : Math.round(completedSets / totalSets * 100);
  const baseSets = workout.exercises.reduce((total, item) => total + item.sets, 0);
  const midpointMinutes = (workout.durationMinutes[0] + workout.durationMinutes[1]) / 2;
  const estimatedMinutes = midpointMinutes * totalSets / baseSets;
  const remainingMinutes = session.phase === 'complete' ? 0 : Math.max(1, Math.ceil(estimatedMinutes * (1 - completedSets / totalSets)));
  const currentDose = prescription(workout.exercises[session.exercise]!, session.energy);
  const finishedCurrentExercise = session.phase === 'rest' && session.set === currentDose.sets;
  const activeExercise = session.phase === 'complete'
    ? workout.exercises.length - 1
    : Math.min(session.exercise + (finishedCurrentExercise ? 1 : 0), workout.exercises.length - 1);
  const exerciseStatuses = workout.exercises.map((_, index): ExerciseStatus => {
    if (session.phase === 'complete' || index < activeExercise) return 'completed';
    if (index === activeExercise) return 'current';
    return 'upcoming';
  });
  const sectionLabel = session.phase === 'complete'
    ? 'Workout complete'
    : session.phase === 'rest'
      ? 'Recovery'
      : `Set ${session.set} of ${currentDose.sets}`;
  return { completedSets, totalSets, percent, remainingMinutes, sectionLabel, activeExercise, exerciseStatuses };
}

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
