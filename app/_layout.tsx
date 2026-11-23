import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular';
import { PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display/400Regular_Italic';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from '../src/store';
import { restoreSessionThunk } from '../src/store/slices/authSlice';
import { colors } from '../src/theme/tokens';
import { useArchiveLifecycle } from '../src/store/archiveLifecycle';
import { BrandReveal } from '../src/components/common/BrandReveal';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialSessionLoading } = useAppSelector((state) => state.auth);
  const [isBrandRevealed, setIsBrandRevealed] = useState(false);
  const finishReveal = useCallback(() => setIsBrandRevealed(true), []);

  useEffect(() => {
    void dispatch(restoreSessionThunk());
  }, [dispatch]);

  useArchiveLifecycle(user?.id);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style={isAuthenticated && isBrandRevealed ? 'dark' : 'light'} />
      {!isInitialSessionLoading && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory } }}>
          <Stack.Screen name="index" />
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="details/[source]/[id]" />
            <Stack.Screen name="reading-history" />
            <Stack.Screen name="collections" />
            <Stack.Screen name="reading-packs" />
            <Stack.Screen name="study/index" />
            <Stack.Screen name="study/[id]" />
            <Stack.Screen name="sky-viewer" />
          </Stack.Protected>
          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      )}
      {(!isBrandRevealed || isInitialSessionLoading) && <BrandReveal onFinish={finishReveal} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
