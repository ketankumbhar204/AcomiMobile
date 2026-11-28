import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminApi } from '../../api/adminApi';
import type {
  AdminListingMarketingTemplate,
  AdminUpsertListingMarketingTemplateRequest,
  ListingMarketingTemplateApplicability,
} from '../../api/types';
import { ApiError } from '../../api/types';
import {
  LISTING_MARKETING_PLACEHOLDERS,
  insertListingMarketingPlaceholder,
  unsupportedListingMarketingPlaceholders,
} from '../../admin/marketing/listingMarketingPlaceholders';
import {
  buildMessageForTemplate,
  type ListingMarketingTemplate,
} from '../../admin/marketing/listingMarketingTemplates';
import type { AdminStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { Button } from '../../components/ui';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'AdminListingMarketingTemplates'>;

type Draft = {
  name: string;
  description: string;
  body: string;
  applicability: ListingMarketingTemplateApplicability;
  active: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  body: '',
  applicability: 'PROPERTY',
  active: true,
};

const SAMPLE_FIELDS = {
  name: 'Sunrise PG',
  ownerName: 'Ravi',
  spaceType: 'PG',
  location: 'Wakad, Pune',
  address: '123 Main Road, Wakad',
  rentOrPrice: '₹8,000 / month',
  sharing: '2 sharing',
  amenities: 'WiFi, Laundry',
  foodIncluded: 'Breakfast + Dinner',
  genderPolicy: 'Male',
  description: 'Near IT park',
};

const APPLICABILITY_OPTIONS: ListingMarketingTemplateApplicability[] = [
  'PROPERTY',
  'MESS',
  'BOTH',
];

function toDraft(row: AdminListingMarketingTemplate): Draft {
  return {
    name: row.name,
    description: row.description ?? '',
    body: row.body,
    applicability: row.applicability,
    active: row.active,
  };
}

function toRequest(draft: Draft): AdminUpsertListingMarketingTemplateRequest {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    body: draft.body,
    applicability: draft.applicability,
    active: draft.active,
  };
}

export function AdminListingMarketingTemplatesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AdminListingMarketingTemplate[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const bodySelection = useRef({ start: 0, end: 0 });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('admin.nav.marketingTemplates', { defaultValue: 'Marketing templates' }),
    });
  }, [navigation, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listListingMarketingTemplates();
      setRows(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : t('admin.marketing.templatesPage.loadFailed', {
              defaultValue: 'Could not load marketing templates.',
            });
      showToast(message);
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const preview = useMemo(() => {
    const selectable: ListingMarketingTemplate = {
      key: editingId ? `custom:${editingId}` : 'custom:preview',
      name: draft.name || 'Preview',
      body: draft.body,
      kinds:
        draft.applicability === 'BOTH'
          ? ['PROPERTY', 'MESS']
          : [draft.applicability],
      builtin: false,
      active: draft.active,
    };
    return buildMessageForTemplate(selectable, SAMPLE_FIELDS);
  }, [draft, editingId]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    bodySelection.current = { start: 0, end: 0 };
    setEditorOpen(true);
  };

  const openEdit = (row: AdminListingMarketingTemplate) => {
    setEditingId(row.id);
    setDraft(toDraft(row));
    bodySelection.current = { start: row.body.length, end: row.body.length };
    setEditorOpen(true);
  };

  const insertPlaceholder = (token: string) => {
    const cursor = bodySelection.current.start;
    const next = insertListingMarketingPlaceholder(draft.body, token, cursor);
    const nextPos = cursor + `{{${token}}}`.length;
    bodySelection.current = { start: nextPos, end: nextPos };
    setDraft(prev => ({ ...prev, body: next }));
  };

  const saveDraft = async () => {
    if (!draft.name.trim()) {
      showToast(
        t('admin.marketing.templatesPage.nameRequired', { defaultValue: 'Name is required.' }),
      );
      return;
    }
    if (!draft.body.trim()) {
      showToast(
        t('admin.marketing.templatesPage.bodyRequired', { defaultValue: 'Body is required.' }),
      );
      return;
    }
    const unsupported = unsupportedListingMarketingPlaceholders(draft.body);
    if (unsupported.length > 0) {
      showToast(
        t('admin.marketing.templatesPage.unsupportedPlaceholders', {
          tokens: unsupported.map(token => `{{${token}}}`).join(', '),
          defaultValue: `Unsupported placeholders: ${unsupported.map(token => `{{${token}}}`).join(', ')}`,
        }),
      );
      return;
    }

    setSaving(true);
    try {
      const payload = toRequest(draft);
      if (editingId) {
        await adminApi.updateListingMarketingTemplate(editingId, payload);
        showToast(
          t('admin.marketing.templatesPage.updated', { defaultValue: 'Template updated.' }),
        );
      } else {
        await adminApi.createListingMarketingTemplate(payload);
        showToast(
          t('admin.marketing.templatesPage.created', { defaultValue: 'Template created.' }),
        );
      }
      setEditorOpen(false);
      await load();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : t('admin.marketing.templatesPage.saveFailed', {
              defaultValue: 'Could not save template.',
            });
      showToast(message);
    } finally {
      setSaving(false);
    }
  };

  const duplicateRow = async (id: string) => {
    setSaving(true);
    try {
      await adminApi.duplicateListingMarketingTemplate(id);
      showToast(
        t('admin.marketing.templatesPage.duplicated', { defaultValue: 'Template duplicated.' }),
      );
      await load();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : t('admin.marketing.templatesPage.saveFailed', {
              defaultValue: 'Could not save template.',
            });
      showToast(message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row: AdminListingMarketingTemplate) => {
    Alert.alert(
      t('admin.marketing.templatesPage.deleteTitle', { defaultValue: 'Delete template?' }),
      t('admin.marketing.templatesPage.deleteHint', {
        defaultValue: 'This cannot be undone. Existing share history keeps its snapshot.',
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSaving(true);
              try {
                await adminApi.deleteListingMarketingTemplate(row.id);
                showToast(
                  t('admin.marketing.templatesPage.deleted', {
                    defaultValue: 'Template deleted.',
                  }),
                );
                await load();
              } catch (err) {
                const message =
                  err instanceof ApiError
                    ? err.message
                    : t('admin.marketing.templatesPage.deleteFailed', {
                        defaultValue: 'Could not delete template.',
                      });
                showToast(message);
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ],
    );
  };

  const applicabilityLabel = (value: ListingMarketingTemplateApplicability) => {
    switch (value) {
      case 'MESS':
        return t('admin.marketing.templatesPage.applicabilityMess', { defaultValue: 'Mess' });
      case 'BOTH':
        return t('admin.marketing.templatesPage.applicabilityBoth', { defaultValue: 'Both' });
      default:
        return t('admin.marketing.templatesPage.applicabilityProperty', {
          defaultValue: 'Property',
        });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: spacing.section + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>
          {t('admin.marketing.templatesPage.title', {
            defaultValue: 'Listing marketing templates',
          })}
        </Text>
        <Text style={styles.pageSubtitle}>
          {t('admin.marketing.templatesPage.subtitle', {
            defaultValue:
              'Default promotional templates are editable. Create more with placeholders as needed.',
          })}
        </Text>

        <Button
          label={t('admin.marketing.templatesPage.create', { defaultValue: 'Create template' })}
          onPress={openCreate}
        />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {t('admin.marketing.templatesPage.customSection', {
              defaultValue: 'Templates',
            })}
          </Text>
          <Text style={styles.hint}>
            {t('admin.marketing.templatesPage.editableHint', {
              defaultValue:
                'Edit, duplicate, or delete any template. Defaults are seeded for you and fully editable.',
            })}
          </Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : rows.length === 0 ? (
            <Text style={styles.hint}>
              {t('admin.marketing.templatesPage.empty', {
                defaultValue: 'No templates yet. Create one or restart the backend to load defaults.',
              })}
            </Text>
          ) : (
            rows.map(row => (
              <View key={row.id} style={styles.rowCard}>
                <Text style={styles.rowTitle}>{row.name}</Text>
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {row.active
                        ? t('admin.marketing.templatesPage.active', { defaultValue: 'Active' })
                        : t('admin.marketing.templatesPage.inactive', {
                            defaultValue: 'Inactive',
                          })}
                    </Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{row.applicability}</Text>
                  </View>
                </View>
                {row.description ? <Text style={styles.hint}>{row.description}</Text> : null}
                <Text style={styles.bodyPreview} numberOfLines={4}>
                  {row.body}
                </Text>
                <View style={styles.actionsRow}>
                  <Button
                    label={t('common.edit')}
                    variant="secondary"
                    onPress={() => openEdit(row)}
                  />
                  <Button
                    label={t('admin.marketing.templatesPage.duplicate', {
                      defaultValue: 'Duplicate',
                    })}
                    variant="secondary"
                    disabled={saving}
                    onPress={() => {
                      void duplicateRow(row.id);
                    }}
                  />
                  <Button
                    label={t('admin.common.delete')}
                    variant="ghost"
                    disabled={saving}
                    onPress={() => confirmDelete(row)}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={editorOpen}
        animationType="slide"
        onRequestClose={saving ? undefined : () => setEditorOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: spacing.section + insets.bottom },
            ]}
            keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>
              {editingId
                ? t('admin.marketing.templatesPage.editTitle', { defaultValue: 'Edit template' })
                : t('admin.marketing.templatesPage.createTitle', {
                    defaultValue: 'Create template',
                  })}
            </Text>

            <Text style={styles.label}>
              {t('admin.marketing.templatesPage.name', { defaultValue: 'Name' })}
            </Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={value => setDraft(prev => ({ ...prev, name: value }))}
            />

            <Text style={styles.label}>
              {t('admin.marketing.templatesPage.description', { defaultValue: 'Description' })}
            </Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              value={draft.description}
              onChangeText={value => setDraft(prev => ({ ...prev, description: value }))}
            />

            <Text style={styles.label}>
              {t('admin.marketing.templatesPage.applicability', {
                defaultValue: 'Applicability',
              })}
            </Text>
            <View style={styles.chipRow}>
              {APPLICABILITY_OPTIONS.map(option => (
                <Pressable
                  key={option}
                  onPress={() => setDraft(prev => ({ ...prev, applicability: option }))}
                  style={[
                    styles.choiceChip,
                    draft.applicability === option && styles.choiceChipActive,
                  ]}>
                  <Text
                    style={[
                      styles.choiceChipText,
                      draft.applicability === option && styles.choiceChipTextActive,
                    ]}>
                    {applicabilityLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.labelInline}>
                {t('admin.marketing.templatesPage.active', { defaultValue: 'Active' })}
              </Text>
              <Switch
                value={draft.active}
                onValueChange={value => setDraft(prev => ({ ...prev, active: value }))}
                trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                thumbColor={draft.active ? colors.primary : '#F8FAFC'}
              />
            </View>

            <Text style={styles.label}>
              {t('admin.marketing.templatesPage.placeholders', {
                defaultValue: 'Placeholders',
              })}
            </Text>
            <View style={styles.chipRow}>
              {LISTING_MARKETING_PLACEHOLDERS.map(token => (
                <Pressable
                  key={token}
                  onPress={() => insertPlaceholder(token)}
                  style={styles.choiceChip}>
                  <Text style={styles.choiceChipText}>
                    {`{{${t(`admin.marketing.placeholders.${token}`, {
                      defaultValue: token,
                    })}}}`}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>
              {t('admin.marketing.templatesPage.body', { defaultValue: 'Body' })}
            </Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              multiline
              textAlignVertical="top"
              value={draft.body}
              onChangeText={value => setDraft(prev => ({ ...prev, body: value }))}
              onSelectionChange={event => {
                bodySelection.current = event.nativeEvent.selection;
              }}
            />
            <Text style={styles.hint}>
              {t('admin.marketing.templatesPage.bodyHint', {
                defaultValue: 'Use {{placeholders}} for listing fields. Missing values are omitted.',
              })}
            </Text>

            <View style={styles.previewBox}>
              <Text style={styles.label}>
                {t('admin.marketing.templatesPage.preview', { defaultValue: 'Live preview' })}
              </Text>
              <Text style={styles.previewText}>
                {preview ||
                  t('admin.marketing.templatesPage.previewEmpty', {
                    defaultValue: 'Preview appears here.',
                  })}
              </Text>
            </View>

            <Button
              label={
                saving
                  ? t('admin.marketing.templatesPage.saving', { defaultValue: 'Saving…' })
                  : t('common.save')
              }
              loading={saving}
              onPress={() => {
                void saveDraft();
              }}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              disabled={saving}
              onPress={() => setEditorOpen(false)}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: spacing.lg, gap: spacing.sm },
  pageTitle: { ...typography.h2, color: colors.textPrimary },
  pageSubtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  rowCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.sm,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  rowTitle: { ...typography.body, fontWeight: '800', color: colors.textPrimary },
  bodyPreview: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.section,
  },
  chipText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  actionsRow: { gap: spacing.sm },
  label: { ...typography.caption, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  labelInline: { ...typography.caption, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: colors.white,
    ...typography.body,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  bodyInput: { minHeight: 160 },
  choiceChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.section,
  },
  choiceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.selected,
  },
  choiceChipText: { ...typography.caption, fontWeight: '600', color: colors.textSecondary },
  choiceChipTextActive: { color: colors.tealDark },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  previewBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.sm,
    backgroundColor: colors.section,
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  previewText: { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
});
