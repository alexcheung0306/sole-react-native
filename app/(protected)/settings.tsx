import { View, TouchableOpacity, ScrollView, Text, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import {
  ChevronLeft,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSoleUserContext } from '~/context/SoleUserContext';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  route: string;
  isActivated: boolean;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const queryClient = useQueryClient();
  const { soleUser } = useSoleUserContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['soleUser'] });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <>
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="flex items-center justify-center p-2">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          title={'Settings'}
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
          headerRight={null}
          isScrollCollapsible={false}
        />
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{
            paddingTop: insets.top + 70, // Increased for header space
            paddingBottom: insets.bottom + 80,
          }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#93c5fd" />
          }>
          {/* Header Section */}
          <View className="mb-8">
            <Text className="mb-2 text-2xl font-bold text-white">Settings</Text>
            <Text className="text-sm leading-6 text-gray-400">
              Manage your settings and preferences.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
