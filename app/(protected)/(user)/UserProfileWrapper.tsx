import React from 'react';
import { View, Text } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import ProfileScreen from './user/[username]/index';

export default React.memo(function UserProfileWrapper() {
  const { user } = useUser();

  if (!user?.username) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff' }}>User not logged in or username not available.</Text>
      </View>
    );
  }

  // Render ProfileScreen - it will use the current user's username as fallback
  return <ProfileScreen />;
});
