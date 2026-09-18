import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { fetchSignedContentUrlWithRetry } from '../../services/fileUploadService';

type ImagePreviewModalProps = {
  visible: boolean;
  imageUrl?: string | null;
  fileId?: string | null;
  title?: string;
  canEdit?: boolean;
  onReplace?: () => void;
  onRemove?: () => void;
  onClose: () => void;
};

export function ImagePreviewModal({
  visible,
  imageUrl,
  fileId,
  title,
  canEdit = false,
  onReplace,
  onRemove,
  onClose,
}: ImagePreviewModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const [resolvedUrl, setResolvedUrl] = React.useState<string | null>(imageUrl ?? null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sharing, setSharing] = React.useState(false);

  React.useEffect(() => {
    if (!visible) {
      setResolvedUrl(imageUrl ?? null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (fileId) {
          const url = await fetchSignedContentUrlWithRetry(fileId);
          if (!cancelled) {
            setResolvedUrl(url);
          }
          return;
        }
        if (imageUrl) {
          if (!cancelled) {
            setResolvedUrl(imageUrl);
          }
          return;
        }
        if (!cancelled) {
          setError(t('files.previewUnavailable', { defaultValue: 'No photo to display.' }));
        }
      } catch {
        if (!cancelled) {
          setError(
            t('files.downloadFailed', {
              defaultValue: 'Unable to download the file. Please try again.',
            }),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [visible, fileId, imageUrl, t]);

  const handleShare = async () => {
    if (!resolvedUrl) {
      return;
    }
    setSharing(true);
    try {
      await Share.share(
        resolvedUrl.startsWith('http') || resolvedUrl.startsWith('file:')
          ? { url: resolvedUrl, message: title ?? t('files.viewerTitle', { defaultValue: 'Photo' }) }
          : { message: resolvedUrl },
      );
    } catch {
      // User cancelled share sheet.
    } finally {
      setSharing(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title ?? t('files.viewerTitle', { defaultValue: 'Photo' })}</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={() => void handleShare()} hitSlop={12} disabled={!resolvedUrl || sharing}>
              <Text style={styles.close}>
                {t('files.share', { defaultValue: 'Share' })}
              </Text>
            </Pressable>
            {canEdit ? (
              <>
                <Pressable onPress={onReplace} hitSlop={12}>
                  <Text style={styles.close}>
                    {t('files.replace', { defaultValue: 'Replace photo' })}
                  </Text>
                </Pressable>
                <Pressable onPress={onRemove} hitSlop={12}>
                  <Text style={styles.close}>
                    {t('files.remove', { defaultValue: 'Remove photo' })}
                  </Text>
                </Pressable>
              </>
            ) : null}
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : error ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>{error}</Text>
          </View>
        ) : resolvedUrl ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}>
            <Image
              source={{ uri: resolvedUrl }}
              style={[styles.preview, { width: screenWidth - spacing.lg * 2 }]}
              resizeMode="contain"
            />
          </ScrollView>
        ) : (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>{t('paymentCollection.proof.noProofAvailable')}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
    marginRight: spacing.md,
  },
  close: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  preview: {
    minHeight: 320,
    aspectRatio: 0.75,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
});
