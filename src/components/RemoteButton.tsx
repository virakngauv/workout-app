import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export const palette = { cream: '#FFF9F1', ink: '#49312B', muted: '#77584E', peach: '#FFE5D9', coral: '#ED8F87', border: '#EBC7B8' };
export function RemoteButton({ label, icon, onPress, preferred = false, onFocus, selected = false, primary = false, scale = 1, style, testID }: {
  label: string; icon?: IconName; onPress: () => void; preferred?: boolean; onFocus?: () => void;
  selected?: boolean; primary?: boolean; scale?: number; style?: StyleProp<ViewStyle>; testID?: string;
}) {
  const ref = useRef<View>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!preferred) return;
    const id = setTimeout(() => {
      if (Platform.OS === 'web') (ref.current as unknown as { focus?: () => void })?.focus?.();
      else ref.current?.requestTVFocus?.();
    }, 100);
    return () => clearTimeout(id);
  }, [preferred]);
  return <Pressable ref={ref} testID={testID} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ selected }} hasTVPreferredFocus={preferred}
    onFocus={() => { setFocused(true); onFocus?.(); }} onBlur={() => setFocused(false)} onPress={onPress}
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
