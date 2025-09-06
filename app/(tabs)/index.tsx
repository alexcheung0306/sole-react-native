import { Stack } from 'expo-router';

import { StyleSheet, View } from 'react-native';

import { ScreenContent } from '../../components/ScreenContent';
import { Button, ButtonText } from '~/components/ui/button';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Tab One' }} />
      <View style={styles.container}>
        <ScreenContent path="app/(tabs)/index.tsx" title="Tab One" />
      </View>
      <Button variant="solid" size="md" action="primary" onPress={() => console.log('Button pressed')}>
        <ButtonText>Click me</ButtonText>
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
