import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { RemoteButton, palette, type IconName } from '../components/RemoteButton';
import {
  energies,
  energyDetails,
  getWeek,
  weekGoals,
  weekdays,
  workouts,
  type Energy,
  type WorkoutId,
} from '../workout/plan';

const energyIcons: Record<Energy, IconName> = {
  Gentle: 'leaf-outline',
  Steady: 'sunny-outline',
  Energized: 'flash-outline',
};

type Props = {
  week: number;
  currentWeek: number;
  day: number;
  currentDay: number;
  energy: Energy;
  scale: number;
  narrow: boolean;
  phone: boolean;
  onWeekChange: (week: number) => void;
  onDayChange: (day: number) => void;
  onEnergyChange: (energy: Energy) => void;
  onStartWorkout: (workout: WorkoutId, core?: WorkoutId) => void;
};

export function WeeklyPlanScreen({
  week,
  currentWeek,
  day,
  currentDay,
  energy,
  scale,
  narrow,
  phone,
  onWeekChange,
  onDayChange,
  onEnergyChange,
  onStartWorkout,
}: Props) {
  const [preferredDay] = useState(() => day);
  const selected = getWeek(week)[day]!;
  const workout = selected.workout ? workouts[selected.workout] : null;
  const core = selected.core ? workouts[selected.core] : null;
  const exercises = [...(workout?.exercises ?? []), ...(core?.exercises ?? [])];
  const sessionLabel = [workout?.title, core?.title].filter(Boolean).join(' + ');
  const currentWeekdayLabel = week === currentWeek ? 'Today' : 'Current weekday';
  const text = (size: number, bold = false) => ({
    color: palette.ink,
    fontFamily: bold ? 'NunitoBold' : 'Nunito',
    fontSize: size * scale,
  });
  const heading = (size: number) => ({
    color: palette.ink,
    fontFamily: 'Baloo',
    fontSize: size * scale,
    lineHeight: size * scale * 1.05,
  });

  return <View style={[styles.root, { gap: 18 * scale }]}>
    <View style={[styles.header, narrow && styles.headerNarrow]}>
      <View style={[styles.brand, { gap: 12 * scale }]}>
        <Image accessibilityIgnoresInvertColors source={require('../../assets/brand-mark.png')} resizeMode="contain"
          style={{ width: 58 * scale, height: 58 * scale }} />
        <View>
          <Text style={text(20, true)}>YOUR SIX-WEEK PLAN</Text>
          <Text accessibilityRole="header" style={heading(phone ? 48 : 58)}>Weekly Plan</Text>
        </View>
      </View>
      <View accessibilityLabel="Choose plan week" style={[styles.weekSelector, { gap: 8 * scale }]}>
        {[1, 2, 3, 4, 5, 6].map(value => <RemoteButton key={value} label={value === 6 ? 'Week 6+' : `Week ${value}`} selected={week === value}
          scale={scale * 0.68} onPress={() => onWeekChange(value)} testID={`week-${value}`} />)}
      </View>
    </View>

    <View accessibilityLabel="Choose a day" style={[styles.days, narrow && styles.daysNarrow, { gap: 8 * scale }]}>
      {getWeek(week).map((entry, index) => <RemoteButton key={index}
        label={`${weekdays[index]}${index === currentDay ? ` · ${currentWeekdayLabel}` : ''}\n${entry.label}`}
        selected={day === index} preferred={preferredDay === index} scale={scale * 0.72}
        onFocus={() => onDayChange(index)} onPress={() => onDayChange(index)} testID={`day-${index}`}
        style={[styles.day, narrow && styles.dayNarrow, { minHeight: 90 * scale }]} />)}
    </View>

    <View style={[styles.detail, narrow && styles.detailNarrow, { borderRadius: 28 * scale, padding: 24 * scale, gap: 24 * scale }]}>
      <View style={[styles.detailCopy, { gap: 10 * scale }]}>
        <View style={[styles.selectedBadge, { borderRadius: 20 * scale, paddingHorizontal: 14 * scale, paddingVertical: 6 * scale }]}>
          <Text testID="selected-day-label" style={text(18, true)}>
            {weekdays[day]}{day === currentDay ? ` · ${currentWeekdayLabel.toUpperCase()}` : ''}
          </Text>
        </View>
        <Text accessibilityRole="header" style={heading(phone ? 42 : 48)}>{selected.label}</Text>
        <Text style={text(23)}>{selected.note ?? (workout
          ? `${workout.duration}${core ? ` + ${core.duration}` : ''} · ${exercises.length} exercises`
          : 'A little space to rest and recover.')}</Text>
        {workout
          ? <View style={{ gap: 8 * scale }}>
              <Text style={[text(19), styles.exerciseList]}>{workout.exercises.map(item => item.name).join(' · ')}</Text>
              {core && <Text testID="core-plan" style={[text(19), styles.exerciseList]}>
                {core.title}: {core.exercises.map(item => item.name).join(' · ')}
              </Text>}
            </View>
          : <View testID="rest-day-state" style={[styles.restState, { gap: 12 * scale, marginTop: 8 * scale }]}>
              <Ionicons name="leaf-outline" size={34 * scale} color={palette.muted} />
              <Text style={text(21, true)}>No strength workout scheduled. Browse another day whenever you like.</Text>
            </View>}
      </View>

      {selected.workout && workout && <View style={[styles.actions, narrow && styles.actionsNarrow, { gap: 10 * scale }]}>
        <Text style={text(21, true)}>Energy level</Text>
        <View accessibilityLabel="Energy level" style={[styles.energy, phone && styles.energyPhone,
          { borderRadius: 30 * scale, padding: 3 * scale }]}>
          {energies.map(value => <RemoteButton key={value} label={value} icon={energyIcons[value]}
            selected={energy === value} scale={scale * 0.66} onFocus={() => onEnergyChange(value)}
            onPress={() => onEnergyChange(value)} testID={`energy-${value.toLowerCase()}`} style={styles.energyOption} />)}
        </View>
        <Text accessibilityLiveRegion="polite" style={[text(18), { color: palette.muted }]}>{energyDetails[energy]}</Text>
        <RemoteButton label={`Start ${sessionLabel}`} icon="play" primary scale={scale * 0.82}
          onPress={() => onStartWorkout(selected.workout!, selected.core)} testID="start-workout" style={{ marginTop: 4 * scale }} />
      </View>}
    </View>

    <Text style={[text(18), { color: palette.muted }]}>Goal · {weekGoals[week - 1]}</Text>
    <Text style={[text(18), { color: palette.muted }]}>Planning mode · Pick a day, review the workout, then start when you are ready.</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerNarrow: { alignItems: 'stretch', flexDirection: 'column', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center' },
  weekSelector: { flexDirection: 'row', flexWrap: 'wrap' },
  days: { flexDirection: 'row' },
  daysNarrow: { flexWrap: 'wrap' },
  day: { flex: 1, paddingHorizontal: 6 },
  dayNarrow: { flexBasis: '47%' },
  detail: { flex: 1, flexDirection: 'row', backgroundColor: '#FDE8DC', borderColor: palette.border, borderWidth: 2 },
  detailNarrow: { flexDirection: 'column' },
  detailCopy: { flex: 1.35, justifyContent: 'center' },
  selectedBadge: { alignSelf: 'flex-start', backgroundColor: '#FFD2BF' },
  exerciseList: { color: palette.muted, lineHeight: 28 },
  restState: { flexDirection: 'row', alignItems: 'center' },
  actions: { flex: 1, justifyContent: 'center' },
  actionsNarrow: { flex: undefined },
  energy: { flexDirection: 'row', backgroundColor: '#FFF6EE', borderColor: palette.border, borderWidth: 2 },
  energyPhone: { flexDirection: 'column' },
  energyOption: { flex: 1, paddingHorizontal: 4, borderColor: 'transparent', backgroundColor: 'transparent' },
});
