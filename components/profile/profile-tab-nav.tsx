import { Grid, User, Briefcase } from "lucide-react-native";
import { View, TouchableOpacity } from "react-native";

export function ProfileTabNav({ profileTab, setProfileTab }: { profileTab: string, setProfileTab: (tab: string) => void }) {
    return (
        <View className="border-t border-gray-800">
            <View className="flex-row">
                <TouchableOpacity
                    activeOpacity={1}
                    className={`flex-1 items-center border-b-2 py-3 ${profileTab === 'posts' ? 'border-white' : 'border-transparent'
                        }`}
                    onPress={() => setProfileTab('posts')}>
                    <Grid size={24} color={profileTab === 'posts' ? '#ffffff' : '#6b7280'} />
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={1}
                    className={`flex-1 items-center border-b-2 py-3 ${profileTab === 'talent' ? 'border-white' : 'border-transparent'
                        }`}
                    onPress={() => setProfileTab('talent')}>
                    <User size={24} color={profileTab === 'talent' ? '#ffffff' : '#6b7280'} />
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={1}
                    className={`flex-1 items-center border-b-2 py-3 ${profileTab === 'jobs' ? 'border-white' : 'border-transparent'
                        }`}
                    onPress={() => setProfileTab('jobs')}>
                    <Briefcase size={24} color={profileTab === 'jobs' ? '#ffffff' : '#6b7280'} />
                </TouchableOpacity>
            </View>
        </View>
    );
}