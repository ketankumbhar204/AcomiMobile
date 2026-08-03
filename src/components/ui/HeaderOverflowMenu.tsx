import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { navigationRef } from '../../navigation/navigationRef';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const MENU_GAP = 4;
const MENU_MIN_WIDTH = 200;

export type HeaderOverflowMenuItem = {
  id: string;
  label: string;
  onPress: () => void;
  /** Defaults to true */
  visible?: boolean;
  destructive?: boolean;
};

type OverflowMenuState = {
  anchor: LayoutRectangle;
  items: HeaderOverflowMenuItem[];
};

type OverflowMenuContextValue = {
  isMenuOpen: boolean;
  openMenu: (anchor: LayoutRectangle, items: HeaderOverflowMenuItem[]) => void;
  closeMenu: () => void;
};

const OverflowMenuContext = createContext<OverflowMenuContextValue | null>(null);

function useOverflowMenuContext(): OverflowMenuContextValue {
  const context = useContext(OverflowMenuContext);
  if (!context) {
    throw new Error('HeaderOverflowMenu must be used within OverflowMenuProvider');
  }
  return context;
}

type OverflowMenuProviderProps = {
  children: React.ReactNode;
};

/**
 * Popup layer uses a transparent full-screen host so the menu renders above
 * native navigation headers (which sit above normal JS views in the tree).
 */
export function OverflowMenuProvider({ children }: OverflowMenuProviderProps) {
  const [menuState, setMenuState] = useState<OverflowMenuState | null>(null);

  const closeMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  const openMenu = useCallback(
    (anchor: LayoutRectangle, items: HeaderOverflowMenuItem[]) => {
      const visibleItems = items.filter(item => item.visible !== false);
      if (visibleItems.length === 0) {
        return;
      }

      setMenuState({ anchor, items: visibleItems });
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      isMenuOpen: menuState !== null,
      openMenu,
      closeMenu,
    }),
    [closeMenu, menuState, openMenu],
  );

  useEffect(() => {
    if (menuState === null) {
      return;
    }

    const unsubscribe = navigationRef.addListener('state', closeMenu);
    return unsubscribe;
  }, [closeMenu, menuState]);

  const handleSelect = useCallback(
    (item: HeaderOverflowMenuItem) => {
      closeMenu();
      requestAnimationFrame(() => {
        item.onPress();
      });
    },
    [closeMenu],
  );

  const menuPosition = menuState
    ? computeMenuPosition(menuState.anchor)
    : null;

  return (
    <OverflowMenuContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={menuState !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
        statusBarTranslucent>
        <Pressable
          style={styles.backdrop}
          onPress={closeMenu}
          accessibilityRole="button"
          accessibilityLabel="Dismiss menu">
          {menuState && menuPosition ? (
            <Pressable
              style={[
                styles.menu,
                {
                  top: menuPosition.top,
                  left: menuPosition.left,
                  minWidth: MENU_MIN_WIDTH,
                },
              ]}
              onPress={event => event.stopPropagation()}>
              {menuState.items.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    index < menuState.items.length - 1 && styles.menuItemBorder,
                    pressed && styles.menuItemPressed,
                  ]}
                  accessibilityRole="menuitem">
                  <Text
                    style={[
                      styles.menuItemLabel,
                      item.destructive && styles.menuItemDestructive,
                    ]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </OverflowMenuContext.Provider>
  );
}

function computeMenuPosition(anchor: LayoutRectangle): {
  top: number;
  left: number;
} {
  const windowWidth = Dimensions.get('window').width;
  const menuWidth = MENU_MIN_WIDTH;
  const rightAlignedLeft = anchor.x + anchor.width - menuWidth;
  const left = Math.max(
    spacing.sm,
    Math.min(rightAlignedLeft, windowWidth - menuWidth - spacing.sm),
  );

  return {
    top: anchor.y + anchor.height + MENU_GAP,
    left,
  };
}

type HeaderOverflowMenuProps = {
  items: HeaderOverflowMenuItem[];
  accessibilityLabel: string;
};

export function HeaderOverflowMenu({
  items,
  accessibilityLabel,
}: HeaderOverflowMenuProps) {
  const { isMenuOpen, openMenu, closeMenu } = useOverflowMenuContext();
  const triggerRef = useRef<View>(null);

  const visibleItems = useMemo(
    () => items.filter(item => item.visible !== false),
    [items],
  );

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const subscription = Dimensions.addEventListener('change', closeMenu);
    return () => subscription.remove();
  }, [closeMenu, isMenuOpen]);

  const handleOpen = () => {
    if (isMenuOpen) {
      closeMenu();
      return;
    }

    requestAnimationFrame(() => {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        const windowWidth = Dimensions.get('window').width;
        const anchor =
          width > 0 && height > 0
            ? { x, y, width, height }
            : {
                x: windowWidth - 52,
                y: 56,
                width: 44,
                height: 44,
              };

        openMenu(anchor, visibleItems);
      });
    });
  };

  return (
    <View ref={triggerRef} collapsable={false}>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: isMenuOpen }}>
        <MoreVertical size={22} color={colors.textPrimary} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  menuItemLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  menuItemDestructive: {
    color: '#DC2626',
  },
  trigger: {
    marginRight: spacing.sm,
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  triggerPressed: {
    opacity: 0.5,
  },
});
