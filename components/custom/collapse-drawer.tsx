import React, { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';

type CollapseDrawerRenderFn = (helpers: {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
}) => React.ReactNode;

interface CollapseDrawerProps {
  trigger: React.ReactNode | CollapseDrawerRenderFn;
  header?: React.ReactNode | ((close: () => void) => React.ReactNode);
  content: React.ReactNode | ((close: () => void) => React.ReactNode);
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode);
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showHandle?: boolean;
  closeOnBackdropPress?: boolean;
  maxHeight?: number | string; // e.g., 500, '60%', '80%'
}

export function CollapseDrawer({
  trigger,
  header,
  content,
  footer,
  open,
  defaultOpen = false,
  onOpenChange,
  showHandle = true,
  closeOnBackdropPress = true,
  maxHeight = '80%',
}: CollapseDrawerProps) {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const visible = isControlled ? (open as boolean) : internalOpen;

  // Convert maxHeight to a number if it's a percentage string
  const maxHeightValue = useMemo(() => {
    if (typeof maxHeight === 'string' && maxHeight.endsWith('%')) {
      const percentage = parseFloat(maxHeight) / 100;
      return Dimensions.get('window').height * percentage;
    }
    return typeof maxHeight === 'number' ? maxHeight : Dimensions.get('window').height * 0.8;
  }, [maxHeight]);

  // Initialize translateY - using fixed value like rc-pos (500)
  const translateY = useRef(new Animated.Value(500)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  // Handle opening/closing animation - same pattern as rc-pos
  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isRendered) {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 500,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsRendered(false);
        translateY.setValue(500);
        backdropOpacity.setValue(0);
      });
    }
  }, [visible, translateY, backdropOpacity]);

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);
  const toggleDrawer = () => setOpen(!visible);

  // Pan gesture for dragging the drawer down to close - using new Gesture API
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0) // Allow immediate activation
        .activeOffsetY([0, 1]) // Activate on any downward movement
        .failOffsetX([-50, 50]) // Fail if horizontal movement exceeds 50px
        .onUpdate((event) => {
          const { translationY: newY } = event;
          // Only allow dragging down (positive values)
          if (newY >= 0) {
            translateY.setValue(newY);
            // Update opacity based on position (fade out as dragged down)
            const opacity = Math.max(0, 0.5 - newY / 500);
            backdropOpacity.setValue(opacity);
          }
        })
        .onEnd((event) => {
          const { translationY: finalY, velocityY } = event;

          // Close if dragged down more than 100px or with high velocity
          if (finalY > 100 || velocityY > 500) {
            Animated.timing(translateY, {
              toValue: 500,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              closeDrawer();
            });
          } else {
            // Snap back to original position
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }).start();
          }
        }),
    [translateY, backdropOpacity, closeDrawer]
  );

  const renderSection = (section?: React.ReactNode | ((close: () => void) => React.ReactNode)) => {
    if (!section) {
      return null;
    }
    return typeof section === 'function' ? section(closeDrawer) : section;
  };

  const triggerNode = useMemo(() => {
    if (typeof trigger === 'function') {
      return trigger({
        open: openDrawer,
        close: closeDrawer,
        toggle: toggleDrawer,
        isOpen: visible,
      });
    }

    if (isValidElement(trigger)) {
      const element = trigger as React.ReactElement<any>;
      return React.cloneElement(element, {
        onPress: (...args: any[]) => {
          if (typeof element.props?.onPress === 'function') {
            element.props.onPress(...args);
          }
          openDrawer();
        },
      });
    }

    return (
      <Pressable onPress={openDrawer}>
        {trigger}
      </Pressable>
    );
  }, [trigger, visible, openDrawer]);

  return (
    <>
      {triggerNode}

      <Modal visible={isRendered} animationType="none" transparent onRequestClose={closeDrawer}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* Backdrop */}
          {closeOnBackdropPress ? (
            <Pressable
              onPress={closeDrawer}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999,
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#000',
                  opacity: backdropOpacity,
                }}
              />
            </Pressable>
          ) : (
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#000',
                opacity: backdropOpacity,
                zIndex: 999,
              }}
              pointerEvents="none"
            />
          )}

          {/* Blur overlay */}
          <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Drawer */}
          <Animated.View
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: maxHeightValue,
              minHeight: maxHeightValue * 0.5,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderColor: 'rgba(255, 255, 255, 0.75)',
              borderWidth: 1,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              zIndex: 1000,
              elevation: 8,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [0, 500],
                    outputRange: [0, 500],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            }}
          >
            {/* Drawer Header - Draggable */}
            <GestureDetector gesture={panGesture}>
              <View>
                {/* Drag handle */}
                {showHandle && (
                  <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                  </View>
                )}
                {/* Header section */}
                {header && (
                  <View style={styles.headerContainer}>
                    {renderSection(header)}
                  </View>
                )}
              </View>
            </GestureDetector>

            {/* Drawer Content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              bounces={false}
              nestedScrollEnabled={true}
              scrollEnabled={true}
            >
              <View style={{ flexDirection: 'column' }}>
                {renderSection(content)}
                {renderSection(footer)}
              </View>
            </ScrollView>
          </Animated.View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  dragHandle: {
    width: 64,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerContainer: {
    width: '100%',
  },
});
