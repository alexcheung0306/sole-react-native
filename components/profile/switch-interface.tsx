import { TouchableOpacity, View, Text } from 'react-native';
import { Briefcase, User, Check } from 'lucide-react-native';
import { useNavigation } from '@/context/NavigationContext';

export function SwitchInterface() {
  const { currentMode, switchToClient, switchToUser } = useNavigation();

  const handleSelect = (mode: 'user' | 'client') => {
    if (mode !== currentMode) {
      if (mode === 'client') {
        switchToClient();
      } else {
        switchToUser();
      }
    }
  };

  return (
    <View className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" style={{ width: '100%' }}>
      <Text className="text-sm font-semibold text-white mb-3">Switch Mode</Text>
      
      <View className="gap-2">
        {/* User Option */}
        <TouchableOpacity
          onPress={() => handleSelect('user')}
          className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${
            currentMode === 'user'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/10 bg-white/5'
          }`}
          activeOpacity={0.7}>
          <View className="flex-row items-center gap-3">
            <View className={`rounded-full p-2 ${
              currentMode === 'user' ? 'bg-blue-500/20' : 'bg-white/10'
            }`}>
              <User size={20} color={currentMode === 'user' ? '#bfdbfe' : '#9ca3af'} />
            </View>
            <Text className={`text-sm font-semibold ${
              currentMode === 'user' ? 'text-white' : 'text-gray-400'
            }`}>
              User
            </Text>
          </View>
          {currentMode === 'user' && (
            <Check size={20} color="#3b82f6" />
          )}
        </TouchableOpacity>

        {/* Client Option */}
        <TouchableOpacity
          onPress={() => handleSelect('client')}
          className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${
            currentMode === 'client'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/10 bg-white/5'
          }`}
          activeOpacity={0.7}>
          <View className="flex-row items-center gap-3">
            <View className={`rounded-full p-2 ${
              currentMode === 'client' ? 'bg-blue-500/20' : 'bg-white/10'
            }`}>
              <Briefcase size={20} color={currentMode === 'client' ? '#bfdbfe' : '#9ca3af'} />
            </View>
            <Text className={`text-sm font-semibold ${
              currentMode === 'client' ? 'text-white' : 'text-gray-400'
            }`}>
              Client
            </Text>
          </View>
          {currentMode === 'client' && (
            <Check size={20} color="#3b82f6" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
