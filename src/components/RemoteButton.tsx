import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useRowFocus } from './RemoteFocusRows';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export const palette = { cream: '#FFF9F1', ink: '#49312B', muted: '#77584E', peach: '#FFE5D9', coral: '#ED8F87', border: '#EBC7B8' };
export function RemoteButton({ label, icon, onPress, preferred = false, onFocus, selected, primary = false, scale = 1, style, testID }: {
  label: string; icon?: IconName; onPress: () => void; preferred?: boolean; onFocus?: () => void;
  selected?: boolean; primary?: boolean; scale?: number; style?: StyleProp<ViewStyle>; testID?: string;
}) {
  const ref = useRef<View>(null);
  const rowFocus = useRowFocus(testID);
  const register = rowFocus?.register;
  const setRef = useCallback((node: View | null) => {
    ref.current = node;
    if (testID) register?.(testID, node);
  }, [register, testID]);
  useEffect(() => {
    if (Platform.OS !== 'web' || !rowFocus) return;
    const node = ref.current as unknown as HTMLElement | null;
    node?.setAttribute('data-focus-up', rowFocus.up);
    node?.setAttribute('data-focus-down', rowFocus.down);
    node?.setAttribute('data-focus-left', rowFocus.left);
    node?.setAttribute('data-focus-right', rowFocus.right);
  }, [rowFocus]);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!preferred) return;
    const id = setTimeout(() => {
      if (Platform.OS === 'web') (ref.current as unknown as { focus?: () => void })?.focus?.();
      else ref.current?.requestTVFocus?.();
    }, 100);
    return () => clearTimeout(id);
  }, [preferred]);
  return <Pressable ref={setRef}
    nextFocusUp={Platform.isTV && rowFocus ? rowFocus.nodes[rowFocus.up] : undefined}
    nextFocusDown={Platform.isTV && rowFocus ? rowFocus.nodes[rowFocus.down] : undefined}
    nextFocusLeft={Platform.isTV && rowFocus ? rowFocus.nodes[rowFocus.left] : undefined}
    nextFocusRight={Platform.isTV && rowFocus ? rowFocus.nodes[rowFocus.right] : undefined} testID={testID} accessibilityRole="button" accessibilityLabel={label} aria-pressed={selected}
    accessibilityState={selected === undefined ? undefined : { selected }} hasTVPreferredFocus={preferred}
    onFocus={() => { setFocused(true); if (testID) rowFocus?.remember(testID); onFocus?.(); }} onBlur={() => setFocused(false)} onPress={onPress}
    style={({ pressed }) => [styles.button, { paddingHorizontal: 24 * scale, paddingVertical: 14 * scale, borderRadius: 32 * scale, borderWidth: 3 * scale },
      primary && styles.primary, style, selected && styles.selected, focused && styles.focused, pressed && { opacity: 0.8 }]}>
    {icon && <Ionicons name={icon} size={(primary ? 38 : 28) * scale} color={palette.ink} />}
    <Text style={{ color: palette.ink, fontFamily: primary ? 'Baloo' : 'NunitoBold', fontSize: (primary ? 38 : 25) * scale, lineHeight: (primary ? 48 : 34) * scale }}>{label}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderColor: palette.border, backgroundColor: '#FFF6EE', minHeight: 48 },
  primary: { backgroundColor: palette.coral, borderColor: palette.coral },
  selected: { backgroundColor: '#FFD2BF', borderColor: '#D89982' },
  focused: { borderColor: palette.ink, outlineColor: palette.ink, outlineWidth: 2, outlineOffset: 3 },
});
