import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
  ScrollView,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TriggerHelpers = {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
};

interface FormModalProps {
  // Modal state (controlled or uncontrolled)
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Trigger button
  trigger?: React.ReactNode | ((helpers: TriggerHelpers) => React.ReactNode);
  triggerText?: string;
  triggerClassName?: string;
  showTrigger?: boolean;

  // Modal content
  title: string;
  submitButtonText?: string;
  submitButtonClassName?: string;

  // Form state
  isSubmitting?: boolean;
  hasErrors?: boolean;
  isLoading?: boolean;

  // Callbacks
  onSubmit: () => void;
  onClose?: () => void;
  onReset?: () => void;

  // Content
  children: React.ReactNode | ((close: () => void) => React.ReactNode);

  // Styling
  headerClassName?: string;
  contentClassName?: string;
  headerComponent?: React.ReactNode;
}

export function FormModal({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  trigger,
  triggerText = 'Edit',
  triggerClassName,
  showTrigger = true,
  title,
  submitButtonText = 'Save',
  submitButtonClassName,
  isSubmitting = false,
  hasErrors = false,
  isLoading = false,
  onSubmit,
  onClose,
  onReset,
  children,
  headerClassName,
  contentClassName,
  headerComponent,
}: FormModalProps) {
  const isControlled = typeof controlledOpen === 'boolean';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? (controlledOpen as boolean) : internalOpen;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isOpen, overlayOpacity]);

  const handleOpen = () => {
    if (!isControlled) {
      setInternalOpen(true);
    }
    onOpenChange?.(true);
  };

  const handleClose = () => {
    if (!isControlled) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
    onReset?.();
  };

  const handleToggle = () => {
    if (!isControlled) {
      setInternalOpen(!internalOpen);
    }
    onOpenChange?.(!isOpen);
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const renderTrigger = () => {
    if (!showTrigger) return null;

    if (typeof trigger === 'function') {
      return trigger({
        open: handleOpen,
        close: handleClose,
        toggle: handleToggle,
        isOpen,
      });
    }

    if (trigger) {
      return (
        <TouchableOpacity onPress={handleOpen} disabled={isLoading}>
          {trigger}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        className={triggerClassName || 'rounded-lg bg-gray-700 px-4 py-2'}
        onPress={handleOpen}
        disabled={isLoading}>
        <Text className="text-center font-semibold text-white">{triggerText}</Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (typeof children === 'function') {
      return children(handleClose);
    }
    return children;
  };

  return (
    <>
      {renderTrigger()}

      <Modal visible={isOpen} animationType="fade" transparent onRequestClose={handleClose}>
        <View style={styles.backdrop}>
          {/* Backdrop layers - fill entire screen */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}>
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
          </Animated.View>

          {/* Backdrop touch blocker */}
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
          />

          {/* Modal container */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            pointerEvents="box-none">
            <View className="flex bg-black/35" style={styles.modalContent} pointerEvents="box-none">
              {/* Header */}
              <View
                className={headerClassName || 'border-b border-white/10 px-4 pb-3'}
                style={{
                  paddingTop: (insets.top || 0) + (headerClassName?.includes('pt-4') ? 48 : 0)
                }}>
                <View className="flex-row items-center justify-between w-full" pointerEvents="auto">
                  <TouchableOpacity onPress={handleClose} className="p-2 -ml-2" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <X size={24} color="#ffffff" />
                  </TouchableOpacity>
                  <Text className="text-lg font-semibold text-white flex-1 text-center px-2" numberOfLines={1}>
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || hasErrors}
                    className={`p-2 -mr-2 ${isSubmitting || hasErrors ? 'opacity-50' : ''} ${submitButtonClassName || ''
                      }`}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <Text className="font-semibold text-blue-500" numberOfLines={1}>
                        {submitButtonText}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View>{headerComponent}</View>
              </View>

              {/* Content */}
              <ScrollView
                className={contentClassName || 'flex-1'}
                showsVerticalScrollIndicator={false}
                pointerEvents="auto">
                {renderContent()}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.75)',
  },
});
