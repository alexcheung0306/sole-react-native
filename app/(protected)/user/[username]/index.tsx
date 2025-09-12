import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getSoleUserBySoleUserId } from '~/api/apiservice';
import { getUserProfileByUsername } from '~/api/soleUser_api';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useUser } from '@clerk/clerk-expo';
import { useState } from 'react';
import { UserInfo } from '~/components/profile/userInfo';

export default function UserProfileScreen() {
  const router = useRouter();
  const { soleUserId } = useSoleUserContext()
  const [isUser, setIsUser] = useState(false)
  const { user } = useUser()
  const [isTalent, setIsTalent] = useState(false)
  const { username }: any = useLocalSearchParams()
  const [profileTab, setProfileTab] = useState("posts")
  // Fetch user data based on userId

  const {
    data: userProfileData,
    isLoading: userProfileIsLoading,
    error: userProfileError,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", username],
    queryFn: async () => {
      if (!user) {
        throw new Error("User not found")
      }
      const result: any = await getUserProfileByUsername(username)
      if (user?.username === username) {
        setIsUser(true)
      } else {
        setIsUser(false)
      }
      if (result.talentLevel) {
        setIsTalent(true)
      } else {
        setIsTalent(false)
      }
      try {
        result.comcard.photoConfig = JSON.parse(result.comcard.photoConfig)
      } catch (e) {
        console.log("Error: No Comcard", e)
      }
      return result
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!user && !!username && username != undefined,
    refetchOnWindowFocus: false,
  })


  const handleBackPress = () => {
    router.back();
  };

  if (userProfileIsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading user profile...</Text>
        </View>
      </View>
    );
  }

  if (userProfileError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text>Error loading user profile</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <UserInfo
          username={username}
          isUser={isUser}
          userInfo={userProfileData}
          isLoading={userProfileIsLoading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
