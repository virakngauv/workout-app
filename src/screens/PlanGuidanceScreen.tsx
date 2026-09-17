import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { RemoteButton, palette } from '../components/RemoteButton';
import { cardioOptions, planGuidance } from '../workout/plan';

type Props = {
  scale: number;
  narrow: boolean;
  onReturnToPlan: () => void;
};

export function PlanGuidanceScreen({ scale, narrow, onReturnToPlan }: Props) {
  const text = (size: number, bold = false) => ({
    color: palette.ink,
    fontFamily: bold ? 'NunitoBold' : 'Nunito',
    fontSize: size * scale,
    lineHeight: size * scale * 1.35,
  });
  const heading = (size: number) => ({
    color: palette.ink,
    fontFamily: 'Baloo',
    fontSize: size * scale,
    lineHeight: size * scale * 1.05,
  });

  return <View style={[styles.root, { gap: 18 * scale }]}>
    <View style={[styles.header, narrow && styles.headerNarrow, { gap: 16 * scale }]}>
      <View style={styles.titleRow}>
        <Ionicons name="information-circle-outline" size={52 * scale} color="#A56F59" />
        <View style={styles.titleCopy}>
          <Text style={text(19, true)}>REFERENCE PLAN</Text>
          <Text accessibilityRole="header" style={heading(narrow ? 44 : 56)}>Progress + safety</Text>
        </View>
      </View>
      <RemoteButton label="Back to weekly plan" icon="arrow-back" primary preferred scale={scale * 0.67}
        onPress={onReturnToPlan} testID="guidance-back" />
    </View>

    <View style={[styles.columns, narrow && styles.columnsNarrow, { gap: 18 * scale }]}>
      <View style={[styles.card, { borderRadius: 24 * scale, padding: 22 * scale, gap: 12 * scale }]}>
        <Text style={heading(34)}>How to progress</Text>
        <Text style={text(19, true)}>{planGuidance.intro}</Text>
        <Text style={text(18)}>{planGuidance.progress}</Text>
        <Text style={text(18)}>{planGuidance.goals}</Text>
        <Text style={text(18)}><Text style={text(18, true)}>Watch metrics: </Text>{planGuidance.metrics}</Text>
        <View style={[styles.safety, { borderRadius: 16 * scale, padding: 14 * scale, gap: 10 * scale }]}>
          <Ionicons name="warning-outline" size={28 * scale} color="#7C4837" />
          <Text style={[text(18, true), styles.safetyText]}>{planGuidance.safety}</Text>
        </View>
      </View>

      <View style={[styles.card, { borderRadius: 24 * scale, padding: 22 * scale, gap: 11 * scale }]}>
        <Text style={heading(34)}>Cardio options</Text>
        <Text style={text(18)}>Choose one option on scheduled cardio days:</Text>
        {cardioOptions.map((option, index) => <View key={option} style={[styles.option, { gap: 10 * scale }]}>
          <Text style={text(18, true)}>{index + 1}</Text>
          <Text style={[text(18), styles.optionText]}>{option}</Text>
        </View>)}
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerNarrow: { alignItems: 'stretch', flexDirection: 'column' },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  titleCopy: { flexShrink: 1 },
  columns: { flex: 1, flexDirection: 'row' },
  columnsNarrow: { flexDirection: 'column' },
  card: { flex: 1, backgroundColor: '#FDE8DC', borderColor: palette.border, borderWidth: 2 },
  safety: { alignItems: 'center', backgroundColor: '#FFD2BF', flexDirection: 'row' },
  safetyText: { flex: 1 },
  option: { alignItems: 'flex-start', flexDirection: 'row' },
  optionText: { flex: 1 },
});
