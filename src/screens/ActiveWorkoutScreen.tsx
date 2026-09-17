import Ionicons from '@expo/vector-icons/Ionicons';
import { useAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { RemoteButton, palette } from '../components/RemoteButton';
import { ExerciseArt } from '../workout/ExerciseArt';
import { prescription } from '../workout/plan';
import {
  getNextSessionPosition,
  getSessionExercises,
  getSessionProgress,
  getSessionTitle,
  type Session,
  type SessionAction,
} from '../workout/session';

type Props = {
  session: Session;
  scale: number;
  narrow: boolean;
  compactLandscape: boolean;
  dispatch: (action: SessionAction) => void;
  onReturnToPlan: () => void;
};

function replay(player: AudioPlayer) {
  void player.seekTo(0).then(() => player.play()).catch(() => undefined);
}

function formatTimer(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function ActiveWorkoutScreen({ session, scale, narrow, compactLandscape, dispatch, onReturnToPlan }: Props) {
  const exercises = getSessionExercises(session);
  const sessionTitle = getSessionTitle(session);
  const item = exercises[session.exercise]!;
  const dose = prescription(item, session.energy);
  const shortBeep = useAudioPlayer(require('../../assets/audio/timer-short.wav'));
  const longBeep = useAudioPlayer(require('../../assets/audio/timer-long.wav'));
  const previousTimer = useRef({ exercise: session.exercise, set: session.set, remaining: session.exerciseTimerRemaining });
  const progress = getSessionProgress(session);
  const nextPosition = getNextSessionPosition(session);
  const nextItem = nextPosition ? exercises[nextPosition.exercise] : undefined;
  const text = (size: number, bold = false) => ({
    color: palette.ink,
    fontFamily: bold ? 'NunitoBold' : 'Nunito',
    fontSize: size * scale,
  });
  const heading = (size: number) => ({
    color: palette.ink,
    fontFamily: 'Baloo',
    fontSize: size * scale,
    lineHeight: size * scale * 1.03,
  });

  useEffect(() => {
    const previous = previousTimer.current;
    previousTimer.current = { exercise: session.exercise, set: session.set, remaining: session.exerciseTimerRemaining };
    if (previous.exercise !== session.exercise || previous.set !== session.set
      || previous.remaining === null || session.exerciseTimerRemaining === null) return;
    if (session.exerciseTimerRemaining >= previous.remaining) return;
    if (session.exerciseTimerRemaining === 2 || session.exerciseTimerRemaining === 1) replay(shortBeep);
    if (session.exerciseTimerRemaining === 0) replay(longBeep);
  }, [longBeep, session.exercise, session.exerciseTimerRemaining, session.set, shortBeep]);

  const progressHeader = <View style={[styles.progressHeader, { gap: 9 * scale }]}>
    <View style={styles.progressSummary}>
      <Text style={text(20, true)}>{sessionTitle.toUpperCase()} · {progress.sectionLabel.toUpperCase()}</Text>
      <Text testID="remaining-summary" accessibilityLiveRegion="polite" style={text(19, true)}>
        {progress.remainingMinutes ? `About ${progress.remainingMinutes} min left` : 'All done'}
      </Text>
    </View>
    <View accessibilityRole="progressbar" accessibilityLabel="Overall workout progress"
      accessibilityValue={{ min: 0, max: 100, now: progress.percent }} style={[styles.progressTrack, { height: 14 * scale, borderRadius: 8 * scale }]}>
      <View style={[styles.progressFill, { width: `${progress.percent}%` as DimensionValue, borderRadius: 8 * scale }]} />
    </View>
    <Text testID="progress-summary" style={text(18)}>{progress.completedSets} of {progress.totalSets} sets complete · {progress.percent}%</Text>
  </View>;

  const roadmap = <View accessibilityLabel="Workout sections" style={[styles.roadmap, { gap: 6 * scale }]}>
    {exercises.map((exercise, index) => {
      const status = progress.exerciseStatuses[index]!;
      return <View key={exercise.id} accessible accessibilityLabel={`${exercise.name}, ${status}`}
        style={[styles.roadmapItem, status === 'completed' && styles.roadmapCompleted,
          status === 'current' && styles.roadmapCurrent, { borderRadius: 14 * scale, padding: 7 * scale }]}>
        <Ionicons name={status === 'completed' ? 'checkmark' : status === 'current' ? 'play' : 'ellipse-outline'}
          size={17 * scale} color={status === 'upcoming' ? palette.muted : palette.ink} />
        <Text numberOfLines={1} style={[text(compactLandscape ? 15 : 17, true), status === 'upcoming' && { color: palette.muted }]}>
          {compactLandscape ? index + 1 : exercise.name}
        </Text>
      </View>;
    })}
  </View>;

  if (session.paused) {
    return <View style={[styles.root, { gap: 16 * scale }]}>
      {progressHeader}
      {roadmap}
      <View style={styles.centered}>
        <Ionicons name="pause-circle-outline" size={74 * scale} color="#A56F59" />
        <Text accessibilityRole="header" style={[heading(66), { marginTop: 10 * scale }]}>Workout paused</Text>
        <Text style={[text(24), { marginTop: 8 * scale }]}>{exercises[progress.activeExercise]?.name} · Set {progress.activeSet}</Text>
        <View style={{ width: narrow ? '100%' : 560 * scale, gap: 14 * scale, marginTop: 26 * scale }}>
          <RemoteButton label="Resume workout" icon="play" primary preferred scale={scale * 0.85}
            onPress={() => dispatch({ type: 'resume' })} />
          <RemoteButton label="End workout and return to plan" icon="arrow-back" scale={scale * 0.75} onPress={onReturnToPlan} />
        </View>
      </View>
    </View>;
  }

  if (session.phase === 'complete') {
    return <View style={[styles.root, { gap: 16 * scale }]}>
      {progressHeader}
      {roadmap}
      <View style={styles.centered}>
        <Ionicons name="checkmark-circle-outline" size={82 * scale} color="#A56F59" />
        <Text accessibilityRole="header" style={[heading(68), { marginTop: 10 * scale }]}>You showed up.</Text>
        <Text style={[text(25), { marginTop: 8 * scale }]}>{sessionTitle} complete · {session.completedSets} sets</Text>
        <RemoteButton label="Back to weekly plan" icon="calendar-outline" primary preferred scale={scale * 0.85}
          onPress={onReturnToPlan} style={{ marginTop: 28 * scale, width: narrow ? '100%' : 540 * scale }} />
      </View>
    </View>;
  }

  const resting = session.phase === 'rest';
  return <View style={[styles.root, { gap: 12 * scale }]}>
    {progressHeader}
    {roadmap}
    <View style={[styles.columns, narrow && styles.stacked, { gap: 30 * scale }]}>
      <View style={[styles.workoutCopy, { gap: 12 * scale }]}>
        <View style={[styles.sectionBadge, { borderRadius: 22 * scale, paddingHorizontal: 14 * scale, paddingVertical: 6 * scale }]}>
          <Text style={text(19, true)}>{resting ? 'RECOVERY' : `EXERCISE ${session.exercise + 1} OF ${exercises.length} · ${progress.sectionLabel.toUpperCase()}`}</Text>
        </View>
        <Text testID="current-exercise-name" accessibilityRole="header" style={heading(resting ? 58 : 55)}>{resting ? 'A little breather.' : item.name}</Text>
        {resting ? <>
          <Text style={[heading(82), { fontVariant: ['tabular-nums'] }]}>{Math.floor(session.remaining / 60)}:{String(session.remaining % 60).padStart(2, '0')}</Text>
          <Text style={text(22)}>{session.remaining ? 'Rest, then continue when you are ready.' : 'Ready whenever you are.'}</Text>
          <Text testID="next-exercise-summary" style={text(21, true)}>Next: {nextItem?.name}{nextPosition ? ` · Set ${nextPosition.set} of ${prescription(nextItem!, session.energy).sets}` : ''}</Text>
        </> : <>
          <Text style={heading(52)}>{dose.target}</Text>
          <Text style={text(25, true)}>{progress.sectionLabel} · {item.load}</Text>
          {dose.durationSeconds && session.exerciseTimerRemaining !== null && <View testID="exercise-timer"
            style={[styles.exerciseTimer, { borderRadius: 18 * scale, padding: 10 * scale, gap: 10 * scale }]}>
            <View style={styles.timerCopy}>
              <Text style={text(16, true)}>{item.unit === 'seconds/side' ? 'TIMER · EACH SIDE' : 'EXERCISE TIMER'}</Text>
              <Text testID="exercise-timer-countdown" accessibilityLiveRegion="polite"
                style={[heading(43), { fontVariant: ['tabular-nums'] }]}>{formatTimer(session.exerciseTimerRemaining)}</Text>
            </View>
            <View style={[styles.timerActions, { gap: 7 * scale }]}>
              <RemoteButton testID="exercise-timer-toggle"
                label={session.exerciseTimerRemaining === 0 ? 'Restart timer' : session.exerciseTimerRunning ? 'Pause timer'
                  : session.exerciseTimerRemaining === dose.durationSeconds ? 'Start timer' : 'Resume timer'}
                icon={session.exerciseTimerRunning ? 'pause' : 'timer-outline'} scale={scale * 0.55}
                onPress={() => dispatch({ type: 'timer-toggle' })} />
              <RemoteButton testID="exercise-timer-reset" label="Reset" icon="refresh" scale={scale * 0.55}
                onPress={() => dispatch({ type: 'timer-reset' })} />
            </View>
          </View>}
          {(item.unit === 'side' || item.unit === 'leg' || item.unit === 'seconds/side') &&
            <Text style={text(19)}>Complete both sides before marking this set done.</Text>}
        </>}
        <Text style={[text(18), { color: palette.muted }]}>{session.energy} energy · {dose.rest} sec recovery between sets</Text>
        <View style={[styles.controls, { gap: 10 * scale }]}>
          <RemoteButton label={resting ? (session.remaining ? 'Continue when ready' : 'Start next set') : 'Set complete'}
            icon={resting ? 'play' : 'checkmark'} primary preferred scale={scale * 0.8}
            onPress={() => dispatch({ type: resting ? 'continue' : 'complete-set' })} testID="session-primary" />
          <RemoteButton label="Pause workout" icon="pause" scale={scale * 0.68} onPress={() => dispatch({ type: 'pause' })} />
        </View>
      </View>
      <View style={[styles.artColumn, narrow && { minHeight: 390 * scale }]}>
        <ExerciseArt exercise={resting && nextItem ? nextItem : item} scale={scale * (compactLandscape ? 0.9 : 1)} />
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progressHeader: { backgroundColor: '#FFF6EE', borderColor: palette.border, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  progressSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  progressTrack: { overflow: 'hidden', backgroundColor: '#EED8CE' },
  progressFill: { height: '100%', backgroundColor: palette.coral },
  roadmap: { flexDirection: 'row' },
  roadmapItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#FFF6EE', borderColor: palette.border, borderWidth: 2 },
  roadmapCompleted: { backgroundColor: '#F5D7C9', borderColor: '#D89982' },
  roadmapCurrent: { backgroundColor: '#FFD2BF', borderColor: palette.ink },
  columns: { flex: 1, flexDirection: 'row' },
  stacked: { flexDirection: 'column' },
  workoutCopy: { flex: 1, justifyContent: 'center' },
  exerciseTimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF6EE', borderColor: palette.border, borderWidth: 2 },
  timerCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerActions: { flexDirection: 'row' },
  sectionBadge: { alignSelf: 'flex-start', backgroundColor: '#FFD2BF' },
  controls: { marginTop: 'auto' },
  artColumn: { flex: 1.05 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
