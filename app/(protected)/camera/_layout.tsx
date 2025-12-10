import { Stack } from 'expo-router';

export default function CameraLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen  
                name="edit" 
                options={{ 
                    presentation: 'modal',
                    headerShown: false 
                }} 
            />
            <Stack.Screen name="caption" />
        </Stack>
    );
}
