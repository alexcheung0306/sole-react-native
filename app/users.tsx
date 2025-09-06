import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthWrapper } from '../components/AuthWrapper';
import { UserCard } from '../components/UserCard';

// Sample users data - replace with real API data
const sampleUsers = [
  {
    id: '1',
    username: 'john_doe',
    displayName: 'John Doe',
    bio: 'Photographer and creative director. Love capturing moments that tell stories.',
    location: 'New York, NY',
    profileImage: null,
  },
  {
    id: '2',
    username: 'sarah_wilson',
    displayName: 'Sarah Wilson',
    bio: 'UI/UX Designer passionate about creating beautiful and functional designs.',
    location: 'San Francisco, CA',
    profileImage: null,
  },
  {
    id: '3',
    username: 'mike_chen',
    displayName: 'Mike Chen',
    bio: 'Full-stack developer and tech enthusiast. Building the future one line of code at a time.',
    location: 'Seattle, WA',
    profileImage: null,
  },
  {
    id: '4',
    username: 'emma_davis',
    displayName: 'Emma Davis',
    bio: 'Marketing specialist and content creator. Helping brands tell their stories.',
    location: 'Los Angeles, CA',
    profileImage: null,
  },
  {
    id: '5',
    username: 'alex_rodriguez',
    displayName: 'Alex Rodriguez',
    bio: 'Product manager with a passion for user experience and innovation.',
    location: 'Austin, TX',
    profileImage: null,
  },
];

export default function UsersScreen() {
  const router = useRouter();

  const handleBackPress = () => {
    router.back();
  };

  const renderUser = ({ item }: { item: typeof sampleUsers[0] }) => (
    <UserCard
      userId={item.id}
      username={item.username}
      displayName={item.displayName}
      bio={item.bio}
      location={item.location}
      profileImage={item.profileImage}
    />
  );

  return (
    <AuthWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Users</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Users List */}
        <FlatList
          data={sampleUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </AuthWrapper>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  listContainer: {
    paddingVertical: 8,
  },
});
