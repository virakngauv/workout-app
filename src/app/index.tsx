import { Platform, StyleSheet, Text, View } from 'react-native';

// A startup diagnostic only; this is not a proposed product screen or design.
export default function Index() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Development scaffold
      </Text>
      <Text style={styles.text}>
        {Platform.isTV ? 'TV runtime' : `${Platform.OS} runtime`}
      </Text>
      <Text style={styles.text}>No product UI has been implemented.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#111111',
    fontSize: 28,
  },
  text: {
    color: '#111111',
    fontSize: 20,
    textAlign: 'center',
  },
});
