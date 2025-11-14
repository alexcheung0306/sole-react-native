import React, { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
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
}: CollapseDrawerProps) {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const visible = isControlled ? (open as boolean) : internalOpen;
  const translateY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        translateY.setValue(0);
      });
    }
  }, [visible, overlayOpacity, translateY]);

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);
  const toggleDrawer = () => setOpen(!visible);

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const { translationY } = event.nativeEvent;
        // Clamp to prevent upward swipes (only allow downward/positive values)
        if (translationY < 0) {
          translateY.setValue(0);
        }
      },
    }
  );

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      // Only allow closing on downward swipes (positive translationY)
      const shouldClose = translationY > 0 && (translationY > 140 || velocityY > 800);

      if (shouldClose) {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 600,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]).start(() => {
          translateY.setValue(0);
          closeDrawer();
        });
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 160,
          velocity: velocityY / 1000,
          useNativeDriver: false,
        }).start(() => {
          translateY.setValue(0);
        });
      }
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

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={closeDrawer}>
        <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
          {/* Backdrop layers - fill entire screen */}
          <BlurView 
            intensity={20} 
            tint="dark" 
            style={StyleSheet.absoluteFill}
          />
          <View 
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
          />
          
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
            <PanGestureHandler
              activeOffsetY={5}
              failOffsetY={-5}
              onGestureEvent={handleGestureEvent}
              onHandlerStateChange={handleStateChange}>
              <Animated.View
                style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
                {/* Large draggable handle area at the top */}
                {showHandle && (
                  <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                  </View>
                )}
                {renderSection(header)}
                {renderSection(content)}
                {renderSection(footer)}
              </Animated.View>
            </PanGestureHandler>
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
    maxHeight: '80%',
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
    overflow: 'hidden',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    // Much larger touch target area for better UX - entire top section is draggable
    minHeight: 72,
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

