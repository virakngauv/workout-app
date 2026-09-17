import { prescription, workouts, type Energy, type Exercise, type WorkoutId } from './plan';

export type Session = {
  workout: WorkoutId;
  core?: WorkoutId;
  energy: Energy;
  exercise: number;
  set: number;
  completedSets: number;
  phase: 'exercise' | 'rest' | 'complete';
  remaining: number;
  paused: boolean;
  exerciseTimerRemaining: number | null;
  exerciseTimerRunning: boolean;
};
export type SessionAction =
  | { type: 'complete-set' }
  | { type: 'continue' }
  | { type: 'tick' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'timer-toggle' }
  | { type: 'timer-reset' };
export type SessionPosition = { exercise: number; set: number };

export const startSession = (workout: WorkoutId, energy: Energy, core?: WorkoutId): Session => ({
  workout,
  core,
  energy,
  exercise: 0,
  set: 1,
  completedSets: 0,
  phase: 'exercise',
  remaining: 0,
  paused: false,
  exerciseTimerRemaining: prescription(workouts[workout].exercises[0]!, energy).durationSeconds,
  exerciseTimerRunning: false,
});

export function getSessionExercises(session: Pick<Session, 'workout' | 'core'>): Exercise[] {
  return [session.workout, session.core]
    .filter((id): id is WorkoutId => Boolean(id))
    .flatMap(id => workouts[id].exercises);
}

export function getSessionTitle(session: Pick<Session, 'workout' | 'core'>) {
  return [workouts[session.workout].title, session.core ? workouts[session.core].title : null].filter(Boolean).join(' + ');
}

export function getNextSessionPosition(session: Session): SessionPosition | null {
  const exercises = getSessionExercises(session);
  for (let exercise = session.exercise + 1; exercise < exercises.length; exercise += 1) {
    if (prescription(exercises[exercise]!, session.energy).sets >= session.set) return { exercise, set: session.set };
  }
  const nextSet = session.set + 1;
  const exercise = exercises.findIndex(item => prescription(item, session.energy).sets >= nextSet);
  return exercise === -1 ? null : { exercise, set: nextSet };
}

export type ExerciseStatus = 'completed' | 'current' | 'upcoming';
export type SessionProgress = {
  completedSets: number;
  totalSets: number;
  percent: number;
  remainingMinutes: number;
  sectionLabel: string;
  activeExercise: number;
  activeSet: number;
  exerciseStatuses: ExerciseStatus[];
};

export function totalPrescribedSets(workout: WorkoutId, energy: Energy, core?: WorkoutId) {
  return getSessionExercises({ workout, core }).reduce((total, item) => total + prescription(item, energy).sets, 0);
}

export function getSessionProgress(session: Session): SessionProgress {
  const exercises = getSessionExercises(session);
  const totalSets = totalPrescribedSets(session.workout, session.energy, session.core);
  const completedSets = Math.min(session.completedSets, totalSets);
  const percent = totalSets === 0 ? 100 : Math.round(completedSets / totalSets * 100);
  const workout = workouts[session.workout];
  const baselineSets = workout.exercises.reduce((total, item) => total + item.sets, 0);
  const duration = workout.durationMinutes;
  const minutesPerSet = duration && baselineSets > 0 ? ((duration[0] + duration[1]) / 2) / baselineSets : 0;
  const estimatedMinutes = minutesPerSet * totalSets;
  const remainingMinutes = session.phase === 'complete' ? 0 : Math.max(1, Math.ceil(estimatedMinutes * (1 - completedSets / totalSets)));
  const nextPosition = session.phase === 'rest' ? getNextSessionPosition(session) : null;
  const activeExercise = session.phase === 'complete' ? exercises.length - 1 : nextPosition?.exercise ?? session.exercise;
  const activeSet = session.phase === 'complete' ? session.set : nextPosition?.set ?? session.set;
  const exerciseStatuses = exercises.map((item, index): ExerciseStatus => {
    if (session.phase === 'complete') return 'completed';
    const prescribedSets = prescription(item, session.energy).sets;
    if (prescribedSets < activeSet || (prescribedSets === activeSet && index < activeExercise)) return 'completed';
    if (index === activeExercise) return 'current';
    return 'upcoming';
  });
  const currentDose = prescription(exercises[session.exercise]!, session.energy);
  const sectionLabel = session.phase === 'complete'
    ? 'Workout complete'
    : session.phase === 'rest'
      ? 'Recovery'
      : `Set ${session.set} of ${currentDose.sets}`;
  return { completedSets, totalSets, percent, remainingMinutes, sectionLabel, activeExercise, activeSet, exerciseStatuses };
}

export function sessionReducer(state: Session, action: SessionAction): Session {
  if (action.type === 'pause') return state.phase === 'complete' ? state : { ...state, paused: true };
  if (action.type === 'resume') return { ...state, paused: false };
  if (state.paused || state.phase === 'complete') return state;
  const exercises = getSessionExercises(state);
  const item = exercises[state.exercise]!;
  const target = prescription(item, state.energy);
  if (action.type === 'timer-toggle' && state.phase === 'exercise' && target.durationSeconds) {
    return state.exerciseTimerRemaining === 0
      ? { ...state, exerciseTimerRemaining: target.durationSeconds, exerciseTimerRunning: true }
      : { ...state, exerciseTimerRunning: !state.exerciseTimerRunning };
  }
  if (action.type === 'timer-reset' && state.phase === 'exercise' && target.durationSeconds) {
    return { ...state, exerciseTimerRemaining: target.durationSeconds, exerciseTimerRunning: false };
  }
  if (action.type === 'tick') {
    if (state.phase === 'rest') return { ...state, remaining: Math.max(0, state.remaining - 1) };
    if (state.phase === 'exercise' && state.exerciseTimerRunning && state.exerciseTimerRemaining !== null) {
      const exerciseTimerRemaining = Math.max(0, state.exerciseTimerRemaining - 1);
      return { ...state, exerciseTimerRemaining, exerciseTimerRunning: exerciseTimerRemaining > 0 };
    }
    return state;
  }
  if (action.type === 'complete-set' && state.phase === 'exercise') {
    const next = getNextSessionPosition(state);
    return {
      ...state,
      completedSets: state.completedSets + 1,
      phase: next ? 'rest' : 'complete',
      remaining: next ? target.rest : 0,
      exerciseTimerRunning: false,
    };
  }
  if (action.type === 'continue' && state.phase === 'rest') {
    const next = getNextSessionPosition(state);
    if (!next) return { ...state, phase: 'complete', remaining: 0, exerciseTimerRunning: false };
    const nextTimer = prescription(exercises[next.exercise]!, state.energy).durationSeconds;
    return {
      ...state,
      ...next,
      phase: 'exercise',
      remaining: 0,
      exerciseTimerRemaining: nextTimer,
      exerciseTimerRunning: false,
    };
  }
  return state;
}
