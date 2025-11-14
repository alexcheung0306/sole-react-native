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
} from 'react-native';

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
}: FormModalProps) {
  const isControlled = typeof controlledOpen === 'boolean';
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? (controlledOpen as boolean) : internalOpen;

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

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-black">
          {/* Header */}
          <View
            className={
              headerClassName ||
              'flex-row items-center justify-between border-b border-gray-800 px-4 pb-3 pt-12'
            }>
            <TouchableOpacity onPress={handleClose} className="p-2">
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-white">{title}</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || hasErrors}
              className={`p-2 ${isSubmitting || hasErrors ? 'opacity-50' : ''} ${
                submitButtonClassName || ''
              }`}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text className="font-semibold text-blue-500">{submitButtonText}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            className={contentClassName || 'flex-1'}
            showsVerticalScrollIndicator={false}>
            {renderContent()}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
