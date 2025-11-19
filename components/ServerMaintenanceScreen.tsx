import React from 'react';
import { View, ScrollView } from 'react-native';
import { VStack } from '~/components/ui/vstack';
import { Text } from '~/components/ui/text';
import { Button, ButtonText, ButtonIcon } from '~/components/ui/button';
import { AlertCircle, RefreshCw, Clock, HelpCircle } from 'lucide-react-native';

interface ServerMaintenanceScreenProps {
  onRetry?: () => void;
}

export function ServerMaintenanceScreen({
  onRetry,
}: ServerMaintenanceScreenProps) {
  return (
    <View className="flex-1 bg-background-0">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <VStack space="xl" className="w-full max-w-md items-center">
          {/* Icon */}
          <View className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-6">
            <AlertCircle size={64} color="#ea580c" />
          </View>

          {/* Title */}
          <VStack space="sm" className="items-center">
            <Text
              size="3xl"
              className="font-bold text-typography-900 dark:text-typography-0 text-center"
            >
              Server Under Maintenance
            </Text>
            <Text
              size="lg"
              className="text-typography-600 dark:text-typography-400 text-center"
            >
              We're currently performing scheduled maintenance to improve your
              experience.
            </Text>
          </VStack>

          {/* Message Card */}
          <View className="w-full rounded-lg border border-outline-200 dark:border-outline-800 bg-background-50 dark:bg-background-900 p-6">
            <Text
              size="md"
              className="mb-4 font-semibold text-typography-900 dark:text-typography-0"
            >
              What you can do:
            </Text>
            <VStack space="md">
              <View className="flex-row items-start gap-3">
                <Clock
                  size={20}
                  color="#3b82f6"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <Text
                  size="sm"
                  className="flex-1 text-typography-600 dark:text-typography-400"
                >
                  Wait a few minutes and try again
                </Text>
              </View>
              <View className="flex-row items-start gap-3">
                <RefreshCw
                  size={20}
                  color="#3b82f6"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <Text
                  size="sm"
                  className="flex-1 text-typography-600 dark:text-typography-400"
                >
                  Check your internet connection
                </Text>
              </View>
              <View className="flex-row items-start gap-3">
                <HelpCircle
                  size={20}
                  color="#3b82f6"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <Text
                  size="sm"
                  className="flex-1 text-typography-600 dark:text-typography-400"
                >
                  Contact support if the issue persists
                </Text>
              </View>
            </VStack>
          </View>

          {/* Retry Button */}
          {onRetry && (
            <Button
              action="primary"
              size="lg"
              className="w-full"
              onPress={onRetry}
            >
              <ButtonIcon as={RefreshCw} size={20} />
              <ButtonText>Try Again</ButtonText>
            </Button>
          )}

          {/* Footer */}
          <Text
            size="sm"
            className="pt-4 text-center text-typography-500 dark:text-typography-400"
          >
            The service will be back shortly. Thank you for your patience.
          </Text>
        </VStack>
      </ScrollView>
    </View>
  );
}

