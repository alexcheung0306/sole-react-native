import { Modal, TouchableOpacity, View, Text, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function ProfileSettings() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { signOut } = useAuth();
  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/sign-in' as any);
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };
  return (
    <>
      <TouchableOpacity style={{ padding: 8 }} onPress={() => setShowSettingsModal(true)}>
        <Ionicons name="ellipsis-horizontal-outline" size={24} color="#fff" />
      </TouchableOpacity>
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}>
        <TouchableOpacity
          className="flex-1 justify-end bg-black/50"
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}>
          <View className="rounded-t-2xl bg-gray-800 p-4" onStartShouldSetResponder={() => true}>
            <View className="mb-2 h-1 w-10 self-center rounded-full bg-gray-600" />
            <TouchableOpacity
              className="border-b border-gray-700 px-6 py-4"
              onPress={() => {
                setShowSettingsModal(false);
                // Add settings functionality here
              }}>
              <Text className="text-lg text-white">Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="border-b border-gray-700 px-6 py-4"
              onPress={() => {
                setShowSettingsModal(false);
                // Add help functionality here
              }}>
              <Text className="text-lg text-white">Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-6 py-4"
              onPress={() => {
                setShowSettingsModal(false);
                handleSignOut();
              }}>
              <Text className="text-lg font-semibold text-red-500">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
