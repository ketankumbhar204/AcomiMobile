import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Users, UtensilsCrossed } from 'lucide-react-native';
import type { GenderPolicy } from '../../api/types';

export type FoodAvailability = 'INCLUDED' | 'AVAILABLE' | 'NONE';

const GENDER_LABEL: Record<GenderPolicy, string> = {
  MALE: 'Gents',
  FEMALE: 'Ladies',
  MIXED: 'Gents & Ladies',
};

const FOOD_LABEL: Record<FoodAvailability, string> = {
  INCLUDED: 'Food Included',
  AVAILABLE: 'Food Available',
  NONE: 'No Food',
};

export function sharingChipLabel(notes?: string | null): string | null {
  const raw = notes?.trim();
  if (!raw || raw === '-' || raw === '—' || raw === '–') return null;
  const text = ` ${raw.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  if (!text.trim()) return null;
  const sharingContext = /shar|occup|bed|person|room/.test(text);
  const numbers = [...text.matchAll(/\b(\d{1,2})\b/g)].map(match => Number(match[1]));
  const labels: string[] = [];
  if (/\bsingle\b/.test(text) || (sharingContext && numbers.includes(1))) labels.push('Single');
  if (/\bdouble\b|\btwin\b/.test(text) || (sharingContext && numbers.includes(2))) labels.push('2 Sharing');
  if (/\btriple\b/.test(text) || (sharingContext && numbers.includes(3))) labels.push('3 Sharing');
  if (sharingContext && numbers.includes(4)) labels.push('4 Sharing');
  if (sharingContext && numbers.includes(5)) labels.push('5 Sharing');
  const high = numbers.some(value => value >= 6 && value <= 30);
  if (sharingContext && high && labels.length === 0) labels.push('6+ Sharing');
  if (labels.length === 1) return labels[0] ?? null;
  if (labels.length > 1) {
    const numeric = labels.every(label => /^\d+ Sharing$/.test(label) || label === '6+ Sharing');
    if (numeric) {
      return `${labels.map(label => label.replace(' Sharing', '')).join('/')} Sharing`;
    }
    return labels.join(' / ');
  }
  return null;
}

type ListingFactsProps = {
  leading?: ReactNode;
  genderPolicy?: GenderPolicy | null;
  sharingNotes?: string | null;
  foodAvailability?: FoodAvailability | null;
  foodIncludedInRent?: boolean;
  /** Compact pills for the discovery card. Detail pages keep the default chips. */
  appearance?: 'default' | 'pills';
};

export function ListingFacts({
  leading,
  genderPolicy,
  sharingNotes,
  foodAvailability,
  foodIncludedInRent,
  appearance = 'default',
}: ListingFactsProps) {
  const gender = genderPolicy ? GENDER_LABEL[genderPolicy] : null;
  const sharing = sharingChipLabel(sharingNotes);
  const food = foodAvailability
    ? FOOD_LABEL[foodAvailability]
    : foodIncludedInRent
      ? FOOD_LABEL.INCLUDED
      : null;
  if (!leading && !gender && !sharing && !food) return null;

  return (
    <View style={[styles.row, appearance === 'pills' && styles.rowPills]}>
      {leading}
      {gender ? <Fact icon="people" label={gender} appearance={appearance} /> : null}
      {sharing ? <Fact icon="people" label={sharing} appearance={appearance} /> : null}
      {food ? <Fact icon="food" label={food} appearance={appearance} /> : null}
    </View>
  );
}

export function TypeChip({ label }: { label: string }) {
  return (
    <View style={styles.typeChip}>
      <Text style={styles.typeLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Fact({
  icon,
  label,
  appearance = 'default',
}: {
  icon: 'people' | 'food';
  label: string;
  appearance?: 'default' | 'pills';
}) {
  const Icon = icon === 'food' ? UtensilsCrossed : Users;
  return (
    <View style={[styles.chip, appearance === 'pills' && styles.chipPill]}>
      <Icon size={appearance === 'pills' ? 11 : 13} color="#0F6B4C" strokeWidth={2.2} />
      <Text style={[styles.label, appearance === 'pills' && styles.labelPill]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  rowPills: {
    flexWrap: 'nowrap',
    gap: 4,
  },
  typeChip: {
    borderRadius: 6,
    backgroundColor: '#F4F7F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  typeLabel: {
    color: '#10261F',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
    borderRadius: 6,
    backgroundColor: '#E7F6EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipPill: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 2,
  },
  label: {
    color: '#0F6B4C',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  labelPill: {
    fontSize: 10,
    fontWeight: '600',
  },
});
