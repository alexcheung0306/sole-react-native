import { Stack } from 'expo-router';

export default function AccountLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="talent-account" options={{ headerShown: false }} />
            <Stack.Screen name="client-account" options={{ headerShown: false }} />
        </Stack>
    );
}
