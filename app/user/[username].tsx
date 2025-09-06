import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { AuthWrapper } from '../../components/AuthWrapper';
import { getSoleUserBySoleUserId } from '../../api/apiservice';
import { getUserProfileByUsername } from '~/api/soleUser_api';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useUser } from '@clerk/clerk-expo';
import { useState } from 'react';

export default function UserProfileScreen( ) {
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

  //   const handleMessagePress = () => {
  //     // Navigate to chat with this user
  //     router.push(`/chat/${userId}`);
  //   };

  if (userProfileIsLoading) {
    return (
      <AuthWrapper>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user profile...</Text>
        </View>
      </AuthWrapper>
    );
  }

  if (userProfileError || !user) {
    return (
      <AuthWrapper>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </AuthWrapper>
    );
  }

  console.log('userProfileData', userProfileData);


  return (
    <AuthWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          {/* <TouchableOpacity style={styles.headerButton} onPress={handleMessagePress}>
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
          </TouchableOpacity> */}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          scroll
        </ScrollView>
      </View>
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  skillsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    color: '#666',
  },
});
