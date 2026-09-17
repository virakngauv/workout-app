import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

if (Platform.OS === 'ios') SplashScreen.setOptions({ duration: 350, fade: true });
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Baloo: require('../../assets/fonts/Baloo2-ExtraBold.ttf'),
    Nunito: require('../../assets/fonts/Nunito-SemiBold.ttf'),
    NunitoBold: require('../../assets/fonts/Nunito-ExtraBold.ttf'),
    ...Ionicons.font,
  });
  const appReady = fontsLoaded || Boolean(fontError);
  const onRootLayout = useCallback(() => {
    if (appReady) void SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  return <View onLayout={onRootLayout} style={styles.root}>
    {fontError
      ? <Text>Unable to load the bundled fonts. Please reopen the app.</Text>
      : <Stack screenOptions={{ headerShown: false }} />}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F1', alignItems: 'stretch', justifyContent: 'center' },
});
