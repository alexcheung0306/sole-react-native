import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { 
  Briefcase, 
  Award, 
  Users, 
  TrendingUp, 
  MapPin, 
  Globe,
  Mail,
  Calendar,
  Target,
  Sparkles
} from 'lucide-react-native';
import ProjectListCard from '~/components/projects/ProjectListCard';
import UserPosts from '~/components/profile/UserPosts';

const { width } = Dimensions.get('window');

interface ClientProfessionalProfileProps {
  userProfileData?: any;
  userPostsData?: any;
  username?: string;
  isOwnProfile?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  userIsLoading?: boolean;
  userIsError?: boolean;
  userError?: any;
  userHasNextPage?: boolean;
  userIsFetchingNextPage?: boolean;
  userFetchNextPage?: () => void;
  onScroll?: (event: any) => void;
  topPadding?: number;
  bottomPadding?: number;
}

export default function ClientProfessionalProfile({
  userProfileData,
  userPostsData,
  username,
  isOwnProfile = false,
  onRefresh,
  isRefreshing,
  userIsLoading,
  userIsError,
  userError,
  userHasNextPage,
  userIsFetchingNextPage,
  userFetchNextPage,
  onScroll,
  topPadding = 0,
  bottomPadding = 0,
}: ClientProfessionalProfileProps) {
  // Hardcoded demo data - replace with real data later
  const demoData = {
    profilePic: userProfileData?.userInfo?.profilePic || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    name: userProfileData?.userInfo?.name || 'Alex Chen',
    tagline: 'Creative Director & Producer',
    location: 'Los Angeles, CA',
    website: 'alexchen.studio',
    email: 'hello@alexchen.studio',
    bio: userProfileData?.userInfo?.bio || 'Passionate about bringing creative visions to life. I specialize in connecting talented individuals with exciting projects. With over 8 years of experience in production and talent management, I\'ve helped hundreds of creatives find their perfect opportunities.',
    yearsExperience: 8,
    totalProjects: 47,
    activeProjects: 12,
    completedProjects: 35,
    talentsHired: 128,
    successRate: 94,
    services: userProfileData?.userInfo?.category?.split(',').filter((c: string) => c.trim()) || [
      'Production Management',
      'Talent Casting',
      'Creative Direction',
      'Project Coordination'
    ],
    expertise: [
      { icon: '🎬', label: 'Film Production' },
      { icon: '📸', label: 'Photography' },
      { icon: '🎭', label: 'Talent Management' },
      { icon: '💼', label: 'Creative Consulting' },
    ],
    featuredProjects: [
      {
        id: 1,
        project: {
          id: 1,
          projectName: 'Summer Fashion Campaign 2024',
          status: 'Published',
          projectImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
          updatedAt: '2024-01-15T10:00:00Z',
        }
      },
      {
        id: 2,
        project: {
          id: 2,
          projectName: 'Music Video Production',
          status: 'InProgress',
          projectImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
          updatedAt: '2024-01-20T14:30:00Z',
        }
      },
      {
        id: 3,
        project: {
          id: 3,
          projectName: 'Commercial Ad Series',
          status: 'Published',
          projectImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
          updatedAt: '2024-01-10T09:15:00Z',
        }
      },
    ],
    achievements: [
      { icon: Award, label: 'Industry Leader', value: 'Top 10%' },
      { icon: TrendingUp, label: 'Growth Rate', value: '+23%' },
      { icon: Users, label: 'Network', value: '500+' },
    ],
  };

  const posts = userPostsData?.pages.flatMap((page: any) => page.data) ?? [];

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#000000' }}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
        flexGrow: 1,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing || false}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        ) : undefined
      }
    >
      {/* Personal Header Section */}
      <View className="px-4 pt-6 pb-4">
        <View className="items-center mb-4">
          <Image
            source={{ uri: demoData.profilePic }}
            className="w-24 h-24 rounded-full border-4 border-gray-700 mb-3"
          />
          <Text className="text-2xl font-bold text-white mb-1">
            {demoData.name}
          </Text>
          <Text className="text-base text-gray-300 mb-2">
            {demoData.tagline}
          </Text>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color="#9ca3af" />
              <Text className="text-sm text-gray-400">{demoData.location}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Globe size={14} color="#9ca3af" />
              <Text className="text-sm text-gray-400">{demoData.website}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isOwnProfile ? (
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-3 px-4 mb-3"
            onPress={() => router.push('/(protected)/account')}>
            <Text className="text-white font-semibold text-center">Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity className="flex-1 bg-blue-600 rounded-lg py-3">
              <Text className="text-white font-semibold text-center">Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-700 rounded-lg py-3">
              <Text className="text-white font-semibold text-center">Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Professional Stats */}
      <View className="px-4 mb-6">
        <View className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{demoData.totalProjects}</Text>
              <Text className="text-xs text-gray-400 mt-1">Projects</Text>
            </View>
            <View className="h-12 w-px bg-gray-700" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{demoData.activeProjects}</Text>
              <Text className="text-xs text-gray-400 mt-1">Active</Text>
            </View>
            <View className="h-12 w-px bg-gray-700" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{demoData.talentsHired}</Text>
              <Text className="text-xs text-gray-400 mt-1">Talents</Text>
            </View>
            <View className="h-12 w-px bg-gray-700" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{demoData.successRate}%</Text>
              <Text className="text-xs text-gray-400 mt-1">Success</Text>
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View className="px-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <Sparkles size={20} color="#3b82f6" />
          <Text className="text-lg font-semibold text-white">About</Text>
        </View>
        <View className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <Text className="text-gray-300 leading-6 mb-4">{demoData.bio}</Text>
          <View className="flex-row items-center gap-2">
            <Calendar size={16} color="#9ca3af" />
            <Text className="text-sm text-gray-400">
              {demoData.yearsExperience} years of experience
            </Text>
          </View>
        </View>
      </View>

      {/* What I Do / Services */}
      <View className="px-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <Target size={20} color="#3b82f6" />
          <Text className="text-lg font-semibold text-white">What I Do</Text>
        </View>
        <View className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <View className="flex-row flex-wrap gap-2 mb-4">
            {demoData.services.map((service: string, index: number) => (
              <View
                key={index}
                className="bg-blue-600/20 border border-blue-600/30 rounded-full px-4 py-2">
                <Text className="text-sm text-blue-400">{service}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row flex-wrap gap-4">
            {demoData.expertise.map((item: any, index: number) => (
              <View key={index} className="flex-row items-center gap-2">
                <Text className="text-xl">{item.icon}</Text>
                <Text className="text-sm text-gray-300">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Featured Projects */}
      <View className="px-4 mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Briefcase size={20} color="#3b82f6" />
            <Text className="text-lg font-semibold text-white">Featured Projects</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(protected)/(client)/projects')}>
            <Text className="text-sm text-blue-400">View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-3">
            {demoData.featuredProjects.map((project: any) => (
              <View key={project.id} style={{ width: width * 0.75 }}>
                <ProjectListCard item={project} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Achievements */}
      <View className="px-4 mb-6">
        <View className="flex-row items-center gap-2 mb-3">
          <Award size={20} color="#3b82f6" />
          <Text className="text-lg font-semibold text-white">Achievements</Text>
        </View>
        <View className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <View className="flex-row justify-around">
            {demoData.achievements.map((achievement: any, index: number) => {
              const IconComponent = achievement.icon;
              return (
                <View key={index} className="items-center">
                  <View className="bg-blue-600/20 rounded-full p-3 mb-2">
                    <IconComponent size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-lg font-bold text-white">{achievement.value}</Text>
                  <Text className="text-xs text-gray-400 mt-1">{achievement.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Posts Section */}
      {posts.length > 0 && (
        <View className="px-4 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Briefcase size={20} color="#3b82f6" />
            <Text className="text-lg font-semibold text-white">Recent Work</Text>
          </View>
          <UserPosts
            userIsLoading={userIsLoading || false}
            userIsError={userIsError || false}
            userError={userError || null}
            posts={posts}
            userHasNextPage={userHasNextPage || false}
            userIsFetchingNextPage={userIsFetchingNextPage || false}
            userFetchNextPage={userFetchNextPage || (() => {})}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        </View>
      )}

      {/* Contact Section */}
      {!isOwnProfile && (
        <View className="px-4 mb-6">
          <View className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <Text className="text-white font-semibold mb-3">Let's Work Together</Text>
            <TouchableOpacity className="flex-row items-center gap-2 mb-2">
              <Mail size={16} color="#3b82f6" />
              <Text className="text-blue-400">{demoData.email}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-2">
              <Globe size={16} color="#3b82f6" />
              <Text className="text-blue-400">{demoData.website}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

