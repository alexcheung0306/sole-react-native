import React, { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
  Dimensions,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerStateChangeEvent,
  State,
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
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Slide down when closing
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: maxHeightValue,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
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
  // Use a separate animated value for gesture translation
  const gestureTranslateY = useRef(new Animated.Value(0)).current;

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: gestureTranslateY } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const { translationY: deltaY } = event.nativeEvent;
        // Calculate new absolute position
        const newY = gestureStartY.current + deltaY;
        // Update the main translateY, clamping to prevent negative values
        if (newY >= 0) {
          translateY.setValue(newY);
        } else {
          translateY.setValue(0);
        }
      },
    }
  );

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.BEGAN) {
      // Store the current position when gesture begins
      gestureStartY.current = (translateY as any)._value || 0;
      gestureTranslateY.setValue(0);
    } else if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY: deltaY, velocityY } = event.nativeEvent;
      const currentY = gestureStartY.current + deltaY;
      
      // Determine if we should close based on position and velocity
      const shouldClose = currentY > 0 && (currentY > 140 || velocityY > 800);

      if (shouldClose) {
        // Slide down and close
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: maxHeightValue,
            duration: 250,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]).start(() => {
          closeDrawer();
        });
      } else {
        // Spring back to top position (0)
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          velocity: velocityY / 1000,
          useNativeDriver: false,
        }).start();
      }
      // Reset gesture values
      gestureStartY.current = 0;
      gestureTranslateY.setValue(0);
    }
  };

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
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

          {/* Backdrop touch blocker - always present to block touches */}
          {closeOnBackdropPress ? (
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={closeDrawer}
            />
          ) : (
            <View style={StyleSheet.absoluteFill} pointerEvents="auto" />
          )}

          {/* Sheet container - positioned at bottom */}
          <View style={styles.sheetWrapper} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.sheetContainer,
                { transform: [{ translateY }], maxHeight: maxHeightValue },
              ]}>
              {/* Draggable handle area - only this area is draggable */}
              {showHandle && (
                <PanGestureHandler
                  activeOffsetY={5}
                  failOffsetY={-5}
                  onGestureEvent={handleGestureEvent}
                  onHandlerStateChange={handleStateChange}
                  shouldCancelWhenOutside={false}>
                  <Animated.View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                  </Animated.View>
                </PanGestureHandler>
              )}
              <View style={{ flex: 1, flexDirection: 'column' }}>
                {renderSection(header)}
                <View style={{ flex: 1, minHeight: 0 }}>{renderSection(content)}</View>
                {renderSection(footer)}
              </View>
            </Animated.View>
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
    // Much larger touch target area for better UX - entire top section is draggable
    minHeight: 24,
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
