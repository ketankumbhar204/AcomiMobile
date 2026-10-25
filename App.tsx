import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ConfirmDialogProvider,
  OverflowMenuProvider,
  QuickActionSheetProvider,
  Toast,
} from './src/components/ui';
import { EnquiryResultToast } from './src/components/discovery/EnquiryResultToast';
import { CoachmarkProvider } from './src/coachmarks';
import { AccommodationActionSheet } from './src/components/accommodation';
import { MemberMealActivityDaySheetHost } from './src/components/meals/MemberMealActivityDaySheetHost';
import { initI18n } from './src/i18n';
import { RootNavigator } from './src/navigation';
import { BrandSplash } from './src/components/brand/BrandSplash';
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
    return <BrandSplash />;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <ConfirmDialogProvider>
          <OverflowMenuProvider>
            <QuickActionSheetProvider>
              <CoachmarkProvider>
                <RootNavigator />
                <AccommodationActionSheet />
                <Toast />
                <EnquiryResultToast />
                <MemberMealActivityDaySheetHost />
              </CoachmarkProvider>
            </QuickActionSheetProvider>
          </OverflowMenuProvider>
        </ConfirmDialogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
