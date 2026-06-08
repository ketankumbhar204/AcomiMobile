import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Space } from '../api/types';
import { ListCard, Screen, SkeletonCard } from '../components/ui';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';

const DEMO_SPACE: Space = {
  id: '00000000-0000-0000-0000-000000000001',
  ownerId: '00000000-0000-0000-0000-000000000002',
  name: 'Demo Space',
  type: 'PG',
  address: null,
  contactNumber: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

type MySpacesNavigation = NativeStackNavigationProp<
  MainStackParamList,
  'MySpaces'
>;

export function MySpacesScreen() {
  const navigation = useNavigation<MySpacesNavigation>();
  const setSelectedSpace = useSpaceStore(state => state.setSelectedSpace);
  const [isLoading] = React.useState(false);

  const openSpace = (space: Space) => {
    setSelectedSpace(space);
    navigation.navigate('SpaceTabs', { spaceId: space.id });
  };

  return (
    <Screen>
      <View style={styles.heroAccent} />
      <Text style={styles.eyebrow}>Your properties</Text>
      <Text style={styles.heading}>Select a space</Text>
      <Text style={styles.subheading}>
        Open a space to view dashboard, members, meals, and more.
      </Text>

      {isLoading ? (
        <SkeletonCard />
      ) : (
        <ListCard
          title={DEMO_SPACE.name}
          subtitle={DEMO_SPACE.type}
          iconLabel="PG"
          onPress={() => openSpace(DEMO_SPACE)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroAccent: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: `${colors.primary}1A`,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
});
