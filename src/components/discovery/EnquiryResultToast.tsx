import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useEnquiryFeedbackStore } from '../../store/enquiryFeedbackStore';

const TOAST_DURATION_MS = 7000;

export function EnquiryResultToast() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const toast = useEnquiryFeedbackStore(state => state.toast);
  const hideEnquiryToast = useEnquiryFeedbackStore(state => state.hideEnquiryToast);
  const error = toast?.tone === 'error';

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideEnquiryToast, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [hideEnquiryToast, toast]);

  if (!toast) return null;

  return (
    <View style={[styles.container, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <View
        accessibilityRole="alert"
        style={[styles.toast, error ? styles.error : styles.success]}>
        <View style={[styles.icon, error ? styles.iconError : styles.iconSuccess]}>
          {error ? <X size={16} color="#fff" /> : <Check size={16} color="#fff" />}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{toast.title}</Text>
          {toast.body ? <Text style={styles.body}>{toast.body}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
          onPress={hideEnquiryToast}
          hitSlop={8}>
          <X size={16} color="#5C6B66" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10000,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 448,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#0B1C16',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  success: {
    backgroundColor: '#D8F3E4',
    borderColor: '#8FCBAB',
  },
  error: {
    backgroundColor: '#FDECEC',
    borderColor: '#F5B4B4',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSuccess: {
    backgroundColor: '#0F6B4C',
  },
  iconError: {
    backgroundColor: '#DC2626',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#102A22',
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    marginTop: 2,
    color: '#3D4F48',
    fontSize: 13,
    lineHeight: 18,
  },
});
