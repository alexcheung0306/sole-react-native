import React, { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';

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

  const handleGestureEvent = Animated.event([{ nativeEvent: { translationY: translateY } }], {
    useNativeDriver: false,
  });

  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      const shouldClose = translationY > 140 || velocityY > 800;

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
        className=""
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={closeDrawer}>
        <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
          {closeOnBackdropPress ? (
            <TouchableOpacity
              activeOpacity={1}
              style={styles.backdropPressable}
              onPress={closeDrawer}
            />
          ) : (
            <View style={styles.backdropPressable} />
          )}

          <PanGestureHandler
            onGestureEvent={handleGestureEvent}
            onHandlerStateChange={handleStateChange}>
            <Animated.View style={[styles.sheetContainer, { transform: [{ translateY }] }]}>
              {showHandle && <View style={styles.dragHandle} />}
              {renderSection(header)}
              {renderSection(content)}
              {renderSection(footer)}
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.21)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
  },
  dragHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 12,
  },
});
