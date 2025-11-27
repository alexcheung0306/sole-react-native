import React from 'react';
import { View, Text } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import ClientProfileScreen from './client/[username]/index';

export default function ClientProfileWrapper() {
  const { user } = useUser();

  if (!user?.username) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff' }}>User not logged in or username not available.</Text>
      </View>
    );
  }

  // Render ClientProfileScreen - it will use the current user's username as fallback
  return <ClientProfileScreen />;
}

