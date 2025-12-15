import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Users,
  Briefcase,
  CheckCircle,
  Settings,
  ArrowRight,
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

export default function AccountScreen() {
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

  const isTalent = soleUser?.talentLevel !== null && soleUser?.talentLevel !== undefined;
  const isClient = soleUser?.clientLevel !== null && soleUser?.clientLevel !== undefined;

  const features: Feature[] = [
    {
      icon: <Users size={24} color="#93c5fd" />,
      title: 'Model Account',
      description: 'Showcase your modeling talent and connect with fashion industry professionals',
      benefits: [
        'Create professional modeling profiles',
        'Apply for exclusive fashion shoots',
        'Build your portfolio with professional photos',
        'Connect with photographers and agencies',
        'Access premium modeling opportunities',
      ],
      route: '/account/talent-account',
      isActivated: isTalent,
    },
    {
      icon: <Briefcase size={24} color="#93c5fd" />,
      title: 'Client Account',
      description: 'Discover and hire the perfect models for your fashion projects',
      benefits: [
        'Browse verified model profiles',
        'Post custom casting calls',
        'Manage fashion project timelines',
        'Direct messaging with models',
        'Advanced search and filtering',
      ],
      route: '/account/client-account',
      isActivated: isClient,
    },
  ];

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
          title={'Account Activation'}
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#93c5fd"
            />
          }>
          {/* Header Section */}
          <View className="mb-8">
            <Text className="mb-2 text-2xl font-bold text-white">Account Activation</Text>
            <Text className="text-sm leading-6 text-gray-400">
              Choose your account type to access exclusive features and unlock the full power of our
              fashion platform.
            </Text>
          </View>

          {/* Features Grid */}
          <View className="mb-8 gap-6">
            {features.map((feature, index) => (
              <View
                key={feature.title}
                className="overflow-hidden rounded-lg border border-gray-700 bg-zinc-900">
                <View className="p-6">
                  {/* Icon and Title */}
                  <View className="mb-6 flex-row items-start gap-4">
                    <View className="rounded-lg border border-gray-700 bg-zinc-800 p-3">
                      {feature.icon}
                    </View>
                    <View className="flex-1">
                      <View className="mb-2 flex-row items-center gap-2">
                        <Text className="text-xl font-bold text-white">{feature.title}</Text>
                        {feature.isActivated && (
                          <View className="flex-row items-center gap-1 rounded-full bg-green-900 px-2 py-1">
                            <CheckCircle size={12} color="#22c55e" />
                            <Text className="text-xs font-medium text-green-400">Active</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm leading-5 text-gray-400">{feature.description}</Text>
                    </View>
                  </View>

                  {/* Benefits List */}
                  <View className="mb-6">
                    <Text className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-300">
                      Included Features
                    </Text>
                    <View>
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <View key={benefitIndex} className="mb-3 flex-row items-start gap-3">
                          <View className="mt-0.5">
                            <CheckCircle size={16} color="#93c5fd" />
                          </View>
                          <Text className="flex-1 text-sm text-gray-300">{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* CTA Button */}
                  <TouchableOpacity
                    className="w-full flex-row items-center justify-center gap-2 rounded-lg bg-zinc-700 px-6 py-4"
                    onPress={() => router.push(feature.route as any)}
                    activeOpacity={0.8}>
                    <Text className="font-semibold text-white">
                      {feature.isActivated
                        ? `Manage ${feature.title}`
                        : `Activate ${feature.title}`}
                    </Text>
                    {feature.isActivated ? (
                      <Settings size={16} color="#fff" />
                    ) : (
                      <ArrowRight size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Bottom CTA */}
          <View className="overflow-hidden rounded-lg border border-gray-700 bg-zinc-900">
            <View className="items-center p-8">
              <Text className="mb-4 text-center text-xl font-bold text-white">
                Ready to Get Started?
              </Text>
              <Text className="text-center text-sm leading-6 text-gray-400">
                Choose your account type above to begin your journey in the fashion industry and
                unlock all the features waiting for you.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
