import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type LayoutCardShellProps = {
  onPress: () => void;
  onLongPress?: () => void;
  menu?: React.ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  debugCardId?: string;
};

export function LayoutCardShell({
  onPress,
  onLongPress,
  menu,
  cardStyle,
  shellStyle,
  pressedStyle,
  children,
}: LayoutCardShellProps) {
  return (
    <View style={[styles.shell, shellStyle]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [cardStyle, pressed && pressedStyle]}>
        {children}
      </Pressable>
      {menu ? (
        <View style={styles.menuSlot} pointerEvents="box-none">
          {menu}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
  },
  menuSlot: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },
});
