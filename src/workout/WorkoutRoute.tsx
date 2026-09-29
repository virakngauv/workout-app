import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { palette } from '../components/RemoteButton';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { PlanGuidanceScreen } from '../screens/PlanGuidanceScreen';
import { WeeklyPlanScreen } from '../screens/WeeklyPlanScreen';
import { getCurrentWeekdayIndex, getWeek, type CoreRounds, type Energy } from '../workout/plan';
import { sessionReducer, startSession, type Session, type SessionAction } from '../workout/session';
import { useRemoteNavigation } from '../workout/useRemoteNavigation';

type Screen = 'plan' | 'guidance' | 'session';

function usePlanState() {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [week, setWeek] = useState(currentWeek);
  const [currentDay] = useState(() => getCurrentWeekdayIndex());
  const [day, setDay] = useState(() => getCurrentWeekdayIndex());
  const [energy, setEnergy] = useState<Energy>('Steady');
  const [coreRounds, setCoreRounds] = useState<CoreRounds>(1);

  return { currentWeek, setCurrentWeek, week, setWeek, currentDay, day, setDay,
    energy, setEnergy, coreRounds, setCoreRounds };
}

const PlanContext = createContext<ReturnType<typeof usePlanState> | null>(null);

export function PlanProvider({ children }: PropsWithChildren) {
  const plan = usePlanState();
  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>;
}

export function WorkoutRoute({ screen }: { screen: Screen }) {
  const plan = useContext(PlanContext);
  if (!plan) throw new Error('Workout routes require PlanProvider');
  return <WorkoutRouteContent screen={screen} plan={plan} />;
}

function WorkoutRouteContent({ screen, plan }: { screen: Screen; plan: ReturnType<typeof usePlanState> }) {
  const router = useRouter();
  const [focused, setFocused] = useState(true);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const { currentWeek, setCurrentWeek, week, setWeek, currentDay, day, setDay,
    energy, setEnergy, coreRounds, setCoreRounds } = plan;

  const { width, height } = useWindowDimensions();
  const narrow = width < 760;
  const phone = width < 520;
  const compactLandscape = !narrow && height <= 720;
  const baseScale = narrow
    ? Math.max(0.64, Math.min(0.85, width / 650))
    : Math.max(0.55, Math.min(1, width / 1600, height / 900));
  const scale = compactLandscape ? baseScale * 0.9 : baseScale;

  const selected = getWeek(week)[day]!;
  const [session, setSession] = useState<Session | null>(() =>
    screen === 'session' && selected.workout
      ? startSession(selected.workout, energy, selected.core, coreRounds)
      : null);

  const dispatch = useCallback((action: SessionAction) => {
    setSession(current => current ? sessionReducer(current, action) : null);
  }, []);
  const returnToPlan = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);
  const startWorkout = useCallback(() => router.push('/workout'), [router]);
  const onBack = useCallback(() => {
    if (!focused || !router.canGoBack()) return false;
    router.back();
    return true;
  }, [focused, router]);

  useRemoteNavigation(onBack);
  const sessionTimerMode = !focused || screen !== 'session' || session?.paused
    ? null
    : session?.phase === 'rest' && session.remaining > 0
      ? 'rest'
      : session?.phase === 'exercise' && session.exerciseTimerRunning
        ? 'exercise'
        : null;
  useEffect(() => {
    if (!sessionTimerMode) return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [dispatch, sessionTimerMode]);

  const screenState = screen === 'plan'
    ? 'plan'
    : screen === 'guidance'
      ? 'guidance'
      : session?.paused
        ? 'paused'
        : session?.phase ?? 'session';
  const body = screen === 'plan'
    ? <WeeklyPlanScreen week={week} currentWeek={currentWeek} day={day} currentDay={currentDay} energy={energy}
        coreRounds={coreRounds} scale={scale} narrow={narrow} phone={phone} onWeekChange={setWeek}
        onSetCurrentWeek={setCurrentWeek} onDayChange={setDay} onEnergyChange={setEnergy}
        onCoreRoundsChange={setCoreRounds} onOpenGuidance={() => router.push('/guidance')} onStartWorkout={startWorkout} />
    : screen === 'guidance'
      ? <PlanGuidanceScreen scale={scale} narrow={narrow} onReturnToPlan={returnToPlan} />
      : session
        ? <ActiveWorkoutScreen session={session} scale={scale} narrow={narrow} compactLandscape={compactLandscape}
            dispatch={dispatch} onReturnToPlan={returnToPlan} />
        : null;

  // Only the active route should expose controls or request TV focus.
  if (!focused) return null;

  // A direct workout link on a rest day has no session to display.
  if (screen === 'session' && !session) return <Redirect href="/" />;

  const footerText = (size: number) => ({ fontFamily: 'Nunito', fontSize: size * scale, color: palette.ink });
  return <View style={styles.root}>
    <ScrollView testID="screen-scroll" contentContainerStyle={[styles.scroll, compactLandscape && styles.compactScroll,
      { paddingHorizontal: narrow ? 22 : 70 * scale, paddingTop: (compactLandscape ? 22 : 44) * scale, paddingBottom: (compactLandscape ? 10 : 18) * scale }]}>
      <View testID={`screen-${screenState}`} style={styles.screenBody}>{body}</View>
      {!compactLandscape && <View style={[styles.footer, { marginTop: 24 * scale, paddingTop: 16 * scale, gap: 34 * scale }]}>
        <View style={styles.legend}><Ionicons name="move-outline" size={25 * scale} color={palette.muted} /><Text style={footerText(19)}>Arrows · Move</Text></View>
        <View style={styles.legend}><Ionicons name="radio-button-on-outline" size={25 * scale} color={palette.muted} /><Text style={footerText(19)}>Select · Choose</Text></View>
        <View style={styles.legend}><Ionicons name="return-down-back-outline" size={25 * scale} color={palette.muted} />
          <Text style={footerText(19)}>Back · {screen === 'plan' ? 'Exit' : 'Plan'}</Text></View>
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
