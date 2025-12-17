import { Redirect } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';

export default function ProfileIndex() {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (user?.username) {
        return <Redirect href={`/(protected)/(user)/user/${user.username}`} />;
    }

    return <Redirect href="/(protected)/(user)/home" />;
}
