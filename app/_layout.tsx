import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from '../src/store';
import { restoreSessionThunk } from '../src/store/slices/authSlice';
import { colors } from '../src/theme/tokens';
import { useArchiveLifecycle } from '../src/store/archiveLifecycle';
import { BrandReveal } from '../src/components/common/BrandReveal';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialSessionLoading } = useAppSelector((state) => state.auth);
  const [isBrandRevealed, setIsBrandRevealed] = useState(false);
  const finishReveal = useCallback(() => setIsBrandRevealed(true), []);

  useEffect(() => {
    void dispatch(restoreSessionThunk());
  }, [dispatch]);

  useArchiveLifecycle(user?.id);

  return (
    <>
      <StatusBar style="dark" />
      {!isInitialSessionLoading && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory } }}>
          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="details/[source]/[id]" />
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
  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
