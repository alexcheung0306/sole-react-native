import { X } from 'lucide-react-native';
import React from 'react';
import {
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
  ScrollView,
  Text,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface FormPageProps {
  // Page content
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

  // Content
  children: React.ReactNode;

  // Styling
  headerClassName?: string;
  contentClassName?: string;
  headerComponent?: React.ReactNode;
}

export function FormPage({
  title,
  submitButtonText = 'Save',
  submitButtonClassName,
  isSubmitting = false,
  hasErrors = false,
  isLoading = false,
  onSubmit,
  onClose,
  children,
  headerClassName,
  contentClassName,
  headerComponent,
}: FormPageProps) {
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    onClose?.();
    router.back();
  };

  const handleSubmit = () => {
    onSubmit();
  };

  return (
    <View style={styles.container}>
      {/* Blur Background */}
      <BlurView
        intensity={100}
        tint="dark"
        style={StyleSheet.absoluteFill}
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
          <TouchableOpacity 
            onPress={handleClose} 
            className="p-2 -ml-2" 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-white flex-1 text-center px-2" numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || hasErrors}
            className={`p-2 -mr-2 ${isSubmitting || hasErrors ? 'opacity-50' : ''} ${submitButtonClassName || ''}`}
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          className={contentClassName || 'flex-1'}
          showsVerticalScrollIndicator={false}
          pointerEvents="auto">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
});

