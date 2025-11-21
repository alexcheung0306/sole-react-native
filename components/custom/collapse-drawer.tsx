import React, { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
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

  // Initialize translateY - will be set properly in useEffect
  const translateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from bottom when opening
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true, // Use native driver for transforms
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true, // Use native driver for opacity
        }),
      ]).start();
    } else {
      // Slide down when closing
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: maxHeightValue,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true, // Use native driver for transforms
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true, // Use native driver for opacity
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, translateY, maxHeightValue]);

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);
  const toggleDrawer = () => setOpen(!visible);

  // Track the starting Y position when gesture begins
  const gestureStartY = useRef(0);

  // Pan gesture for dragging the drawer down to close
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(5) // Minimum distance to start gesture
        .activeOffsetY([-10, 5]) // Activate after 5px down or 10px up
        .failOffsetX([-25, 25]) // Fail if horizontal movement exceeds 25px
        .onStart(() => {
          // Store the current position when gesture begins
          gestureStartY.current = (translateY as any)._value || 0;
        })
        .onUpdate((event) => {
          const { translationY: deltaY } = event;
          // Calculate new absolute position
          const newY = gestureStartY.current + deltaY;
          // Only update if dragging down (positive deltaY)
          if (newY >= 0) {
            // Update the main translateY
            translateY.setValue(newY);
            // Update opacity based on position (fade out as dragged down)
            const opacity = Math.max(0, 1 - newY / maxHeightValue);
            overlayOpacity.setValue(opacity);
          } else {
            // If dragged up past top, reset to 0
            translateY.setValue(0);
            overlayOpacity.setValue(1);
          }
        })
        .onEnd((event) => {
          const { translationY: deltaY, velocityY } = event;
          const currentY = gestureStartY.current + deltaY;

          // Determine if we should close based on position and velocity
          // Lower threshold for easier closing - at least 60px down or fast swipe down
          const shouldClose = deltaY > 0 && (currentY > 60 || velocityY > 400);

          if (shouldClose) {
            // Slide down and close
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: maxHeightValue,
                duration: 200,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]).start(() => {
              closeDrawer();
            });
          } else {
            // Spring back to top position (0)
            Animated.parallel([
              Animated.spring(translateY, {
                toValue: 0,
                damping: 18,
                stiffness: 160,
                velocity: velocityY / 1000,
                useNativeDriver: true,
              }),
              Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]).start();
          }
          // Reset gesture values
          gestureStartY.current = 0;
        }),
    [translateY, overlayOpacity, maxHeightValue, closeDrawer]
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
      <TouchableOpacity onPress={openDrawer} activeOpacity={0.8}>
        {trigger}
      </TouchableOpacity>
    );
  }, [trigger, visible]);

  return (
    <>
      {triggerNode}

      <Modal visible={visible} animationType="fade" transparent onRequestClose={closeDrawer}>
        <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
          {/* Backdrop layers - fill entire screen */}
          <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

          {/* Backdrop touch blocker - always present to block touches */}
          {closeOnBackdropPress ? (
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={closeDrawer}
            />
          ) : (
            <View style={StyleSheet.absoluteFill} pointerEvents="none" />
          )}

          {/* Sheet container - positioned at bottom */}
          <View style={styles.sheetWrapper} pointerEvents="box-none">
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  styles.sheetContainer,
                  { 
                    transform: [{ translateY }], 
                    maxHeight: maxHeightValue,
                    height: maxHeightValue,
                  },
                ]}
                pointerEvents="box-none">
                {/* Draggable handle area - larger touch target */}
                {showHandle && (
                  <View 
                    style={styles.dragHandleContainer} 
                    collapsable={false}
                    pointerEvents="auto">
                    <View style={styles.dragHandle} />
                  </View>
                )}
                {/* Content area - scrollable */}
                <View style={{ flex: 1, minHeight: 0 }} pointerEvents="auto">
                  <ScrollView 
                    style={{ flex: 1, minHeight: 0 }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    nestedScrollEnabled={true}
                    scrollEnabled={true}>
                    <View style={{ flexDirection: 'column' }}>
                      {renderSection(header)}
                      {renderSection(content)}
                      {renderSection(footer)}
                    </View>
                  </ScrollView>
                </View>
              </Animated.View>
            </GestureDetector>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    // Much larger touch target area for better UX - entire top section is draggable
    minHeight: 48,
    // Additional padding to make it easier to grab
    marginBottom: 8,
  },
  dragHandle: {
    width: 64,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
    // Add shadow for better visibility and depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});
