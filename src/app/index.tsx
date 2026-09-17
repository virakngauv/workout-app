import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { palette } from '../components/RemoteButton';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { WeeklyPlanScreen } from '../screens/WeeklyPlanScreen';
import { getCurrentWeekdayIndex, type Energy, type WorkoutId } from '../workout/plan';
import { sessionReducer, startSession, type Session, type SessionAction } from '../workout/session';
import { useRemoteNavigation } from '../workout/useRemoteNavigation';

type Screen = 'plan' | 'session';

export default function Index() {
  const { width, height } = useWindowDimensions();
  const narrow = width < 760;
  const phone = width < 520;
  const compactLandscape = !narrow && height <= 720;
  const baseScale = narrow ? Math.max(0.64, Math.min(0.85, width / 650)) : Math.max(0.55, Math.min(width / 1600, height / 900));
  const scale = compactLandscape ? baseScale * 0.9 : baseScale;
  const [screen, setScreen] = useState<Screen>('plan');
  const [week, setWeek] = useState(1);
  const [currentDay] = useState(() => getCurrentWeekdayIndex());
  const [day, setDay] = useState(() => getCurrentWeekdayIndex());
  const [energy, setEnergy] = useState<Energy>('Steady');
  const [session, setSession] = useState<Session | null>(null);

  const dispatch = useCallback((action: SessionAction) => {
    setSession(current => current ? sessionReducer(current, action) : null);
  }, []);
  const returnToPlan = useCallback(() => {
    setSession(null);
    setScreen('plan');
  }, []);
  const startWorkout = useCallback((workout: WorkoutId, core?: WorkoutId) => {
    setSession(startSession(workout, energy, core));
    setScreen('session');
  }, [energy]);
  const onBack = useCallback(() => {
    if (screen !== 'session' || !session) return false;
    if (session.phase === 'complete') returnToPlan();
    else dispatch({ type: session.paused ? 'resume' : 'pause' });
    return true;
  }, [dispatch, returnToPlan, screen, session]);

  useRemoteNavigation(onBack);
  useEffect(() => {
    if (screen !== 'session' || session?.phase !== 'rest' || session.paused) return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [dispatch, screen, session?.paused, session?.phase]);

  const screenState = screen === 'plan'
    ? 'plan'
    : session?.paused
      ? 'paused'
      : session?.phase ?? 'session';
  const body = screen === 'plan'
    ? <WeeklyPlanScreen week={week} day={day} currentDay={currentDay} energy={energy} scale={scale}
        narrow={narrow} phone={phone} onWeekChange={setWeek} onDayChange={setDay}
        onEnergyChange={setEnergy} onStartWorkout={startWorkout} />
    : session
      ? <ActiveWorkoutScreen session={session} scale={scale} narrow={narrow} compactLandscape={compactLandscape}
          dispatch={dispatch} onReturnToPlan={returnToPlan} />
      : null;

  const footerText = (size: number) => ({ fontFamily: 'Nunito', fontSize: size * scale, color: palette.ink });
  return <View style={styles.root}>
    <ScrollView testID="screen-scroll" contentContainerStyle={[styles.scroll, compactLandscape && styles.compactScroll,
      { paddingHorizontal: narrow ? 22 : 70 * scale, paddingTop: (compactLandscape ? 22 : 44) * scale, paddingBottom: (compactLandscape ? 10 : 18) * scale }]}>
      <View testID={`screen-${screenState}`} style={styles.screenBody}>{body}</View>
      {!compactLandscape && <View style={[styles.footer, { marginTop: 24 * scale, paddingTop: 16 * scale, gap: 34 * scale }]}>
        <View style={styles.legend}><Ionicons name="move-outline" size={25 * scale} color={palette.muted} /><Text style={footerText(19)}>Arrows · Move</Text></View>
        <View style={styles.legend}><Ionicons name="radio-button-on-outline" size={25 * scale} color={palette.muted} /><Text style={footerText(19)}>Select · Choose</Text></View>
        <View style={styles.legend}><Ionicons name="return-down-back-outline" size={25 * scale} color={palette.muted} />
          <Text style={footerText(19)}>Back · {screen === 'session' ? (session?.phase === 'complete' ? 'Plan' : 'Pause / resume') : 'Exit'}</Text></View>
      </View>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cream },
  scroll: { flexGrow: 1 },
  compactScroll: { height: '100%' },
  screenBody: { flex: 1 },
  footer: { borderTopColor: palette.border, borderTopWidth: 2, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  legend: { flexDirection: 'row', gap: 9, alignItems: 'center' },
});
