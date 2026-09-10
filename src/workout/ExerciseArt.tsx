import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { palette } from '../components/RemoteButton';
import type { Exercise } from './plan';

// Keep each image tied to its own movement; never reuse a pose for another exercise.
const illustrations: Record<string, { source: ImageSourcePropType; labels: string[] }> = {
  'goblet-squat': { source: require('../../assets/exercises/goblet-squat.png'), labels: ['Start', 'Lower'] },
  'romanian-deadlift': { source: require('../../assets/exercises/romanian-deadlift.png'), labels: ['Start', 'Hinge'] },
  'one-arm-row': { source: require('../../assets/exercises/one-arm-row.png'), labels: ['Start', 'Pull'] },
  'floor-press': { source: require('../../assets/exercises/floor-press.png'), labels: ['Lower', 'Press'] },
  'shoulder-press': { source: require('../../assets/exercises/shoulder-press.png'), labels: ['Start', 'Press'] },
  'glute-bridge': { source: require('../../assets/exercises/glute-bridge.png'), labels: ['Start', 'Lift'] },
  'dead-bug': { source: require('../../assets/exercises/dead-bug.png'), labels: ['Start', 'Extend'] },
  'reverse-lunge': { source: require('../../assets/exercises/reverse-lunge.png'), labels: ['Start', 'Step back'] },
  'bent-over-row': { source: require('../../assets/exercises/bent-over-row.png'), labels: ['Start', 'Pull'] },
  'lateral-raise': { source: require('../../assets/exercises/lateral-raise.png'), labels: ['Start', 'Raise'] },
  'wall-push-up': { source: require('../../assets/exercises/wall-push-up.png'), labels: ['Start', 'Lower'] },
  'plank': { source: require('../../assets/exercises/plank.png'), labels: ['Hold'] },
  'split-squat': { source: require('../../assets/exercises/split-squat.png'), labels: ['Start', 'Lower'] },
  'side-plank': { source: require('../../assets/exercises/side-plank.png'), labels: ['Hold'] },
  'kb-deadlift': { source: require('../../assets/exercises/kb-deadlift.png'), labels: ['Set up', 'Stand'] },
};
export function ExerciseArt({ exercise, scale = 1, preview = false }: { exercise: Exercise; scale?: number; preview?: boolean }) {
  const illustration = illustrations[exercise.id];
  const source = illustration?.source;
  return <View style={[styles.panel, { padding: 26 * scale, borderRadius: 70 * scale }]}>
    {preview && <Text style={[styles.eyebrow, { fontSize: 27 * scale }]}>First up:</Text>}
    <Text accessibilityRole="header" style={[styles.heading, { fontSize: 55 * scale, lineHeight: 62 * scale }]}>{exercise.name}</Text>
    {source ? <View style={styles.artFrame}><Image source={source} resizeMode="contain" accessibilityLabel={`${exercise.name}: ${illustration.labels.join(" and ")}`} style={styles.art} /></View> :
      <View style={styles.cueOnly}>
        <Text style={[styles.eyebrow, { fontSize: 24 * scale }]}>Form reminders</Text>
        {exercise.cues.map(cue => <View key={cue} style={styles.cue}><Ionicons name="checkmark-circle" size={30 * scale} color="#B87367" /><Text style={[styles.cueText, { fontSize: 29 * scale }]}>{cue}</Text></View>)}
      </View>}
    {source && <><View style={styles.labels}>{illustration.labels.map(label => <Text key={label} style={[styles.label, { fontSize: 25 * scale }]}>{label}</Text>)}</View>
      <View style={styles.cues}>{exercise.cues.slice(0, 2).map(cue => <View key={cue} style={styles.cue}><Ionicons name="checkmark-circle" size={27 * scale} color="#B87367" /><Text style={[styles.cueText, { fontSize: 23 * scale }]}>{cue}</Text></View>)}</View></>}
  </View>;
}
const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: '#FDE8DC', alignItems: 'center' },
  eyebrow: { fontFamily: 'NunitoBold', color: palette.muted },
  heading: { fontFamily: 'Baloo', color: palette.ink, textAlign: 'center' },
  artFrame: { width: '100%', flex: 1, minHeight: 260, marginTop: 12, overflow: 'hidden', borderRadius: 24, backgroundColor: palette.cream },
  art: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  labels: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  label: { fontFamily: 'NunitoBold', color: palette.ink },
  cueOnly: { flex: 1, justifyContent: 'center', gap: 30, width: '100%', padding: 24 },
  cues: { gap: 10, marginTop: 20, alignSelf: 'stretch' },
  cue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cueText: { fontFamily: 'Nunito', color: palette.ink, flexShrink: 1 },
});
