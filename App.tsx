import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OverflowMenuProvider, Toast } from './src/components/ui';
import { AccommodationActionSheet } from './src/components/accommodation';
import { MemberMealActivityDaySheetHost } from './src/components/meals/MemberMealActivityDaySheetHost';
import { initI18n } from './src/i18n';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    initI18n()
      .catch(error => {
        console.error('[i18n] Initialization failed', error);
      })
      .finally(() => {
        setIsI18nReady(true);
      });
  }, []);

  if (!isI18nReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <OverflowMenuProvider>
          <RootNavigator />
          <Toast />
          <AccommodationActionSheet />
          <MemberMealActivityDaySheetHost />
        </OverflowMenuProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
