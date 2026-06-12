import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AccommodationSetupSampleNode } from '../../api/types';
import { colors, spacing, typography } from '../../theme';

type SetupPreviewTreeProps = {
  nodes: AccommodationSetupSampleNode[];
  depth?: number;
};

function PreviewNode({
  node,
  depth,
}: {
  node: AccommodationSetupSampleNode;
  depth: number;
}) {
  return (
    <View style={[styles.node, { marginLeft: depth * spacing.lg }]}>
      <Text style={styles.nodeLabel}>
        {node.label}
        {node.number ? ` (${node.number})` : ''}
      </Text>
      {node.children?.map((child, index) => (
        <PreviewNode key={`${child.type}-${child.number}-${index}`} node={child} depth={depth + 1} />
      ))}
    </View>
  );
}

export function SetupPreviewTree({ nodes, depth = 0 }: SetupPreviewTreeProps) {
  return (
    <View style={styles.root}>
      {nodes.map((node, index) => (
        <PreviewNode key={`${node.type}-${node.number}-${index}`} node={node} depth={depth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  node: {
    marginBottom: spacing.xs,
  },
  nodeLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
