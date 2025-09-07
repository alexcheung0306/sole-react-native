import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

import { ScreenContent } from '../components/ScreenContent';
import { AuthWrapper } from '../components/AuthWrapper';

export default function Modal() {
  return (
    <AuthWrapper>
      <ScreenContent path="app/modal.tsx" title="Modal"></ScreenContent>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </AuthWrapper>
  );
}
