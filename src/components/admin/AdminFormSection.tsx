import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui';
import { adminSection } from './adminStyles';

type AdminFormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AdminFormSection({ title, description, children }: AdminFormSectionProps) {
  return (
    <Card style={styles.card}>
      <Text style={adminSection.title}>{title}</Text>
      {description ? <Text style={adminSection.description}>{description}</Text> : null}
      <View style={styles.body}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  body: { gap: 12 },
});
