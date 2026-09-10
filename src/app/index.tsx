import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { RemoteButton, palette, type IconName } from '../components/RemoteButton';
import { ExerciseArt } from '../workout/ExerciseArt';
import { energies, energyDetails, getWeek, prescription, weekdays, workouts, type Energy, type WorkoutId } from '../workout/plan';
import { sessionReducer, startSession, type Session, type SessionAction } from '../workout/session';
import { useRemoteNavigation } from '../workout/useRemoteNavigation';

const energyIcons: Record<Energy, IconName> = { Gentle: 'leaf-outline', Steady: 'sunny-outline', Energized: 'flash-outline' };
type Screen = 'home' | 'plan' | 'session';
export default function Index() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo: require('../../assets/fonts/Baloo2-ExtraBold.ttf'),
    Nunito: require('../../assets/fonts/Nunito-SemiBold.ttf'),
    NunitoBold: require('../../assets/fonts/Nunito-ExtraBold.ttf'),
    ...Ionicons.font,
  });
  const { width, height } = useWindowDimensions();
  const narrow = width < 760;
  const s = narrow ? Math.max(0.64, Math.min(0.85, width / 650)) : Math.max(0.55, Math.min(width / 1600, height / 900));
  const [screen, setScreen] = useState<Screen>('home');
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(0);
  const [workout, setWorkout] = useState<WorkoutId>('A');
  const [energy, setEnergy] = useState<Energy>('Steady');
  const [session, setSession] = useState<Session | null>(null);
  const [homeFocus, setHomeFocus] = useState<'start' | 'plan'>('start');
  const dispatch = useCallback((action: SessionAction) => setSession(current => current ? sessionReducer(current, action) : null), []);
  const goHome = useCallback((focus: 'start' | 'plan' = 'start') => { setHomeFocus(focus); setScreen('home'); }, []);
  const onBack = useCallback(() => {
    if (screen === 'plan') { goHome('plan'); return true; }
    if (screen === 'session' && session) {
      if (session.phase === 'complete') goHome();
      else dispatch({ type: session.paused ? 'resume' : 'pause' });
      return true;
    }
    return false;
  }, [screen, session, goHome, dispatch]);
  useRemoteNavigation(onBack);
  useEffect(() => {
    if (screen !== 'session' || session?.phase !== 'rest' || session.paused) return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [screen, session?.phase, session?.paused, dispatch]);

  const text = (size: number, bold = false) => ({ fontFamily: bold ? 'NunitoBold' : 'Nunito', fontSize: size * s, color: palette.ink });
  const heading = (size: number) => ({ fontFamily: 'Baloo', fontSize: size * s, lineHeight: size * s * 1.05, color: palette.ink });
  const begin = () => { setSession(startSession(workout, energy)); setScreen('session'); };
  if (!fontsLoaded && !fontError) return <View style={styles.loading}><Text>Getting ready…</Text></View>;
  if (fontError) return <View style={styles.loading}><Text>Unable to load the bundled fonts. Please reopen the app.</Text></View>;

  const energyControl = <View style={{ gap: 10 * s }}>
    <Text style={text(28, true)}>Energy level</Text>
    <View accessibilityLabel="Energy level" style={[styles.energy, { borderRadius: 38 * s, padding: 3 * s }]}>
      {energies.map(value => <RemoteButton key={value} label={value} icon={energyIcons[value]} selected={energy === value} scale={s * 0.91}
        onFocus={() => setEnergy(value)} onPress={() => setEnergy(value)} style={styles.energyOption} testID={`energy-${value.toLowerCase()}`} />)}
    </View>
    <Text accessibilityLiveRegion="polite" style={[text(22), { minHeight: 42 * s }]}>
      {energy === 'Steady' && workout !== 'C' ? 'Your original plan · 2 sets per exercise' : energyDetails[energy]}
    </Text>
  </View>;

  let body;
  if (screen === 'home') {
    body = <View key="home" style={[styles.columns, narrow && styles.stacked, { gap: 48 * s }]}>
      <View style={[styles.homeCopy, narrow && { flex: undefined }, { gap: 16 * s }]}>
        <View style={[styles.badge, { paddingVertical: 10 * s, paddingHorizontal: 24 * s }]}><Text style={[text(24, true), { letterSpacing: 2 * s }]}>WEEK {week} · WORKOUT {workout}</Text></View>
        <Text accessibilityRole="header" style={[heading(83), { marginTop: 12 * s }]}>A little stronger,{ '\n' }at your pace.</Text>
        <Text style={[text(36), { marginTop: 4 * s, marginBottom: 8 * s }]}>7 exercises · {energy === 'Steady' ? workouts[workout].duration : 'your pace'}</Text>
        {energyControl}
        <RemoteButton key={`start-${homeFocus}`} label="Start workout" icon="play" primary scale={s} onPress={begin} preferred={homeFocus === 'start'} testID="start-workout" style={{ minHeight: 108 * s }} />
        <RemoteButton label="View weekly plan" icon="book-outline" scale={s} onPress={() => setScreen('plan')} preferred={homeFocus === 'plan'} style={styles.planLink} testID="view-plan" />
      </View>
      <View style={[styles.artColumn, narrow && { flex: undefined, minHeight: 470 }]}><ExerciseArt exercise={workouts[workout].exercises[0]!} scale={s} preview /></View>
    </View>;
  } else if (screen === 'plan') {
    const selected = getWeek(week)[day]!;
    body = <View key="plan" style={{ flex: 1, gap: 26 * s }}>
      <View style={styles.between}><View><Text style={text(23, true)}>YOUR FOUR-WEEK PLAN</Text><Text accessibilityRole="header" style={heading(62)}>One day at a time.</Text></View><RemoteButton label="Back" icon="arrow-back" onPress={() => goHome('plan')} scale={s} /></View>
      <View style={styles.row}>{[1, 2, 3, 4].map(value => <RemoteButton key={value} label={`Week ${value}`} scale={s} selected={week === value} onPress={() => { setWeek(value); setDay(0); }} preferred={value === week} />)}</View>
      <View style={[styles.days, narrow && { flexDirection: 'column' }]}>{getWeek(week).map((entry, index) => <RemoteButton key={`${week}-${index}`} label={`${weekdays[index]}\n${entry.label}`} selected={day === index} scale={s * 0.8} onPress={() => setDay(index)} style={{ flex: 1, paddingHorizontal: 10 * s, minHeight: 110 * s }} />)}</View>
      <View style={[styles.planDetail, { padding: 30 * s, gap: 16 * s }]}>
        <Text style={heading(44)}>{weekdays[day]} · {selected.label}</Text>
        <Text style={text(26)}>{selected.note ?? (selected.workout ? `${workouts[selected.workout].duration} · 7 exercises` : 'A little space to rest and recover.')}</Text>
        {selected.workout && <Text style={text(23)}>{workouts[selected.workout].exercises.map(item => item.name).join(' · ')}</Text>}
        {selected.workout && <RemoteButton label={`Choose Workout ${selected.workout}`} icon="arrow-forward" primary scale={s * 0.85} onPress={() => { setWorkout(selected.workout!); goHome(); }} style={{ alignSelf: 'flex-start', marginTop: 10 * s }} />}
      </View>
      <Text style={[text(22), { color: palette.muted }]}>No need to make up missed workouts. Pick a day that works for you.</Text>
    </View>;
  } else if (session) {
    const item = workouts[session.workout].exercises[session.exercise]!;
    const dose = prescription(item, session.energy);
    const nextItem = session.set < dose.sets ? item : workouts[session.workout].exercises[session.exercise + 1];
    if (session.paused) {
      body = <View key="paused" style={styles.centered}>
        <Text style={text(25, true)}>WORKOUT {session.workout} · {session.energy.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={[heading(80), { marginVertical: 20 * s }]}>Take your time.</Text>
        <Text style={text(28)}>{item.name} · Set {session.set} of {dose.sets}</Text>
        <View style={{ width: narrow ? '100%' : 560 * s, gap: 22 * s, marginTop: 40 * s }}>
          <RemoteButton label="Resume workout" icon="play" primary preferred scale={s} onPress={() => dispatch({ type: 'resume' })} />
          <RemoteButton label="End workout" icon="close-outline" scale={s} onPress={() => { setSession(null); goHome(); }} />
        </View>
      </View>;
    } else if (session.phase === 'complete') {
      body = <View key="complete" style={styles.centered}>
        <Ionicons name="checkmark-circle-outline" size={96 * s} color="#A56F59" />
        <Text accessibilityRole="header" style={[heading(80), { marginVertical: 20 * s }]}>You showed up.</Text>
        <Text style={text(30)}>Workout {session.workout} complete · {session.completedSets} sets</Text>
        <Text style={[text(27), { marginTop: 16 * s }]}>A little stronger, at your pace.</Text>
        <RemoteButton label="Back to home" icon="home-outline" primary preferred scale={s} onPress={() => { setSession(null); goHome(); }} style={{ marginTop: 48 * s, width: narrow ? '100%' : 540 * s }} />
      </View>;
    } else {
      const resting = session.phase === 'rest';
      body = <View key={`${session.exercise}-${session.set}-${session.phase}`} style={[styles.columns, narrow && styles.stacked, { gap: 48 * s }]}>
        <View style={[styles.homeCopy, { gap: 24 * s }]}>
          <Text style={text(23, true)}>WORKOUT {session.workout} · EXERCISE {session.exercise + 1} OF 7</Text>
          <Text accessibilityRole="header" style={heading(resting ? 78 : 65)}>{resting ? 'A little breather.' : item.name}</Text>
          {resting ? <>
            <Text style={[heading(105), { fontVariant: ['tabular-nums'] }]}>{Math.floor(session.remaining / 60)}:{String(session.remaining % 60).padStart(2, '0')}</Text>
            <Text style={text(27)}>{session.remaining ? 'Rest, then continue when you’re ready.' : 'Ready whenever you are.'}</Text>
            <Text style={text(25)}>Next: {nextItem?.name}{nextItem === item ? ` · Set ${session.set + 1}` : ''}</Text>
          </> : <>
            <Text style={[heading(67), { marginTop: 12 * s }]}>{dose.target}</Text>
            <Text style={text(31)}>Set {session.set} of {dose.sets} · {item.load}</Text>
            {(item.unit === 'side' || item.unit === 'leg' || item.unit === 'seconds/side') && <Text style={text(23)}>Complete both sides before marking this set done.</Text>}
          </>}
          <Text style={[text(22), { color: palette.muted }]}>{session.energy} energy · {dose.rest} sec rest between sets</Text>
          <View style={{ marginTop: 'auto', gap: 20 * s }}>
            <RemoteButton label={resting ? (session.remaining ? 'Continue when ready' : 'Start next set') : 'Set complete'} icon={resting ? 'play' : 'checkmark'} primary preferred scale={s} onPress={() => dispatch({ type: resting ? 'continue' : 'complete-set' })} testID="session-primary" />
            <RemoteButton label="Pause workout" icon="pause" scale={s} onPress={() => dispatch({ type: 'pause' })} />
          </View>
        </View>
        <View style={[styles.artColumn, narrow && { minHeight: 430 }]}><ExerciseArt exercise={resting && nextItem ? nextItem : item} scale={s} /></View>
      </View>;
    }
  }
  return <View style={styles.root}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: narrow ? 22 : 88 * s, paddingTop: 54 * s, paddingBottom: 20 * s }]}>
      {body}
      <View style={[styles.footer, { marginTop: 28 * s, paddingTop: 18 * s, gap: 38 * s }]}>
        <View style={styles.legend}><Ionicons name="move-outline" size={27 * s} color={palette.muted} /><Text style={text(21)}>Arrows · Move</Text></View>
        <View style={styles.legend}><Ionicons name="radio-button-on-outline" size={27 * s} color={palette.muted} /><Text style={text(21)}>Select · Choose</Text></View>
        <View style={styles.legend}><Ionicons name="return-down-back-outline" size={27 * s} color={palette.muted} /><Text style={text(21)}>Back · {screen === 'session' ? (session?.phase === 'complete' ? 'Home' : 'Pause / resume') : 'Return'}</Text></View>
      </View>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  loading: { flex: 1, backgroundColor: palette.cream, justifyContent: 'center', alignItems: 'center' },
  scroll: { flexGrow: 1 },
  columns: { flex: 1, flexDirection: 'row' },
  stacked: { flexDirection: 'column' },
  homeCopy: { flex: 1, justifyContent: 'center' },
  artColumn: { flex: 1.08 },
  badge: { alignSelf: 'flex-start', borderRadius: 40, backgroundColor: '#FAD6C8' },
  energy: { flexDirection: 'row', backgroundColor: '#FCE6DD', borderColor: '#F4D4C6', borderWidth: 2 },
  energyOption: { flex: 1, paddingHorizontal: 6, borderColor: 'transparent', backgroundColor: 'transparent' },
  planLink: { alignSelf: 'center', minWidth: '65%' },
  footer: { borderTopColor: palette.border, borderTopWidth: 2, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  legend: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: 20, alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  days: { flexDirection: 'row', gap: 8 },
  planDetail: { backgroundColor: '#FDE8DC', borderRadius: 30 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
});
