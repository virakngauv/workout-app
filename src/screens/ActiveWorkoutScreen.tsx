import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { RemoteButton, palette } from '../components/RemoteButton';
import { ExerciseArt } from '../workout/ExerciseArt';
import { prescription, workouts } from '../workout/plan';
import { getSessionProgress, type Session, type SessionAction } from '../workout/session';

type Props = {
  session: Session;
  scale: number;
  narrow: boolean;
  compactLandscape: boolean;
  dispatch: (action: SessionAction) => void;
  onReturnToPlan: () => void;
};

export function ActiveWorkoutScreen({ session, scale, narrow, compactLandscape, dispatch, onReturnToPlan }: Props) {
  const workout = workouts[session.workout];
  const item = workout.exercises[session.exercise]!;
  const dose = prescription(item, session.energy);
  const progress = getSessionProgress(session);
  const nextItem = session.set < dose.sets ? item : workout.exercises[session.exercise + 1];
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

  const progressHeader = <View style={[styles.progressHeader, { gap: 9 * scale }]}>
    <View style={styles.progressSummary}>
      <Text style={text(20, true)}>WORKOUT {session.workout} · {progress.sectionLabel.toUpperCase()}</Text>
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
    {workout.exercises.map((exercise, index) => {
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
        <Text style={[text(24), { marginTop: 8 * scale }]}>{item.name} · {progress.sectionLabel}</Text>
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
        <Text style={[text(25), { marginTop: 8 * scale }]}>Workout {session.workout} complete · {session.completedSets} sets</Text>
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
          <Text style={text(19, true)}>{resting ? 'RECOVERY' : `EXERCISE ${session.exercise + 1} OF ${workout.exercises.length} · ${progress.sectionLabel.toUpperCase()}`}</Text>
        </View>
        <Text accessibilityRole="header" style={heading(resting ? 58 : 55)}>{resting ? 'A little breather.' : item.name}</Text>
        {resting ? <>
          <Text style={[heading(82), { fontVariant: ['tabular-nums'] }]}>{Math.floor(session.remaining / 60)}:{String(session.remaining % 60).padStart(2, '0')}</Text>
          <Text style={text(22)}>{session.remaining ? 'Rest, then continue when you are ready.' : 'Ready whenever you are.'}</Text>
          <Text style={text(21, true)}>Next: {nextItem?.name}{nextItem === item ? ` · Set ${session.set + 1} of ${dose.sets}` : ''}</Text>
        </> : <>
          <Text style={heading(52)}>{dose.target}</Text>
          <Text style={text(25, true)}>{progress.sectionLabel} · {item.load}</Text>
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
  sectionBadge: { alignSelf: 'flex-start', backgroundColor: '#FFD2BF' },
  controls: { marginTop: 'auto' },
  artColumn: { flex: 1.05 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
