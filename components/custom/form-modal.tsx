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
  const insets = useSafeAreaInsets();

 

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

      <Modal transparent visible={isOpen} animationType="fade"  onRequestClose={handleClose}>
        <View style={styles.backdrop}>
          {/* Backdrop - only this area is pressable */}
          <TouchableOpacity
            activeOpacity={1}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
            }}
            onPress={handleClose}
          />

          {/* Modal container */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            pointerEvents="box-none">
            <View className="flex" style={styles.modalContent} pointerEvents="box-none">
              {/* Blur Background */}
              <BlurView
                intensity={100}
                tint="dark"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
              {/* Semi-transparent overlay for better contrast */}
              <View className="bg-black/12 absolute inset-0" />
              {/* Header */}
              <View
                className={headerClassName || 'border-b border-white/35 px-4 pb-3'}
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
    backgroundColor: 'rgba(0, 0, 0, 0)',
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
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
  },
});
